do $$
begin
  alter table public.payments add column if not exists admin_commission_percent numeric(5,2);
exception when others then
end $$;

do $$
begin
  alter table public.payments add column if not exists admin_commission_amount integer;
exception when others then
end $$;

do $$
begin
  alter table public.payments add column if not exists doctor_net_amount integer;
exception when others then
end $$;

create index if not exists payments_created_at_idx on public.payments (created_at);
create index if not exists payments_doctor_created_at_idx on public.payments (doctor_id, created_at);

create or replace function public.admin_billing_admin_commission_percent()
returns numeric
language plpgsql
stable
security definer
as $$
declare
  v numeric;
begin
  select (config->>'adminCommissionPercent')::numeric
  into v
  from public.billing_settings
  order by created_at desc
  limit 1;

  if v is null or v < 0 or v > 100 then
    return 20;
  end if;

  return v;
exception when others then
  return 20;
end;
$$;

create or replace function public.admin_billing_max_withdrawal_percent()
returns numeric
language plpgsql
stable
security definer
as $$
declare
  v numeric;
begin
  select (config->>'maxWithdrawalPercent')::numeric
  into v
  from public.billing_settings
  order by created_at desc
  limit 1;

  if v is null or v < 0 or v > 100 then
    return 85;
  end if;

  return v;
exception when others then
  return 85;
end;
$$;

create or replace function public.admin_compute_commission_amount(p_amount integer, p_percent numeric)
returns integer
language sql
immutable
as $$
  select round((greatest(p_amount, 0)::numeric) * (greatest(least(p_percent, 100), 0) / 100.0))::integer;
$$;

create or replace function public.set_payment_commission_fields()
returns trigger
language plpgsql
security definer
as $$
declare
  v_percent numeric;
  v_commission integer;
  v_amount integer;
begin
  v_amount := coalesce(new.amount, 0);
  v_percent := coalesce(new.admin_commission_percent, public.admin_billing_admin_commission_percent());

  if v_percent < 0 or v_percent > 100 then
    v_percent := public.admin_billing_admin_commission_percent();
  end if;

  v_commission := public.admin_compute_commission_amount(v_amount, v_percent);
  new.admin_commission_percent := v_percent;
  new.admin_commission_amount := v_commission;
  new.doctor_net_amount := greatest(v_amount - v_commission, 0);
  return new;
end;
$$;

drop trigger if exists trg_payments_commission_fields on public.payments;
create trigger trg_payments_commission_fields
before insert or update of amount, admin_commission_percent
on public.payments
for each row
execute function public.set_payment_commission_fields();

update public.payments
set admin_commission_percent = public.admin_billing_admin_commission_percent()
where admin_commission_percent is null;

update public.payments
set
  admin_commission_amount = public.admin_compute_commission_amount(amount, admin_commission_percent),
  doctor_net_amount = greatest(amount - public.admin_compute_commission_amount(amount, admin_commission_percent), 0)
where admin_commission_amount is null or doctor_net_amount is null;

create or replace view public.admin_payments_view as
select
  p.id,
  p.created_at,
  p.updated_at,
  p.status,
  p.provider,
  p.reference,
  p.amount,
  p.currency,
  p.admin_commission_percent,
  p.admin_commission_amount,
  p.doctor_net_amount,
  p.appointment_id,
  a.status as appointment_status,
  a.slot_start_iso,
  a.slot_end_iso,
  p.doctor_id,
  d.name as doctor_name,
  d.email as doctor_email,
  p.patient_id,
  pt.name as patient_name,
  pt.email as patient_email
from public.payments p
left join public.appointments a on a.id = p.appointment_id
left join public.profiles d on d.id = p.doctor_id
left join public.profiles pt on pt.id = p.patient_id;

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
begin
  v_now_local := now() at time zone p_tz;
  v_today_start_local := date_trunc('day', v_now_local);
  v_week_start_local := date_trunc('week', v_now_local);
  v_month_start_local := date_trunc('month', v_now_local);

  v_today_start := v_today_start_local at time zone p_tz;
  v_week_start := v_week_start_local at time zone p_tz;
  v_month_start := v_month_start_local at time zone p_tz;

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
    )
  );
end;
$$;

create or replace function public.admin_doctor_financials(
  p_query text default null,
  p_limit integer default 200,
  p_offset integer default 0
)
returns table (
  doctor_id uuid,
  doctor_name text,
  doctor_email text,
  total_appointments bigint,
  paid_appointments bigint,
  gross_amount bigint,
  admin_commission_amount bigint,
  doctor_net_amount bigint,
  payouts_pending bigint,
  payouts_paid bigint,
  available_balance bigint,
  withdrawable_balance bigint
)
language sql
stable
security definer
as $$
  with doctors as (
    select p.id, p.name, p.email
    from public.profiles p
    where p.type = 'doctor'
      and (
        p_query is null
        or p.name ilike ('%' || p_query || '%')
        or p.email ilike ('%' || p_query || '%')
      )
    order by p.created_at desc
    limit greatest(p_limit, 1)
    offset greatest(p_offset, 0)
  ),
  appt_counts as (
    select a.doctor_id, count(*)::bigint as total_appointments
    from public.appointments a
    group by a.doctor_id
  ),
  pay_sums as (
    select
      p.doctor_id,
      count(*) filter (where p.status = 'success') as paid_appointments,
      coalesce(sum(p.amount) filter (where p.status = 'success'), 0) as gross_amount,
      coalesce(sum(p.admin_commission_amount) filter (where p.status = 'success'), 0) as admin_commission_amount,
      coalesce(sum(p.doctor_net_amount) filter (where p.status = 'success'), 0) as doctor_net_amount
    from public.payments p
    group by p.doctor_id
  ),
  payouts as (
    select
      r.doctor_id,
      coalesce(sum(r.amount) filter (where r.status in ('pending','approved')), 0) as payouts_pending,
      coalesce(sum(r.amount) filter (where r.status = 'paid'), 0) as payouts_paid
    from public.doctor_payout_requests r
    group by r.doctor_id
  ),
  calc as (
    select
      d.id as doctor_id,
      d.name::text as doctor_name,
      d.email::text as doctor_email,
      coalesce(a.total_appointments, 0) as total_appointments,
      coalesce(ps.paid_appointments, 0) as paid_appointments,
      coalesce(ps.gross_amount, 0) as gross_amount,
      coalesce(ps.admin_commission_amount, 0) as admin_commission_amount,
      coalesce(ps.doctor_net_amount, 0) as doctor_net_amount,
      coalesce(po.payouts_pending, 0) as payouts_pending,
      coalesce(po.payouts_paid, 0) as payouts_paid
    from doctors d
    left join appt_counts a on a.doctor_id = d.id
    left join pay_sums ps on ps.doctor_id = d.id
    left join payouts po on po.doctor_id = d.id
  )
  select
    c.doctor_id,
    c.doctor_name,
    c.doctor_email,
    c.total_appointments,
    c.paid_appointments,
    c.gross_amount,
    c.admin_commission_amount,
    c.doctor_net_amount,
    c.payouts_pending,
    c.payouts_paid,
    greatest(c.doctor_net_amount - c.payouts_pending - c.payouts_paid, 0) as available_balance,
    floor(greatest(c.doctor_net_amount - c.payouts_pending - c.payouts_paid, 0) * (public.admin_billing_max_withdrawal_percent() / 100.0))::bigint as withdrawable_balance
  from calc c
  order by available_balance desc, gross_amount desc;
$$;
