-- Create billing_settings table
create table if not exists public.billing_settings (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add trigger for updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_billing_settings_updated_at'
  ) then
    create trigger trg_billing_settings_updated_at
    before update on public.billing_settings
    for each row execute function public.set_updated_at();
  end if;
end
$$ language plpgsql;

-- Enable RLS
alter table public.billing_settings enable row level security;

-- Policies
-- Since the API uses service role key (which bypasses RLS), we don't strictly need permissive policies.
-- However, we can add a policy for authenticated users to read if needed in future.
-- For now, we'll keep it secure (service role only).
