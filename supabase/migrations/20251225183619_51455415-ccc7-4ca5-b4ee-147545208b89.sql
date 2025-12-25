-- 1. Add check-in columns to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_noshow_at TIMESTAMP WITH TIME ZONE;

-- Create index for auto no-show processing
CREATE INDEX IF NOT EXISTS idx_appointments_auto_noshow 
ON public.appointments (scheduled_at, status, checked_in_at) 
WHERE status = 'confirmed' AND checked_in_at IS NULL;

-- 2. Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT,
  image_url TEXT,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Users can view campaigns from their tenant"
  ON public.campaigns FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can insert campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Create campaign_recipients table to track individual sends
CREATE TABLE public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaign_recipients
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_recipients
CREATE POLICY "Users can view campaign recipients from their campaigns"
  ON public.campaign_recipients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.tenant_id = get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "Admins can insert campaign recipients"
  ON public.campaign_recipients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
  ));

CREATE POLICY "Admins can update campaign recipients"
  ON public.campaign_recipients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)
  ));

-- Create indexes for performance
CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON public.campaign_recipients(status) WHERE status = 'pending';
CREATE INDEX idx_campaigns_tenant ON public.campaigns(tenant_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);

-- Add trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-media', 
  'campaign-media', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign media
CREATE POLICY "Anyone can view campaign media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-media');

CREATE POLICY "Authenticated users can upload campaign media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their campaign media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their campaign media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-media' AND auth.role() = 'authenticated');