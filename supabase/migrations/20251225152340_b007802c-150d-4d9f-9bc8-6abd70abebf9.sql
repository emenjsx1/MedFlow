-- Create table to track AI agent conversations
CREATE TABLE public.agent_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_phone text NOT NULL,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    ended_at timestamp with time zone,
    messages_count integer DEFAULT 0,
    outcome text, -- 'booking_success', 'booking_failed', 'info_only', 'abandoned'
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view agent conversations from their tenant"
ON public.agent_conversations FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert agent conversations in their tenant"
ON public.agent_conversations FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update agent conversations in their tenant"
ON public.agent_conversations FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Index for performance
CREATE INDEX idx_agent_conversations_tenant_id ON public.agent_conversations(tenant_id);
CREATE INDEX idx_agent_conversations_started_at ON public.agent_conversations(started_at);

-- Enable realtime for agent_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_conversations;