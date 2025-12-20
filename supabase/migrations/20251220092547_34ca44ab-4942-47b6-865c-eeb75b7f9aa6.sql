-- Add clinic configuration columns to tenant_settings
ALTER TABLE public.tenant_settings 
ADD COLUMN IF NOT EXISTS clinic_name text,
ADD COLUMN IF NOT EXISTS clinic_address text,
ADD COLUMN IF NOT EXISTS clinic_phone text,
ADD COLUMN IF NOT EXISTS business_hours_start time DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS business_hours_end time DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN IF NOT EXISTS appointment_duration_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS openai_api_key text,
ADD COLUMN IF NOT EXISTS use_custom_openai boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agent_greeting_message text DEFAULT 'Olá! Bem-vindo à nossa clínica. Como posso ajudá-lo hoje?',
ADD COLUMN IF NOT EXISTS agent_booking_confirmation text DEFAULT 'Perfeito! Sua consulta foi agendada para {data} às {hora}. Até lá!';