-- Bank accounts for doctors
create table if not exists public.doctor_bank_accounts (
  doctor_id uuid primary key references public.profiles(id) on delete cascade,
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists doctor_bank_accounts_doctor_id_idx on public.doctor_bank_accounts(doctor_id);
alter table public.doctor_bank_accounts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_bank_accounts' and policyname = 'doctor_bank_select_own'
  ) then
    execute $$
      create policy doctor_bank_select_own on public.doctor_bank_accounts
      for select to authenticated
      using (auth.uid() = doctor_id)
    $$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_bank_accounts' and policyname = 'doctor_bank_upsert_own'
  ) then
    execute $$
      create policy doctor_bank_upsert_own on public.doctor_bank_accounts
      for insert to authenticated
      with check (auth.uid() = doctor_id)
    $$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_bank_accounts' and policyname = 'doctor_bank_update_own'
  ) then
    execute $$
      create policy doctor_bank_update_own on public.doctor_bank_accounts
      for update to authenticated
      using (auth.uid() = doctor_id)
      with check (auth.uid() = doctor_id)
    $$;
  end if;
end$$ language plpgsql;

