-- Adicionar campo para FAQs configuráveis (array de objetos JSON com pergunta e resposta)
ALTER TABLE public.tenant_settings
ADD COLUMN IF NOT EXISTS agent_faqs JSONB DEFAULT '[]'::jsonb;