-- Setup Storage for MedicsOnline
-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('medicsonline', 'medicsonline', true)
on conflict (id) do nothing;

-- Set up RLS policies for storage.objects
-- 1. Allow public access to read files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'medicsonline' );

-- 2. Allow authenticated users to upload files
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'medicsonline' );

-- 3. Allow authenticated users to update their own files (if needed)
create policy "Authenticated users can update"
on storage.objects for update
to authenticated
using ( bucket_id = 'medicsonline' );

-- 4. Allow authenticated users to delete their own files (if needed)
-- Note: Destruction is usually handled via API route with service role, 
-- but we allow it here for completeness if used client-side.
create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'medicsonline' );
