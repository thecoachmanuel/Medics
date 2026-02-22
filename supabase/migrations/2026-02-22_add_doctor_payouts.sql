-- Doctor payout requests table and RLS
create table if not exists public.doctor_payout_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists doctor_payout_requests_doctor_id_idx on public.doctor_payout_requests(doctor_id);
create index if not exists doctor_payout_requests_status_idx on public.doctor_payout_requests(status);
create index if not exists doctor_payout_requests_created_at_idx on public.doctor_payout_requests(created_at);

alter table public.doctor_payout_requests enable row level security;

-- Policies: doctors can insert/select their own requests; admins use service role
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_payout_requests' and policyname = 'doctor_payout_insert_own'
  ) then
    execute $$
      create policy doctor_payout_insert_own on public.doctor_payout_requests
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
    select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_payout_requests' and policyname = 'doctor_payout_select_own'
  ) then
    execute $$
      create policy doctor_payout_select_own on public.doctor_payout_requests
      for select to authenticated
      using (auth.uid() = doctor_id)
    $$;
  end if;
end$$ language plpgsql;

