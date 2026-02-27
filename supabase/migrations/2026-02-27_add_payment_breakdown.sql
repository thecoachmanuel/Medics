
alter table public.payments
add column if not exists consultation_fee numeric default 0,
add column if not exists platform_fee numeric default 0,
add column if not exists commission_amount numeric default 0,
add column if not exists platform_fee_percent numeric default 0,
add column if not exists commission_percent numeric default 0;
