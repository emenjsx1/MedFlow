-- Adicionar campo para contexto do negócio/prompt do agente
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS agent_business_context TEXT;