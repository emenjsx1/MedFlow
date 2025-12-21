-- Add timezone and email notification settings to tenant_settings
ALTER TABLE public.tenant_settings 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS notify_owner_on_booking boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_emails text[] DEFAULT '{}';

-- Update tenants table to ensure timezone column exists
-- (it already exists, but ensuring consistency)