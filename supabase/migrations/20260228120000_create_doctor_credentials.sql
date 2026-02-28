-- Create doctor_credentials table
create table if not exists public.doctor_credentials (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups
create index if not exists doctor_credentials_doctor_id_idx on public.doctor_credentials(doctor_id);

-- Enable RLS
alter table public.doctor_credentials enable row level security;

-- Trigger for updated_at
drop trigger if exists set_doctor_credentials_updated_at on public.doctor_credentials;
create trigger set_doctor_credentials_updated_at
before update on public.doctor_credentials
for each row
execute function public.set_updated_at();

-- RLS Policies

-- Policy: Doctors can select their own credentials
drop policy if exists "doctor_credentials_select_own" on public.doctor_credentials;
create policy "doctor_credentials_select_own"
on public.doctor_credentials
for select
to authenticated
using (doctor_id = auth.uid());

-- Policy: Doctors can insert their own credentials
drop policy if exists "doctor_credentials_insert_own" on public.doctor_credentials;
create policy "doctor_credentials_insert_own"
on public.doctor_credentials
for insert
to authenticated
with check (doctor_id = auth.uid());

-- Policy: Doctors can delete their own credentials
drop policy if exists "doctor_credentials_delete_own" on public.doctor_credentials;
create policy "doctor_credentials_delete_own"
on public.doctor_credentials
for delete
to authenticated
using (doctor_id = auth.uid());

-- Note: Admins access via service role, so no explicit public policy needed for them 
-- if they use the service key. If they use an authenticated client with a specific 
-- admin role/claim in the future, a policy would be needed.
