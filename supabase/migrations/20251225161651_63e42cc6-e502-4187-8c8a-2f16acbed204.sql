-- Add recurrence fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_rule text,
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS parent_appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Create index for recurring appointments
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON public.appointments(parent_appointment_id) WHERE parent_appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_recurring ON public.appointments(is_recurring) WHERE is_recurring = true;

-- Add comment for recurrence_rule format
COMMENT ON COLUMN public.appointments.recurrence_rule IS 'Recurrence pattern: weekly, biweekly, monthly';