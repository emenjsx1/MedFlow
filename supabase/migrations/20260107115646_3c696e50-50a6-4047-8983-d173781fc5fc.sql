-- Add follow-up automation settings to tenant_settings
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS followup_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS followup_days_threshold integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS followup_message_template text DEFAULT 'Olá {nome}! Notamos que faz um tempo desde sua última interação. Gostaríamos de saber como você está. Podemos ajudá-lo com algo?';

-- Remove revenue columns from patients table since there's no payment data
ALTER TABLE public.patients
DROP COLUMN IF EXISTS total_revenue;

COMMENT ON COLUMN public.tenant_settings.followup_enabled IS 'Enable automatic follow-up messages for patients stuck in pipeline stages';
COMMENT ON COLUMN public.tenant_settings.followup_days_threshold IS 'Days without interaction before sending follow-up';
COMMENT ON COLUMN public.tenant_settings.followup_message_template IS 'Template for follow-up message';