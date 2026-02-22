-- Enable needed extensions
create extension if not exists pgcrypto;

-- homepage_content stores public marketing copy as a single JSON config
create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- doctor_taxonomies stores lists of specializations and categories as JSON
create table if not exists public.doctor_taxonomies (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- newsletter_subscribers stores user-submitted email addresses
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness on email
create unique index if not exists idx_newsletter_subscribers_email_unique
  on public.newsletter_subscribers (lower(email));

-- Query performance
create index if not exists idx_newsletter_subscribers_created_at
  on public.newsletter_subscribers (created_at);

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attach updated_at triggers to homepage_content and doctor_taxonomies if missing
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_homepage_content_updated_at'
  ) then
    create trigger trg_homepage_content_updated_at
    before update on public.homepage_content
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_doctor_taxonomies_updated_at'
  ) then
    create trigger trg_doctor_taxonomies_updated_at
    before update on public.doctor_taxonomies
    for each row execute function public.set_updated_at();
  end if;
end
$$ language plpgsql;

-- Row Level Security posture
alter table public.homepage_content enable row level security;
alter table public.doctor_taxonomies enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Allow public read of homepage content (marketing site needs to fetch it)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'homepage_content'
      and policyname = 'homepage_content_read_public'
  ) then
    execute 'create policy "homepage_content_read_public" '
         || 'on public.homepage_content '
         || 'for select '
         || 'to public '
         || 'using (true)';
  end if;
end
$$ language plpgsql;

-- No public policies for doctor_taxonomies and newsletter_subscribers; service role will access them.
