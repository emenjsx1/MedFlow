-- Create a separate table for sensitive secrets (admin-only access)
CREATE TABLE public.tenant_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  openai_api_key text,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.tenant_secrets ENABLE ROW LEVEL SECURITY;

-- Only admins can view secrets
CREATE POLICY "Only admins can view tenant secrets"
ON public.tenant_secrets
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can insert secrets
CREATE POLICY "Only admins can insert tenant secrets"
ON public.tenant_secrets
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update secrets
CREATE POLICY "Only admins can update tenant secrets"
ON public.tenant_secrets
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Migrate existing data to the new table
INSERT INTO public.tenant_secrets (tenant_id, openai_api_key, google_access_token, google_refresh_token, google_token_expires_at)
SELECT tenant_id, openai_api_key, google_access_token, google_refresh_token, google_token_expires_at
FROM public.tenant_settings
WHERE openai_api_key IS NOT NULL 
   OR google_access_token IS NOT NULL 
   OR google_refresh_token IS NOT NULL
ON CONFLICT (tenant_id) DO NOTHING;

-- Remove sensitive columns from tenant_settings
ALTER TABLE public.tenant_settings 
DROP COLUMN IF EXISTS openai_api_key,
DROP COLUMN IF EXISTS google_access_token,
DROP COLUMN IF EXISTS google_refresh_token,
DROP COLUMN IF EXISTS google_token_expires_at;

-- Add trigger for updated_at on tenant_secrets
CREATE TRIGGER update_tenant_secrets_updated_at
BEFORE UPDATE ON public.tenant_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();