-- Add UPDATE policy to appointment_messages so users can mark messages as read
CREATE POLICY "Public update" ON appointment_messages FOR UPDATE USING (true) WITH CHECK (true);
