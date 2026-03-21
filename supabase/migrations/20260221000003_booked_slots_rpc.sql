create or replace function public.get_doctor_booked_slots(p_doctor_id uuid, p_date date)
returns table (slot_start_iso timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.slot_start_iso
  from public.appointments a
  where a.doctor_id = p_doctor_id
    and a.date = p_date
    and a.status in ('Scheduled', 'In Progress');
$$;

revoke all on function public.get_doctor_booked_slots(uuid, date) from public;
grant execute on function public.get_doctor_booked_slots(uuid, date) to anon, authenticated;
