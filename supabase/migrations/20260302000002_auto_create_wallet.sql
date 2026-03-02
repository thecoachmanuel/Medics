
-- Trigger to create wallet on new user signup (via profiles creation)
create or replace function public.handle_new_user_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id, balance, currency)
  values (new.id, 0, 'NGN')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on public.profiles
drop trigger if exists on_profile_created_wallet on public.profiles;
create trigger on_profile_created_wallet
after insert on public.profiles
for each row
execute function public.handle_new_user_wallet();
