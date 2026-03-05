-- Add patient-specific fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;

-- Add blocked status column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies allow access (assuming existing policies handle row access)
-- If not, you might need to add policies, but typically adding columns doesn't break RLS unless specific column security is used.
