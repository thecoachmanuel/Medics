-- Track when users are online by adding a last_seen column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
