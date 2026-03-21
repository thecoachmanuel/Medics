create table if not exists public.doctor_ratings (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id)
);

create index if not exists doctor_ratings_doctor_idx on public.doctor_ratings (doctor_id);
create index if not exists doctor_ratings_doctor_created_idx on public.doctor_ratings (doctor_id, created_at desc);

drop trigger if exists set_doctor_ratings_updated_at on public.doctor_ratings;
create trigger set_doctor_ratings_updated_at
before update on public.doctor_ratings
for each row
execute function public.set_updated_at();

alter table public.doctor_ratings enable row level security;

drop policy if exists "doctor_ratings_select_related" on public.doctor_ratings;
create policy "doctor_ratings_select_related"
on public.doctor_ratings
for select
to authenticated
using (
  doctor_id = auth.uid() or patient_id = auth.uid()
);

drop policy if exists "doctor_ratings_insert_patient" on public.doctor_ratings;
create policy "doctor_ratings_insert_patient"
on public.doctor_ratings
for insert
to authenticated
with check (patient_id = auth.uid());

drop policy if exists "doctor_ratings_update_patient" on public.doctor_ratings;
create policy "doctor_ratings_update_patient"
on public.doctor_ratings
for update
to authenticated
using (patient_id = auth.uid())
with check (patient_id = auth.uid());

