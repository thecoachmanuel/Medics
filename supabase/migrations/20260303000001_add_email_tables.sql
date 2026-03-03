create extension if not exists pgcrypto;

create table if not exists public.email_branding (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject text not null,
  html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_sends (
  id uuid primary key default gen_random_uuid(),
  segment text not null,
  subject text not null,
  body text not null,
  recipients_count integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_email_branding_updated_at') then
    create trigger trg_email_branding_updated_at
    before update on public.email_branding
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_email_templates_updated_at') then
    create trigger trg_email_templates_updated_at
    before update on public.email_templates
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.email_branding enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_marketing_sends enable row level security;

-- No public access; service role or admin API will access these tables.
