
-- Admin wallet tracking functions

-- Function to get total wallet balance of all patients
create or replace function public.admin_total_wallet_balance()
returns numeric
language sql
stable
security definer
as $$
  select coalesce(sum(balance), 0)
  from public.wallets;
$$;

-- Function to list patient wallets with patient details
create or replace function public.admin_patient_wallets(
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  wallet_id uuid,
  user_id uuid,
  patient_name text,
  patient_email text,
  balance numeric,
  currency text,
  last_updated timestamptz
)
language sql
stable
security definer
as $$
  select
    w.id as wallet_id,
    w.user_id,
    p.name::text as patient_name,
    p.email::text as patient_email,
    w.balance,
    w.currency,
    w.updated_at as last_updated
  from public.wallets w
  join public.profiles p on p.id = w.user_id
  where
    (p_query is null
     or p.name ilike ('%' || p_query || '%')
     or p.email ilike ('%' || p_query || '%'))
  order by w.balance desc, w.updated_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

-- Function to list recent wallet funding transactions (deposits)
create or replace function public.admin_wallet_funding_history(
  p_query text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  transaction_id uuid,
  wallet_id uuid,
  user_id uuid,
  patient_name text,
  patient_email text,
  amount numeric,
  reference text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
as $$
  select
    t.id as transaction_id,
    t.wallet_id,
    w.user_id,
    p.name::text as patient_name,
    p.email::text as patient_email,
    t.amount,
    t.reference,
    t.status,
    t.created_at
  from public.wallet_transactions t
  join public.wallets w on w.id = t.wallet_id
  join public.profiles p on p.id = w.user_id
  where
    t.type = 'deposit'
    and (p_query is null
         or p.name ilike ('%' || p_query || '%')
         or p.email ilike ('%' || p_query || '%')
         or t.reference ilike ('%' || p_query || '%'))
    and (p_from is null or t.created_at >= p_from)
    and (p_to is null or t.created_at <= p_to)
  order by t.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;
