CREATE TABLE public.seo_ppc_consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid,
  module text NOT NULL CHECK (module IN ('seo','ppc')),
  business_name text NOT NULL,
  website_url text,
  location text,
  services text,
  target_customer text,
  target_keywords text,
  competitors text,
  monthly_budget numeric DEFAULT 0,
  primary_goal text,
  seo_scope text,
  platforms text[] DEFAULT '{}',
  ideal_cost_per_lead numeric,
  existing_landing_pages text,
  conversion_goal text,
  offers text,
  recommendations jsonb,
  customizations jsonb,
  status text NOT NULL DEFAULT 'intake',
  campaign_id uuid,
  human_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_ppc_consultations TO authenticated;
GRANT ALL ON public.seo_ppc_consultations TO service_role;

ALTER TABLE public.seo_ppc_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or admin select seo_ppc"
  ON public.seo_ppc_consultations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "owner insert seo_ppc"
  ON public.seo_ppc_consultations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner or admin update seo_ppc"
  ON public.seo_ppc_consultations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "owner delete seo_ppc"
  ON public.seo_ppc_consultations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER seo_ppc_consultations_updated_at
  BEFORE UPDATE ON public.seo_ppc_consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();