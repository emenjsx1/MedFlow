-- Create global settings table for super admin configurations
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  google_client_id TEXT,
  google_client_secret TEXT,
  resend_api_key TEXT,
  lovable_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default row if not exists
INSERT INTO public.global_settings (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings);

-- Enable RLS on global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'super_admin'::app_role
  )
$$;

-- Only super_admin can access global settings
CREATE POLICY "Super admins can view global settings"
ON public.global_settings FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update global settings"
ON public.global_settings FOR UPDATE
USING (public.is_super_admin(auth.uid()));

-- Create function to check if trial expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT trial_ends_at < now() AND subscription_status = 'trial' FROM public.tenants WHERE id = _tenant_id),
    false
  )
$$;

-- Create function to check if subscription is valid
CREATE OR REPLACE FUNCTION public.has_valid_subscription(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = _tenant_id 
    AND (
      (subscription_status = 'trial' AND trial_ends_at > now())
      OR (subscription_status = 'active' AND (subscription_ends_at IS NULL OR subscription_ends_at > now()))
    )
    AND subscription_status != 'blocked'
  )
$$;

-- Drop old tenant policy and create new one that includes super admin
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;
CREATE POLICY "Users can view tenants"
ON public.tenants FOR SELECT
USING (
  id = get_user_tenant_id(auth.uid()) 
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can update all tenants"
ON public.tenants FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete tenants"
ON public.tenants FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Update profiles policy to include super admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR public.is_super_admin(auth.uid())
);

-- Update appointments policy
DROP POLICY IF EXISTS "Users can view appointments from their tenant" ON public.appointments;
CREATE POLICY "Users can view appointments"
ON public.appointments FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  OR public.is_super_admin(auth.uid())
);

-- Update patients policy  
DROP POLICY IF EXISTS "Users can view patients from their tenant" ON public.patients;
CREATE POLICY "Users can view patients"
ON public.patients FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  OR public.is_super_admin(auth.uid())
);

-- Update messages policy
DROP POLICY IF EXISTS "Users can view messages from their tenant" ON public.messages;
CREATE POLICY "Users can view messages"
ON public.messages FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  OR public.is_super_admin(auth.uid())
);