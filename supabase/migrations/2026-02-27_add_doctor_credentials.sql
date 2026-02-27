-- Doctor credentials (uploaded documents or links)
create table if not exists public.doctor_credentials (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists doctor_credentials_doctor_id_idx on public.doctor_credentials(doctor_id);
create index if not exists doctor_credentials_created_at_idx on public.doctor_credentials(created_at);

alter table public.doctor_credentials enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_credentials' and policyname = 'doctor_credentials_insert_own'
  ) then
    execute $$
      create policy doctor_credentials_insert_own on public.doctor_credentials
      for insert to authenticated
      with check (
        auth.uid() = doctor_id and exists (
          select 1 from public.profiles p
          where p.id = doctor_id and p.type = 'doctor'
        )
      )
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'doctor_credentials' and policyname = 'doctor_credentials_select_own'
  ) then
    execute $$
      create policy doctor_credentials_select_own on public.doctor_credentials
      for select to authenticated
      using (
        auth.uid() = doctor_id and exists (
          select 1 from public.profiles p
          where p.id = doctor_id and p.type = 'doctor'
        )
      )
    $$;
  end if;
end$$ language plpgsql;

