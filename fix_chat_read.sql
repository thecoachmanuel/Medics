-- 1. Ensure the is_read column exists (in case it wasn't added previously)
ALTER TABLE public.appointment_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. Drop the existing 'Public update' policy which might be too restrictive
-- (e.g. it might only allow the sender to update the message)
DROP POLICY IF EXISTS "Public update" ON appointment_messages;

-- 3. Create a fresh, highly permissive update policy so that the recipient 
-- can successfully update 'is_read' to true for incoming messages.
CREATE POLICY "Public update" ON appointment_messages FOR UPDATE USING (true);
