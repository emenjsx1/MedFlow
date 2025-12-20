-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show', 'rescheduled', 'in_replacement', 'filled');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.message_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'expired');

-- Tenants/Clinics table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  UNIQUE (user_id, role)
);

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  calendar_event_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'pending',
  risk_level risk_level DEFAULT 'low',
  professional_name TEXT,
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Waitlist table
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages log table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  direction message_direction NOT NULL,
  body TEXT NOT NULL,
  status message_status DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant settings (rules and templates)
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  confirm_hours_before INTEGER DEFAULT 24,
  reconfirm_hours_before INTEGER DEFAULT 3,
  max_attempts INTEGER DEFAULT 2,
  response_window_hours INTEGER DEFAULT 2,
  min_hours_for_replacement INTEGER DEFAULT 2,
  confirmation_template TEXT DEFAULT 'Olá {nome}! Confirmando sua consulta para {data} às {hora}. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar',
  reconfirmation_template TEXT DEFAULT 'Olá {nome}, não recebemos sua confirmação. Sua consulta está marcada para {hora}. Confirma? 1-Sim, 2-Cancelar',
  cancellation_template TEXT DEFAULT 'Consulta cancelada. Caso deseje remarcar, entre em contato.',
  waitlist_offer_template TEXT DEFAULT 'Olá {nome}! Surgiu uma vaga para {data} às {hora}. Deseja agendar? 1-Sim, 2-Não',
  google_calendar_connected BOOLEAN DEFAULT false,
  google_calendar_id TEXT,
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for tenants
CREATE POLICY "Users can view their tenant"
ON public.tenants FOR SELECT
USING (id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for patients (tenant-scoped)
CREATE POLICY "Users can view patients from their tenant"
ON public.patients FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert patients in their tenant"
ON public.patients FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update patients in their tenant"
ON public.patients FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete patients in their tenant"
ON public.patients FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for appointments (tenant-scoped)
CREATE POLICY "Users can view appointments from their tenant"
ON public.appointments FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert appointments in their tenant"
ON public.appointments FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update appointments in their tenant"
ON public.appointments FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete appointments in their tenant"
ON public.appointments FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for waitlist (tenant-scoped)
CREATE POLICY "Users can view waitlist from their tenant"
ON public.waitlist FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage waitlist in their tenant"
ON public.waitlist FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for messages (tenant-scoped)
CREATE POLICY "Users can view messages from their tenant"
ON public.messages FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert messages in their tenant"
ON public.messages FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for tenant_settings (tenant-scoped, admin only for updates)
CREATE POLICY "Users can view their tenant settings"
ON public.tenant_settings FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can update tenant settings"
ON public.tenant_settings FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tenant settings"
ON public.tenant_settings FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();