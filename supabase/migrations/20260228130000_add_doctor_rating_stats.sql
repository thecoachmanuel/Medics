-- Add rating stats columns to profiles if they don't exist
alter table public.profiles 
add column if not exists average_rating numeric default 0,
add column if not exists total_reviews integer default 0;

-- Function to calculate and update doctor rating stats
create or replace function public.update_doctor_rating_stats()
returns trigger
language plpgsql
security definer
as $$
declare
  _doctor_id uuid;
  _avg_rating numeric;
  _count integer;
begin
  -- Determine doctor_id based on operation
  if (TG_OP = 'DELETE') then
    _doctor_id = OLD.doctor_id;
  else
    _doctor_id = NEW.doctor_id;
  end if;

  -- Calculate new stats
  select 
    coalesce(avg(rating), 0),
    count(*)
  into 
    _avg_rating,
    _count
  from public.doctor_ratings
  where doctor_id = _doctor_id;

  -- Update profile
  update public.profiles
  set 
    average_rating = round(_avg_rating, 1),
    total_reviews = _count,
    updated_at = now()
  where id = _doctor_id;

  return null;
end;
$$;

-- Create trigger
drop trigger if exists on_doctor_rating_change on public.doctor_ratings;
create trigger on_doctor_rating_change
after insert or update or delete
on public.doctor_ratings
for each row
execute function public.update_doctor_rating_stats();

-- Backfill existing ratings
do $$
declare
  r record;
begin
  for r in select distinct doctor_id from public.doctor_ratings loop
    update public.profiles
    set 
      average_rating = (select round(coalesce(avg(rating), 0), 1) from public.doctor_ratings where doctor_id = r.doctor_id),
      total_reviews = (select count(*) from public.doctor_ratings where doctor_id = r.doctor_id)
    where id = r.doctor_id;
  end loop;
end;
$$;
