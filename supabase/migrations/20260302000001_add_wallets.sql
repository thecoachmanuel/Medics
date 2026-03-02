
-- Create wallets table
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_user_id_key unique (user_id)
);

-- Enable RLS on wallets
alter table public.wallets enable row level security;

-- Create wallet_transactions table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('deposit', 'payment', 'refund', 'withdrawal')),
  reference text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on wallet_transactions
alter table public.wallet_transactions enable row level security;

-- RLS Policies for Wallets
create policy "Users can view their own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

-- RLS Policies for Wallet Transactions
create policy "Users can view their own wallet transactions"
  on public.wallet_transactions for select
  using (
    exists (
      select 1 from public.wallets
      where wallets.id = wallet_transactions.wallet_id
      and wallets.user_id = auth.uid()
    )
  );

-- Update payments provider check constraint
alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider in ('paystack', 'wallet'));

-- Function to handle wallet funding (deposit)
create or replace function public.fund_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_reference text
) returns void as $$
declare
  v_wallet_id uuid;
begin
  -- Get or create wallet
  insert into public.wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
  
  select id into v_wallet_id from public.wallets where user_id = p_user_id;
  
  -- Insert transaction
  insert into public.wallet_transactions (wallet_id, amount, type, reference, status, description)
  values (v_wallet_id, p_amount, 'deposit', p_reference, 'success', 'Wallet funding');
  
  -- Update balance
  update public.wallets
  set balance = balance + p_amount,
      updated_at = now()
  where id = v_wallet_id;
end;
$$ language plpgsql security definer;

-- Function to handle appointment payment via wallet
create or replace function public.pay_appointment_via_wallet(
  p_appointment_id uuid,
  p_user_id uuid,
  p_amount numeric
) returns boolean as $$
declare
  v_wallet_id uuid;
  v_balance numeric;
  v_doctor_id uuid;
  v_patient_id uuid;
begin
  -- Get wallet info
  select id, balance into v_wallet_id, v_balance
  from public.wallets
  where user_id = p_user_id;
  
  if v_wallet_id is null or v_balance < p_amount then
    return false;
  end if;

  -- Get appointment details
  select doctor_id, patient_id into v_doctor_id, v_patient_id
  from public.appointments
  where id = p_appointment_id;

  if v_patient_id != p_user_id then
      return false;
  end if;
  
  -- Deduct balance
  update public.wallets
  set balance = balance - p_amount,
      updated_at = now()
  where id = v_wallet_id;
  
  -- Insert transaction
  insert into public.wallet_transactions (wallet_id, amount, type, reference, status, description)
  values (v_wallet_id, -p_amount, 'payment', p_appointment_id::text, 'success', 'Appointment payment');
  
  -- Insert into payments
  insert into public.payments (
    appointment_id, doctor_id, patient_id, amount, status, provider, reference
  )
  values (
    p_appointment_id,
    v_doctor_id,
    v_patient_id,
    p_amount,
    'success',
    'wallet',
    'WALLET-' || p_appointment_id::text
  );
  
  return true;
end;
$$ language plpgsql security definer;

-- Function to handle refund for cancelled/missed appointments
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
