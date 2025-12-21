-- Add function to calculate risk level based on patient history
CREATE OR REPLACE FUNCTION public.calculate_patient_risk(p_patient_id uuid)
RETURNS public.risk_level AS $$
DECLARE
  total_appointments integer;
  cancelled_count integer;
  noshow_count integer;
  risk_percentage numeric;
BEGIN
  -- Get counts of appointments for this patient
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'no_show')
  INTO total_appointments, cancelled_count, noshow_count
  FROM public.appointments
  WHERE patient_id = p_patient_id;
  
  -- If no history, return low risk
  IF total_appointments = 0 OR total_appointments IS NULL THEN
    RETURN 'low'::public.risk_level;
  END IF;
  
  -- Calculate risk percentage (cancelled + no_shows) / total
  risk_percentage := ((cancelled_count + noshow_count)::numeric / total_appointments::numeric) * 100;
  
  -- Determine risk level
  IF risk_percentage >= 50 OR noshow_count >= 2 THEN
    RETURN 'high'::public.risk_level;
  ELSIF risk_percentage >= 25 OR noshow_count >= 1 THEN
    RETURN 'medium'::public.risk_level;
  ELSE
    RETURN 'low'::public.risk_level;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create a trigger to update appointment risk_level when status changes
CREATE OR REPLACE FUNCTION public.update_appointment_risk()
RETURNS TRIGGER AS $$
BEGIN
  -- Update risk level based on patient history
  IF NEW.patient_id IS NOT NULL THEN
    NEW.risk_level := public.calculate_patient_risk(NEW.patient_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger to appointments table
DROP TRIGGER IF EXISTS trigger_update_risk ON public.appointments;
CREATE TRIGGER trigger_update_risk
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_appointment_risk();

-- Add unique constraint for tenant_id + professional_name + scheduled_at (prevent double bookings for same professional)
-- First, handle existing duplicates by adding a suffix to professional_name
DO $$
DECLARE
  dup RECORD;
  counter INTEGER;
BEGIN
  FOR dup IN (
    SELECT tenant_id, scheduled_at, professional_name, COUNT(*) as cnt
    FROM public.appointments
    WHERE status IN ('pending', 'confirmed')
    GROUP BY tenant_id, scheduled_at, professional_name
    HAVING COUNT(*) > 1
  ) LOOP
    counter := 1;
    FOR dup IN (
      SELECT id 
      FROM public.appointments 
      WHERE tenant_id = dup.tenant_id 
        AND scheduled_at = dup.scheduled_at 
        AND (professional_name = dup.professional_name OR (professional_name IS NULL AND dup.professional_name IS NULL))
        AND status IN ('pending', 'confirmed')
      ORDER BY created_at ASC
      OFFSET 1
    ) LOOP
      UPDATE public.appointments 
      SET status = 'cancelled', 
          notes = COALESCE(notes, '') || ' [Auto-cancelled: duplicate booking]'
      WHERE id = dup.id;
    END LOOP;
  END LOOP;
END $$;

-- Create partial unique index (only for pending/confirmed appointments)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking 
ON public.appointments (tenant_id, scheduled_at, COALESCE(professional_name, 'default'))
WHERE status IN ('pending', 'confirmed');

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;