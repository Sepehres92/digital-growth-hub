
-- Marketing profile (one per user, optionally per client)
CREATE TABLE public.marketing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NULL,
  -- business
  business_name text,
  website_url text,
  industry text,
  location text,
  services text,
  target_audience text,
  main_goal text,
  budget_range text,
  -- brand
  brand_tone text,
  brand_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_url text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  competitors text,
  usps text,
  offers text,
  -- marketing
  platforms text[] NOT NULL DEFAULT '{}',
  posting_frequency text,
  content_types text[] NOT NULL DEFAULT '{}',
  approval_required boolean NOT NULL DEFAULT true,
  creation_mode text NOT NULL DEFAULT 'ai',
  -- seo / ppc
  target_keywords text[] NOT NULL DEFAULT '{}',
  seo_competitors text,
  target_locations text[] NOT NULL DEFAULT '{}',
  ppc_budget numeric,
  lead_type text,
  landing_page_url text,
  conversion_goal text,
  -- team
  client_portal_enabled boolean NOT NULL DEFAULT false,
  human_consultation_requested boolean NOT NULL DEFAULT false,
  -- meta
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_step int NOT NULL DEFAULT 0,
  is_demo boolean NOT NULL DEFAULT false,
  demo_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX idx_marketing_profiles_user ON public.marketing_profiles(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_profiles TO authenticated;
GRANT ALL ON public.marketing_profiles TO service_role;

ALTER TABLE public.marketing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp select own" ON public.marketing_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mp insert own" ON public.marketing_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp update own" ON public.marketing_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mp delete own" ON public.marketing_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_marketing_profiles_updated
BEFORE UPDATE ON public.marketing_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Workspace mode (one row per user)
CREATE TABLE public.workspace_mode (
  user_id uuid PRIMARY KEY,
  mode text NOT NULL DEFAULT 'real' CHECK (mode IN ('real', 'demo')),
  demo_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_mode TO authenticated;
GRANT ALL ON public.workspace_mode TO service_role;

ALTER TABLE public.workspace_mode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wm select own" ON public.workspace_mode
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wm insert own" ON public.workspace_mode
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wm update own" ON public.workspace_mode
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wm delete own" ON public.workspace_mode
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_workspace_mode_updated
BEFORE UPDATE ON public.workspace_mode
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Demo flags across content tables
ALTER TABLE public.clients          ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns        ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaign_folders ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.content_posts    ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.social_posts     ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
