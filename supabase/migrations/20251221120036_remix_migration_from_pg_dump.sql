CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'staff'
);


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'no_show',
    'rescheduled',
    'in_replacement',
    'filled'
);


--
-- Name: integration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.integration_status AS ENUM (
    'connected',
    'disconnected',
    'expired'
);


--
-- Name: message_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_direction AS ENUM (
    'outbound',
    'inbound'
);


--
-- Name: message_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_status AS ENUM (
    'sent',
    'delivered',
    'read',
    'failed'
);


--
-- Name: risk_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.risk_level AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: calculate_patient_risk(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_patient_risk(p_patient_id uuid) RETURNS public.risk_level
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: get_user_tenant_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tenant_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_tenant_id uuid;
  user_name text;
BEGIN
  -- Get user name from metadata or use email
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Create a new tenant for this user
  INSERT INTO public.tenants (name, timezone)
  VALUES (user_name || '''s Clinic', 'America/Sao_Paulo')
  RETURNING id INTO new_tenant_id;
  
  -- Create profile for the user linked to the new tenant
  INSERT INTO public.profiles (id, email, full_name, tenant_id)
  VALUES (NEW.id, NEW.email, user_name, new_tenant_id);
  
  -- Assign admin role to the new user (they are the owner of their tenant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  -- Create default tenant settings
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (new_tenant_id);
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_appointment_risk(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_appointment_risk() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Update risk level based on patient history
  IF NEW.patient_id IS NOT NULL THEN
    NEW.risk_level := public.calculate_patient_risk(NEW.patient_id);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid,
    calendar_event_id text,
    patient_name text NOT NULL,
    patient_phone text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status,
    risk_level public.risk_level DEFAULT 'low'::public.risk_level,
    professional_name text,
    notes text,
    last_contact_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    professional_id uuid
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid,
    appointment_id uuid,
    direction public.message_direction NOT NULL,
    body text NOT NULL,
    status public.message_status DEFAULT 'sent'::public.message_status,
    sent_at timestamp with time zone DEFAULT now()
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    whatsapp text NOT NULL,
    email text,
    notes text,
    risk_score integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: professionals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professionals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    specialty text,
    working_days text[] DEFAULT ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text],
    business_hours_start time without time zone DEFAULT '08:00:00'::time without time zone,
    business_hours_end time without time zone DEFAULT '18:00:00'::time without time zone,
    appointment_duration_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    google_calendar_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    tenant_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    confirm_hours_before integer DEFAULT 24,
    reconfirm_hours_before integer DEFAULT 3,
    max_attempts integer DEFAULT 2,
    response_window_hours integer DEFAULT 2,
    min_hours_for_replacement integer DEFAULT 2,
    confirmation_template text DEFAULT 'Olá {nome}! Confirmando sua consulta para {data} às {hora}. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar'::text,
    reconfirmation_template text DEFAULT 'Olá {nome}, não recebemos sua confirmação. Sua consulta está marcada para {hora}. Confirma? 1-Sim, 2-Cancelar'::text,
    cancellation_template text DEFAULT 'Consulta cancelada. Caso deseje remarcar, entre em contato.'::text,
    waitlist_offer_template text DEFAULT 'Olá {nome}! Surgiu uma vaga para {data} às {hora}. Deseja agendar? 1-Sim, 2-Não'::text,
    google_calendar_connected boolean DEFAULT false,
    google_calendar_id text,
    whatsapp_connected boolean DEFAULT false,
    whatsapp_session_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    clinic_name text,
    clinic_address text,
    clinic_phone text,
    business_hours_start time without time zone DEFAULT '08:00:00'::time without time zone,
    business_hours_end time without time zone DEFAULT '18:00:00'::time without time zone,
    working_days text[] DEFAULT ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text],
    appointment_duration_minutes integer DEFAULT 30,
    openai_api_key text,
    use_custom_openai boolean DEFAULT false,
    agent_greeting_message text DEFAULT 'Olá! Bem-vindo à nossa clínica. Como posso ajudá-lo hoje?'::text,
    agent_booking_confirmation text DEFAULT 'Perfeito! Sua consulta foi agendada para {data} às {hora}. Até lá!'::text,
    google_access_token text,
    google_refresh_token text,
    google_token_expires_at timestamp with time zone,
    agent_business_context text,
    agent_faqs jsonb DEFAULT '[]'::jsonb
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'staff'::public.app_role NOT NULL
);


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    preferred_date date,
    preferred_time_start time without time zone,
    preferred_time_end time without time zone,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: professionals professionals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings tenant_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: idx_appointments_no_double_booking_professional; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_appointments_no_double_booking_professional ON public.appointments USING btree (tenant_id, professional_id, scheduled_at) WHERE ((status = ANY (ARRAY['pending'::public.appointment_status, 'confirmed'::public.appointment_status])) AND (professional_id IS NOT NULL));


--
-- Name: idx_appointments_professional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_professional ON public.appointments USING btree (professional_id);


--
-- Name: idx_professionals_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professionals_tenant ON public.professionals USING btree (tenant_id);


--
-- Name: appointments trigger_update_risk; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_risk BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_appointment_risk();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: professionals update_professionals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenant_settings update_tenant_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: messages messages_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: messages messages_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: messages messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: patients patients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: professionals professionals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_settings tenant_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: waitlist waitlist_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: waitlist waitlist_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: professionals Admins can delete professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete professionals" ON public.professionals FOR DELETE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: professionals Admins can insert professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert professionals" ON public.professionals FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: tenant_settings Admins can insert tenant settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert tenant settings" ON public.tenant_settings FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: professionals Admins can update professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update professionals" ON public.professionals FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: tenant_settings Admins can update tenant settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tenant settings" ON public.tenant_settings FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: appointments Users can delete appointments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete appointments in their tenant" ON public.appointments FOR DELETE USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: patients Users can delete patients in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete patients in their tenant" ON public.patients FOR DELETE USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: appointments Users can insert appointments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert appointments in their tenant" ON public.appointments FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: messages Users can insert messages in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages in their tenant" ON public.messages FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: patients Users can insert patients in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert patients in their tenant" ON public.patients FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: waitlist Users can manage waitlist in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage waitlist in their tenant" ON public.waitlist USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: appointments Users can update appointments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update appointments in their tenant" ON public.appointments FOR UPDATE USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: patients Users can update patients in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update patients in their tenant" ON public.patients FOR UPDATE USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: appointments Users can view appointments from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view appointments from their tenant" ON public.appointments FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: messages Users can view messages from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their tenant" ON public.messages FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: patients Users can view patients from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view patients from their tenant" ON public.patients FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: professionals Users can view professionals from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view professionals from their tenant" ON public.professionals FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tenants Users can view their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their tenant" ON public.tenants FOR SELECT USING ((id = public.get_user_tenant_id(auth.uid())));


--
-- Name: tenant_settings Users can view their tenant settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their tenant settings" ON public.tenant_settings FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: waitlist Users can view waitlist from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view waitlist from their tenant" ON public.waitlist FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: professionals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;