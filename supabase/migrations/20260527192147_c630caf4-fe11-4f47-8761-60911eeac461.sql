
-- Enums
DO $$ BEGIN
  CREATE TYPE public.workspace_type_enum AS ENUM ('real','demo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.onboarding_status_enum AS ENUM ('not_started','in_progress','completed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. onboarding_profiles
CREATE TABLE public.onboarding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  workspace_type public.workspace_type_enum NOT NULL DEFAULT 'real',
  onboarding_status public.onboarding_status_enum NOT NULL DEFAULT 'not_started',
  business_name text,
  website_url text,
  industry text,
  location text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_goal text,
  marketing_budget_range text,
  brand_tone text,
  brand_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  unique_selling_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  offers jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  posting_frequency text,
  content_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_required boolean NOT NULL DEFAULT true,
  campaign_creation_preference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_onboarding_profiles_user ON public.onboarding_profiles(user_id);
CREATE INDEX idx_onboarding_profiles_client ON public.onboarding_profiles(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_profiles TO authenticated;
GRANT ALL ON public.onboarding_profiles TO service_role;
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_select_own" ON public.onboarding_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "op_insert_own" ON public.onboarding_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_update_own" ON public.onboarding_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "op_delete_own" ON public.onboarding_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_op_updated_at BEFORE UPDATE ON public.onboarding_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. marketing_intelligence_profiles
CREATE TABLE public.marketing_intelligence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  business_summary text,
  brand_voice jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_strategy_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ppc_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  platform_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  human_support_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mip_user ON public.marketing_intelligence_profiles(user_id);
CREATE INDEX idx_mip_client ON public.marketing_intelligence_profiles(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_intelligence_profiles TO authenticated;
GRANT ALL ON public.marketing_intelligence_profiles TO service_role;
ALTER TABLE public.marketing_intelligence_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mip_select_own" ON public.marketing_intelligence_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mip_insert_own" ON public.marketing_intelligence_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mip_update_own" ON public.marketing_intelligence_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mip_delete_own" ON public.marketing_intelligence_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_mip_updated_at BEFORE UPDATE ON public.marketing_intelligence_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. demo_workspaces
CREATE TABLE public.demo_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  demo_profile_type text,
  demo_enabled boolean NOT NULL DEFAULT true,
  demo_started_at timestamptz NOT NULL DEFAULT now(),
  converted_to_real boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_demo_workspaces_user ON public.demo_workspaces(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_workspaces TO authenticated;
GRANT ALL ON public.demo_workspaces TO service_role;
ALTER TABLE public.demo_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dw_select_own" ON public.demo_workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "dw_insert_own" ON public.demo_workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dw_update_own" ON public.demo_workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dw_delete_own" ON public.demo_workspaces FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. onboarding_answers
CREATE TABLE public.onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  question_key text NOT NULL,
  answer_value jsonb,
  source text NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id, question_key)
);
CREATE INDEX idx_oa_user ON public.onboarding_answers(user_id);
CREATE INDEX idx_oa_client ON public.onboarding_answers(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_answers TO authenticated;
GRANT ALL ON public.onboarding_answers TO service_role;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oa_select_own" ON public.onboarding_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "oa_insert_own" ON public.onboarding_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oa_update_own" ON public.onboarding_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oa_delete_own" ON public.onboarding_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_oa_updated_at BEFORE UPDATE ON public.onboarding_answers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
