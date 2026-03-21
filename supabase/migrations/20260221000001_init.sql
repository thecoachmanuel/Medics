create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  type text not null check (type in ('doctor', 'patient')),
  name text not null default '',
  email text,
  phone text,
  profile_image text,
  is_verified boolean not null default false,
  is_active boolean not null default true,

  dob date,
  gender text,
  blood_group text,
  age integer,
  medical_history jsonb,
  emergency_contact jsonb,

  specialization text,
  about text,
  category text[] not null default '{}'::text[],
  qualification text,
  experience integer,
  fees integer,
  hospital_info jsonb,

  availability_range jsonb,
  daily_time_ranges jsonb not null default '[]'::jsonb,
  slot_duration_minutes integer not null default 30,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_type_idx on public.profiles (type);
create index if not exists profiles_verified_idx on public.profiles (is_verified);
create index if not exists profiles_specialization_idx on public.profiles (specialization);
create index if not exists profiles_fees_idx on public.profiles (fees);
create index if not exists profiles_category_gin_idx on public.profiles using gin (category);
create index if not exists profiles_hospital_city_idx on public.profiles ((hospital_info->>'city'));

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'type', 'patient')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
    type = case when public.profiles.type is null then excluded.type else public.profiles.type end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public_doctors" on public.profiles;
create policy "profiles_select_public_doctors"
on public.profiles
for select
to public
using (type = 'doctor' and is_verified = true and is_active = true);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  patient_id uuid not null references public.profiles(id) on delete restrict,
  date date not null,
  slot_start_iso timestamptz not null,
  slot_end_iso timestamptz not null,
  consultation_type text not null default 'Video Consultation' check (consultation_type in ('Video Consultation', 'Voice Call')),
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled', 'In Progress')),
  symptoms text not null default '',
  zego_room_id uuid not null default gen_random_uuid(),
  fees integer not null default 0,
  prescription text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_doctor_date_idx on public.appointments (doctor_id, date);
create index if not exists appointments_patient_date_idx on public.appointments (patient_id, date);
create index if not exists appointments_doctor_slot_idx on public.appointments (doctor_id, slot_start_iso);

create unique index if not exists appointments_unique_active_doctor_slot
on public.appointments (doctor_id, slot_start_iso)
where status in ('Scheduled', 'In Progress');

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_participants" on public.appointments;
create policy "appointments_select_participants"
on public.appointments
for select
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid());

drop policy if exists "appointments_insert_patient" on public.appointments;
create policy "appointments_insert_patient"
on public.appointments
for insert
to authenticated
with check (patient_id = auth.uid());

drop policy if exists "appointments_update_participants" on public.appointments;
create policy "appointments_update_participants"
on public.appointments
for update
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid())
with check (doctor_id = auth.uid() or patient_id = auth.uid());

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  patient_id uuid not null references public.profiles(id) on delete restrict,
  amount integer not null,
  currency text not null default 'NGN',
  status text not null default 'initiated' check (status in ('success', 'pending', 'failed', 'refunded', 'initiated')),
  provider text not null default 'paystack' check (provider in ('paystack')),
  reference text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reference)
);

create index if not exists payments_appointment_idx on public.payments (appointment_id);
create index if not exists payments_doctor_idx on public.payments (doctor_id);
create index if not exists payments_patient_idx on public.payments (patient_id);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_select_participants" on public.payments;
create policy "payments_select_participants"
on public.payments
for select
to authenticated
using (doctor_id = auth.uid() or patient_id = auth.uid());

