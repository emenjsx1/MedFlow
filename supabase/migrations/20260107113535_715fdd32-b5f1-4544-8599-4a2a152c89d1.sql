-- =============================================
-- 1. HISTÓRICO DE TAKEOVERS
-- =============================================

-- Create takeover_history table to log all human takeover events
CREATE TABLE public.takeover_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_phone text NOT NULL,
  started_by_user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  outcome text, -- 'resolved', 'escalated', 'transferred_back_to_ai', 'timeout'
  notes text,
  messages_during_takeover integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.takeover_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for takeover_history
CREATE POLICY "Users can view takeover history from their tenant"
  ON public.takeover_history FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert takeover history in their tenant"
  ON public.takeover_history FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update takeover history in their tenant"
  ON public.takeover_history FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Index for performance
CREATE INDEX idx_takeover_history_tenant_date ON public.takeover_history(tenant_id, started_at DESC);

-- =============================================
-- 2. CRM - Add fields to patients table
-- =============================================

-- Add CRM fields to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active', -- 'active', 'inactive', 'vip', 'churned'
ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new', -- 'new', 'contacted', 'scheduled', 'attended', 'follow_up', 'loyal'
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source text, -- 'whatsapp', 'website', 'referral', 'walk_in', 'campaign'
ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz,
ADD COLUMN IF NOT EXISTS total_appointments integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0; -- 0=normal, 1=high, 2=urgent

-- Create patient_notes table for CRM notes/activities
CREATE TABLE public.patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note_type text NOT NULL DEFAULT 'note', -- 'note', 'call', 'email', 'meeting', 'task'
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_notes
CREATE POLICY "Users can view patient notes from their tenant"
  ON public.patient_notes FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert patient notes in their tenant"
  ON public.patient_notes FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update patient notes in their tenant"
  ON public.patient_notes FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete patient notes in their tenant"
  ON public.patient_notes FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Index for patient notes
CREATE INDEX idx_patient_notes_patient ON public.patient_notes(patient_id, created_at DESC);

-- =============================================
-- 3. ALERTAS PARA HUMAN TAKEOVER - Add settings
-- =============================================

-- Add alert settings to tenant_settings
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS takeover_alert_sound boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS takeover_alert_browser_notification boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS takeover_alert_email boolean DEFAULT false;

-- Create a table for real-time alerts/notifications
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid, -- null means broadcast to all users in tenant
  type text NOT NULL, -- 'takeover_message', 'new_booking', 'cancellation', etc.
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their notifications"
  ON public.user_notifications FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Users can update their notifications"
  ON public.user_notifications FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "Users can insert notifications in their tenant"
  ON public.user_notifications FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Index for notifications
CREATE INDEX idx_user_notifications_user ON public.user_notifications(tenant_id, user_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;