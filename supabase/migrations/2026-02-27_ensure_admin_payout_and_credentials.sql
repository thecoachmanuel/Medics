
-- Ensure doctor_credentials table exists
create table if not exists public.doctor_credentials (
  id uuid not null default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.doctor_credentials enable row level security;

drop policy if exists "Doctors can insert their own credentials" on public.doctor_credentials;
create policy "Doctors can insert their own credentials"
  on public.doctor_credentials for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can view their own credentials" on public.doctor_credentials;
create policy "Doctors can view their own credentials"
  on public.doctor_credentials for select
  using (auth.uid() = doctor_id);

drop policy if exists "Doctors can delete their own credentials" on public.doctor_credentials;
create policy "Doctors can delete their own credentials"
  on public.doctor_credentials for delete
  using (auth.uid() = doctor_id);

-- Ensure doctor_payout_requests table exists
create table if not exists public.doctor_payout_requests (
  id uuid not null default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.doctor_payout_requests enable row level security;

drop policy if exists "Doctors can insert payout requests" on public.doctor_payout_requests;
create policy "Doctors can insert payout requests"
  on public.doctor_payout_requests for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "Doctors can view their own payout requests" on public.doctor_payout_requests;
create policy "Doctors can view their own payout requests"
  on public.doctor_payout_requests for select
  using (auth.uid() = doctor_id);

-- Ensure doctor_bank_accounts table exists
create table if not exists public.doctor_bank_accounts (
  id uuid not null default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  bank_name text,
  account_name text,
  account_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id),
  unique(doctor_id)
);

alter table public.doctor_bank_accounts enable row level security;

drop policy if exists "Doctors can manage their bank account" on public.doctor_bank_accounts;
create policy "Doctors can manage their bank account"
  on public.doctor_bank_accounts for all
  using (auth.uid() = doctor_id);

-- Ensure billing_settings table exists
create table if not exists public.billing_settings (
  id uuid not null default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (id)
);

alter table public.billing_settings enable row level security;

drop policy if exists "Public read billing settings" on public.billing_settings;
create policy "Public read billing settings"
  on public.billing_settings for select
  using (true);
