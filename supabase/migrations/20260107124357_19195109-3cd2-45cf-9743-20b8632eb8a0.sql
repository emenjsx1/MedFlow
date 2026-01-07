-- Create activity logs table for tracking all system events
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'BRL',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  max_patients INTEGER,
  max_professionals INTEGER,
  max_appointments_month INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add plan_id to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Activity logs policies - super admins can see all, users can see their tenant's
CREATE POLICY "Super admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()) OR tenant_id = get_user_tenant_id(auth.uid()));

-- Subscription plans policies - public read, super admin write
CREATE POLICY "Anyone can view active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true OR is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage plans" 
ON public.subscription_plans 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, is_featured, sort_order) VALUES
('Starter', 'starter', 'Para clínicas pequenas começando a automação', 97.00, 970.00, 
 '["Até 100 pacientes", "1 profissional", "Confirmações automáticas", "Agenda inteligente", "Suporte por email"]'::jsonb, 
 false, 1),
('Professional', 'professional', 'Para clínicas em crescimento', 197.00, 1970.00,
 '["Até 500 pacientes", "3 profissionais", "Tudo do Starter", "IA para agendamento", "Lista de espera", "Relatórios básicos", "WhatsApp integrado"]'::jsonb,
 true, 2),
('Enterprise', 'enterprise', 'Para clínicas de alto volume', 397.00, 3970.00,
 '["Pacientes ilimitados", "Profissionais ilimitados", "Tudo do Professional", "Multi-unidades", "API personalizada", "Suporte prioritário", "CRM completo", "Campanhas de marketing"]'::jsonb,
 false, 3);

-- Insert initial global_settings if not exists
INSERT INTO public.global_settings (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM public.global_settings);

-- Super admins policy for INSERT on global_settings
CREATE POLICY "Super admins can insert global settings" 
ON public.global_settings 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

-- Add index for performance
CREATE INDEX idx_activity_logs_tenant_id ON public.activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);