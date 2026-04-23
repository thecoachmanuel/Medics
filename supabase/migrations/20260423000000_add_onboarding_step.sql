-- Add onboarding_step to profiles table
alter table public.profiles 
add column if not exists onboarding_step integer default 1;
