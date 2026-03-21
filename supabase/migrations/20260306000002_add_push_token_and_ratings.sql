-- Add push_token to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token text;

-- Check if doctor_ratings exists and drop it to recreate correctly if needed (optional, but safer given the error)
-- OR just try to create if not exists
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Ensure columns exist if table already existed (idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_ratings' AND column_name = 'appointment_id') THEN
        ALTER TABLE public.doctor_ratings ADD COLUMN appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE;
        ALTER TABLE public.doctor_ratings ADD CONSTRAINT doctor_ratings_appointment_id_key UNIQUE (appointment_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_ratings' AND column_name = 'patient_id') THEN
        ALTER TABLE public.doctor_ratings ADD COLUMN patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_ratings' AND column_name = 'doctor_id') THEN
        ALTER TABLE public.doctor_ratings ADD COLUMN doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_ratings' AND column_name = 'rating') THEN
        ALTER TABLE public.doctor_ratings ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_ratings' AND column_name = 'comment') THEN
        ALTER TABLE public.doctor_ratings ADD COLUMN comment text;
    END IF;
END $$;

-- Add indexes for doctor_ratings if they don't exist
CREATE INDEX IF NOT EXISTS doctor_ratings_doctor_idx ON public.doctor_ratings (doctor_id);
CREATE INDEX IF NOT EXISTS doctor_ratings_patient_idx ON public.doctor_ratings (patient_id);
CREATE INDEX IF NOT EXISTS doctor_ratings_appointment_idx ON public.doctor_ratings (appointment_id);

-- Enable RLS on doctor_ratings
ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor_ratings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'doctor_ratings' AND policyname = 'Users can view ratings related to them'
    ) THEN
        CREATE POLICY "Users can view ratings related to them" ON public.doctor_ratings
            FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'doctor_ratings' AND policyname = 'Patients can insert their own ratings'
    ) THEN
        CREATE POLICY "Patients can insert their own ratings" ON public.doctor_ratings
            FOR INSERT WITH CHECK (auth.uid() = patient_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'doctor_ratings' AND policyname = 'Patients can update their own ratings'
    ) THEN
        CREATE POLICY "Patients can update their own ratings" ON public.doctor_ratings
            FOR UPDATE USING (auth.uid() = patient_id);
    END IF;
END $$;
