-- Add human takeover columns to agent_conversations table
ALTER TABLE public.agent_conversations 
ADD COLUMN IF NOT EXISTS agent_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agent_paused_at timestamptz,
ADD COLUMN IF NOT EXISTS agent_reactivate_at timestamptz,
ADD COLUMN IF NOT EXISTS paused_by_user_id uuid;

-- Create index for quick lookup of paused conversations
CREATE INDEX IF NOT EXISTS idx_agent_conversations_paused 
ON public.agent_conversations(tenant_id, patient_phone) 
WHERE agent_paused = true;

-- Create a function to auto-reactivate agents after timeout
CREATE OR REPLACE FUNCTION public.check_agent_reactivation()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.agent_conversations
  SET 
    agent_paused = false,
    agent_paused_at = null,
    agent_reactivate_at = null,
    paused_by_user_id = null
  WHERE 
    agent_paused = true 
    AND agent_reactivate_at IS NOT NULL 
    AND agent_reactivate_at <= now();
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.agent_conversations.agent_paused IS 'When true, the AI agent is paused and human takes over';
COMMENT ON COLUMN public.agent_conversations.agent_paused_at IS 'Timestamp when the agent was paused';
COMMENT ON COLUMN public.agent_conversations.agent_reactivate_at IS 'Timestamp when the agent should auto-reactivate';
COMMENT ON COLUMN public.agent_conversations.paused_by_user_id IS 'User who paused the agent';