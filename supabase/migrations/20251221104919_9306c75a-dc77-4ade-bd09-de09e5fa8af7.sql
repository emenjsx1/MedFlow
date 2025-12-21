-- Create professionals table
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text,
  working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  business_hours_start time DEFAULT '08:00'::time,
  business_hours_end time DEFAULT '18:00'::time,
  appointment_duration_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  google_calendar_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view professionals from their tenant"
  ON public.professionals FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can insert professionals"
  ON public.professionals FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update professionals"
  ON public.professionals FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete professionals"
  ON public.professionals FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Add professional_id to appointments (nullable for backwards compatibility)
ALTER TABLE public.appointments 
  ADD COLUMN professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX idx_professionals_tenant ON public.professionals(tenant_id);

-- Drop the old unique constraint that was per tenant (need per professional now)
DROP INDEX IF EXISTS idx_appointments_no_double_booking;

-- Create new unique constraint per professional
CREATE UNIQUE INDEX idx_appointments_no_double_booking_professional 
  ON public.appointments (tenant_id, professional_id, scheduled_at)
  WHERE status IN ('pending', 'confirmed') AND professional_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();