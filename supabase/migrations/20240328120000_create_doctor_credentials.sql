-- Create doctor_credentials table
create table if not exists public.doctor_credentials (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references public.profiles(id) on delete cascade not null,
  url text not null,
  label text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.doctor_credentials enable row level security;

-- Policies
create policy "Doctors can manage their own credentials"
  on public.doctor_credentials
  for all
  using (auth.uid() = doctor_id);

-- Admins (using service role) bypass RLS automatically.
