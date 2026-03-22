-- Create the chat messages table
CREATE TABLE IF NOT EXISTS appointment_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE appointment_messages ENABLE ROW LEVEL SECURITY;

-- If policies already exist, drop them so we can re-create cleanly
DROP POLICY IF EXISTS "Public select" ON appointment_messages;
DROP POLICY IF EXISTS "Public insert" ON appointment_messages;

-- Create basic access policies
CREATE POLICY "Public select" ON appointment_messages FOR SELECT USING (true);
CREATE POLICY "Public insert" ON appointment_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime for the table so the chat UI updates instantly for both parties
-- Note: If you have already added this table to the publication, this line might throw a harmless notice/warning.
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_messages;
