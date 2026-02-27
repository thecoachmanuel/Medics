-- Billing settings single-row config table
create table if not exists public.billing_settings (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.billing_settings enable row level security;

-- No RLS policies: only service role should access this table.

