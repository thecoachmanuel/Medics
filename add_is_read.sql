-- Add is_read column to appointment_messages
ALTER TABLE public.appointment_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
