
-- Drop legacy tables from the prior iteration (data is non-production)
DROP TABLE IF EXISTS public.human_strategist_requests CASCADE;
DROP TABLE IF EXISTS public.strategy_consultations CASCADE;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.consultation_type AS ENUM ('ai_only','human_requested','human_completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.strategy_status AS ENUM ('intake','researching','recommended','approved','executing','executed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.strategy_approval_status AS ENUM ('pending','approved','changes_requested','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.human_request_status AS ENUM ('pending','assigned','scheduled','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. strategy_consultations
CREATE TABLE public.strategy_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  consultation_type public.consultation_type NOT NULL DEFAULT 'ai_only',
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  target_audience TEXT,
  location TEXT,
  business_goal TEXT,
  selected_platforms TEXT[] NOT NULL DEFAULT '{}',
  preferred_posting_frequency TEXT,
  tone TEXT,
  status public.strategy_status NOT NULL DEFAULT 'intake',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_consultations TO authenticated;
GRANT ALL ON public.strategy_consultations TO service_role;
ALTER TABLE public.strategy_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view consultations" ON public.strategy_consultations
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert consultations" ON public.strategy_consultations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update consultations" ON public.strategy_consultations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete consultations" ON public.strategy_consultations
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_strategy_consultations_updated_at
  BEFORE UPDATE ON public.strategy_consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. strategy_recommendations
CREATE TABLE public.strategy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.strategy_consultations(id) ON DELETE CASCADE,
  best_practices_summary TEXT,
  recommended_platforms TEXT[] NOT NULL DEFAULT '{}',
  recommended_posting_frequency TEXT,
  recommended_content_pillars TEXT[] NOT NULL DEFAULT '{}',
  recommended_posting_times JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_hashtag_strategy TEXT,
  recommended_cta_strategy TEXT,
  sources_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_recommendations TO authenticated;
GRANT ALL ON public.strategy_recommendations TO service_role;
ALTER TABLE public.strategy_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view recs" ON public.strategy_recommendations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners insert recs" ON public.strategy_recommendations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Owners update recs" ON public.strategy_recommendations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners delete recs" ON public.strategy_recommendations
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

-- 3. strategy_approvals
CREATE TABLE public.strategy_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.strategy_consultations(id) ON DELETE CASCADE,
  client_id UUID,
  approval_status public.strategy_approval_status NOT NULL DEFAULT 'pending',
  client_notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_approvals TO authenticated;
GRANT ALL ON public.strategy_approvals TO service_role;
ALTER TABLE public.strategy_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view approvals" ON public.strategy_approvals
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners insert approvals" ON public.strategy_approvals
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Owners update approvals" ON public.strategy_approvals
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners delete approvals" ON public.strategy_approvals
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

-- 4. human_strategy_requests
CREATE TABLE public.human_strategy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  consultation_id UUID REFERENCES public.strategy_consultations(id) ON DELETE SET NULL,
  free_consultation_used BOOLEAN NOT NULL DEFAULT false,
  request_status public.human_request_status NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  meeting_id UUID,
  payment_required BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.human_strategy_requests TO authenticated;
GRANT ALL ON public.human_strategy_requests TO service_role;
ALTER TABLE public.human_strategy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners or admins view human requests" ON public.human_strategy_requests
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR auth.uid() = assigned_to OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Owners insert human requests" ON public.human_strategy_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners or admins update human requests" ON public.human_strategy_requests
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR auth.uid() = assigned_to OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Owners or admins delete human requests" ON public.human_strategy_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 5. generated_strategy_content
CREATE TABLE public.generated_strategy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.strategy_consultations(id) ON DELETE CASCADE,
  client_id UUID,
  campaign_id UUID,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  hashtags TEXT,
  cta TEXT,
  image_prompt TEXT,
  video_script TEXT,
  scheduled_date TIMESTAMPTZ,
  approval_status public.strategy_approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_strategy_content TO authenticated;
GRANT ALL ON public.generated_strategy_content TO service_role;
ALTER TABLE public.generated_strategy_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view generated content" ON public.generated_strategy_content
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners insert generated content" ON public.generated_strategy_content
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Owners update generated content" ON public.generated_strategy_content
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Owners delete generated content" ON public.generated_strategy_content
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.strategy_consultations c WHERE c.id = consultation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

CREATE INDEX idx_strategy_consultations_user ON public.strategy_consultations(user_id);
CREATE INDEX idx_strategy_consultations_client ON public.strategy_consultations(client_id);
CREATE INDEX idx_strategy_recs_consultation ON public.strategy_recommendations(consultation_id);
CREATE INDEX idx_strategy_approvals_consultation ON public.strategy_approvals(consultation_id);
CREATE INDEX idx_human_requests_user ON public.human_strategy_requests(user_id);
CREATE INDEX idx_human_requests_assigned ON public.human_strategy_requests(assigned_to);
CREATE INDEX idx_generated_content_consultation ON public.generated_strategy_content(consultation_id);
