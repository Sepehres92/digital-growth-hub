
-- Extend existing seo_ppc_consultations to ensure all required columns exist
ALTER TABLE public.seo_ppc_consultations
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS consultation_type text,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS target_location text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS business_goal text,
  ADD COLUMN IF NOT EXISTS monthly_budget numeric,
  ADD COLUMN IF NOT EXISTS competitors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- 2. seo_recommendations
CREATE TABLE IF NOT EXISTS public.seo_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  keyword_strategy jsonb,
  local_seo_strategy jsonb,
  technical_seo_recommendations jsonb,
  on_page_recommendations jsonb,
  content_recommendations jsonb,
  backlink_recommendations jsonb,
  google_business_profile_recommendations jsonb,
  competitor_gap_summary jsonb,
  seo_30_day_plan jsonb,
  seo_60_day_plan jsonb,
  seo_90_day_plan jsonb,
  sources_used jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_recommendations TO authenticated;
GRANT ALL ON public.seo_recommendations TO service_role;
ALTER TABLE public.seo_recommendations ENABLE ROW LEVEL SECURITY;

-- 3. ppc_recommendations
CREATE TABLE IF NOT EXISTS public.ppc_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  campaign_structure jsonb,
  recommended_platforms jsonb,
  budget_allocation jsonb,
  keyword_groups jsonb,
  negative_keywords jsonb,
  ad_copy_recommendations jsonb,
  landing_page_recommendations jsonb,
  conversion_tracking_checklist jsonb,
  ab_testing_plan jsonb,
  retargeting_strategy jsonb,
  sources_used jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppc_recommendations TO authenticated;
GRANT ALL ON public.ppc_recommendations TO service_role;
ALTER TABLE public.ppc_recommendations ENABLE ROW LEVEL SECURITY;

-- 4. seo_keywords
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  intent text,
  difficulty_score numeric,
  search_volume integer,
  priority text,
  page_target text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keywords TO authenticated;
GRANT ALL ON public.seo_keywords TO service_role;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

-- 5. ppc_keywords
CREATE TABLE IF NOT EXISTS public.ppc_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  match_type text,
  intent text,
  estimated_cpc numeric,
  priority text,
  ad_group text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppc_keywords TO authenticated;
GRANT ALL ON public.ppc_keywords TO service_role;
ALTER TABLE public.ppc_keywords ENABLE ROW LEVEL SECURITY;

-- 6. competitor_research
CREATE TABLE IF NOT EXISTS public.competitor_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  competitor_name text,
  competitor_url text,
  observed_strengths jsonb,
  observed_weaknesses jsonb,
  keyword_gaps jsonb,
  content_gaps jsonb,
  ad_observations jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_research TO authenticated;
GRANT ALL ON public.competitor_research TO service_role;
ALTER TABLE public.competitor_research ENABLE ROW LEVEL SECURITY;

-- 7. seo_ppc_approvals
CREATE TABLE IF NOT EXISTS public.seo_ppc_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.seo_ppc_consultations(id) ON DELETE CASCADE,
  client_id uuid,
  approval_status text NOT NULL DEFAULT 'pending',
  client_notes text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_ppc_approvals TO authenticated;
GRANT ALL ON public.seo_ppc_approvals TO service_role;
ALTER TABLE public.seo_ppc_approvals ENABLE ROW LEVEL SECURITY;

-- 8. human_seo_ppc_requests
CREATE TABLE IF NOT EXISTS public.human_seo_ppc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  consultation_id uuid REFERENCES public.seo_ppc_consultations(id) ON DELETE SET NULL,
  free_consultation_used boolean NOT NULL DEFAULT false,
  request_status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  meeting_id uuid,
  payment_required boolean NOT NULL DEFAULT false,
  price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.human_seo_ppc_requests TO authenticated;
GRANT ALL ON public.human_seo_ppc_requests TO service_role;
ALTER TABLE public.human_seo_ppc_requests ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user owns the parent consultation
CREATE OR REPLACE FUNCTION public.owns_seo_ppc_consultation(_consultation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.seo_ppc_consultations
    WHERE id = _consultation_id AND user_id = _user_id
  );
$$;

-- RLS policies for child tables (owner of consultation or admin)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'seo_recommendations','ppc_recommendations','seo_keywords',
    'ppc_keywords','competitor_research','seo_ppc_approvals'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner or admin all" ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY "owner or admin all" ON public.%I
      FOR ALL TO authenticated
      USING (
        public.owns_seo_ppc_consultation(consultation_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
      WITH CHECK (
        public.owns_seo_ppc_consultation(consultation_id, auth.uid())
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
    $p$, t);
  END LOOP;
END $$;

-- human_seo_ppc_requests policies
DROP POLICY IF EXISTS "users view own human seo/ppc requests" ON public.human_seo_ppc_requests;
CREATE POLICY "users view own human seo/ppc requests" ON public.human_seo_ppc_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "users create own human seo/ppc requests" ON public.human_seo_ppc_requests;
CREATE POLICY "users create own human seo/ppc requests" ON public.human_seo_ppc_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own human seo/ppc requests" ON public.human_seo_ppc_requests;
CREATE POLICY "users update own human seo/ppc requests" ON public.human_seo_ppc_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admins delete human seo/ppc requests" ON public.human_seo_ppc_requests;
CREATE POLICY "admins delete human seo/ppc requests" ON public.human_seo_ppc_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
