
-- Fix appointments status constraint to include Missed and Expired
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check 
  check (status in ('Scheduled', 'Completed', 'Cancelled', 'In Progress', 'Missed', 'Expired'));

-- Update admin_finance_kpis to include commission breakdown based on appointment status
create or replace function public.admin_finance_kpis(p_tz text default 'Africa/Lagos')
returns jsonb
language plpgsql
stable
security definer
as $$
declare
  v_now_local timestamp;
  v_today_start_local timestamp;
  v_week_start_local timestamp;
  v_month_start_local timestamp;
  v_today_start timestamptz;
  v_week_start timestamptz;
  v_month_start timestamptz;
  v_completed_today bigint;
  v_completed_week bigint;
  v_completed_month bigint;
  v_pending_today bigint;
  v_pending_week bigint;
  v_pending_month bigint;
  
  -- New variables for commission tracking
  v_commission_completed_total bigint;
  v_commission_pending_total bigint;
begin
  v_now_local := now() at time zone p_tz;
  v_today_start_local := date_trunc('day', v_now_local);
  v_week_start_local := date_trunc('week', v_now_local);
  v_month_start_local := date_trunc('month', v_now_local);

  v_today_start := v_today_start_local at time zone p_tz;
  v_week_start := v_week_start_local at time zone p_tz;
  v_month_start := v_month_start_local at time zone p_tz;

  -- Commission for Completed Meetings (Total)
  -- Payment success AND Appointment Completed
  select coalesce(sum(p.admin_commission_amount), 0)
  into v_commission_completed_total
  from public.payments p
  join public.appointments a on a.id = p.appointment_id
  where p.status = 'success' and a.status = 'Completed';

  -- Commission Pending (Total) - Scheduled or Ongoing Meetings
  -- Payment success BUT Appointment not yet completed
  select coalesce(sum(p.admin_commission_amount), 0)
  into v_commission_pending_total
  from public.payments p
  join public.appointments a on a.id = p.appointment_id
  where p.status = 'success' and a.status in ('Scheduled', 'In Progress');

  -- Original metrics (based on payment date/status only - ignoring appointment status)
  -- These track when the PAYMENT was made, not necessarily when the service was delivered
  select coalesce(sum(admin_commission_amount), 0)
  into v_completed_today
  from public.payments
  where status = 'success' and created_at >= v_today_start;

  select coalesce(sum(admin_commission_amount), 0)
  into v_completed_week
  from public.payments
  where status = 'success' and created_at >= v_week_start;

  select coalesce(sum(admin_commission_amount), 0)
  into v_completed_month
  from public.payments
  where status = 'success' and created_at >= v_month_start;

  select coalesce(sum(admin_commission_amount), 0)
  into v_pending_today
  from public.payments
  where status in ('pending','initiated') and created_at >= v_today_start;

  select coalesce(sum(admin_commission_amount), 0)
  into v_pending_week
  from public.payments
  where status in ('pending','initiated') and created_at >= v_week_start;

  select coalesce(sum(admin_commission_amount), 0)
  into v_pending_month
  from public.payments
  where status in ('pending','initiated') and created_at >= v_month_start;

  return jsonb_build_object(
    'completed', jsonb_build_object(
      'today', v_completed_today,
      'week', v_completed_week,
      'month', v_completed_month
    ),
    'pending', jsonb_build_object(
      'today', v_pending_today,
      'week', v_pending_week,
      'month', v_pending_month
    ),
    'total_commission_completed', v_commission_completed_total,
    'total_commission_pending', v_commission_pending_total
  );
end;
$$;

-- Ensure trigger exists for missed appointment refunds (re-applying logic from previous migration to be safe)
create or replace function public.refund_appointment_to_wallet(
  p_appointment_id uuid
) returns boolean as $$
declare
  v_payment_record record;
  v_wallet_id uuid;
begin
  -- Find successful payment for this appointment
  select * into v_payment_record
  from public.payments
  where appointment_id = p_appointment_id
  and status = 'success'
  limit 1;
  
  if v_payment_record.id is null then
    return false; -- No payment to refund
  end if;

  -- Get patient's wallet
  insert into public.wallets (user_id)
  values (v_payment_record.patient_id)
  on conflict (user_id) do nothing;

  select id into v_wallet_id
  from public.wallets
  where user_id = v_payment_record.patient_id;
  
  -- Refund to wallet
  update public.wallets
  set balance = balance + v_payment_record.amount,
      updated_at = now()
  where id = v_wallet_id;
  
  -- Insert transaction
  insert into public.wallet_transactions (wallet_id, amount, type, reference, status, description)
  values (v_wallet_id, v_payment_record.amount, 'refund', p_appointment_id::text, 'success', 'Appointment refund');
  
  -- Update payment status to refunded
  update public.payments
  set status = 'refunded',
      updated_at = now()
  where id = v_payment_record.id;
      
  return true;
end;
$$ language plpgsql security definer;

-- Trigger to automatically refund on Cancelled or Missed status
create or replace function public.handle_appointment_cancellation()
returns trigger as $$
begin
  if (new.status = 'Cancelled' or new.status = 'Missed') and (old.status != 'Cancelled' and old.status != 'Missed') then
    perform public.refund_appointment_to_wallet(new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_appointment_refund on public.appointments;
create trigger trg_appointment_refund
after update on public.appointments
for each row
execute function public.handle_appointment_cancellation();
