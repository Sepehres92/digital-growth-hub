
-- ENUMS
DO $$ BEGIN CREATE TYPE public.campaign_folder_type AS ENUM ('social_media','seo','ppc','combined','human_assisted','ai_generated','ai_human_review'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.campaign_source_type AS ENUM ('ai','human','ai_human_review'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.campaign_folder_status AS ENUM ('draft','ai_generating','pending_client_approval','pending_human_review','human_review_required','approved','scheduled','active','completed','paused','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.campaign_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  folder_type public.campaign_folder_type NOT NULL DEFAULT 'ai_generated',
  source_type public.campaign_source_type NOT NULL DEFAULT 'ai',
  status public.campaign_folder_status NOT NULL DEFAULT 'draft',
  strategy_summary text,
  goal text,
  assigned_team_members uuid[] NOT NULL DEFAULT '{}',
  client_notes text,
  strategy_consultation_id uuid,
  seo_ppc_consultation_id uuid,
  human_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cf_user ON public.campaign_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_cf_client ON public.campaign_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_cf_campaign ON public.campaign_folders(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_folders TO authenticated;
GRANT ALL ON public.campaign_folders TO service_role;
ALTER TABLE public.campaign_folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "cf select own or admin" ON public.campaign_folders FOR SELECT TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cf insert own" ON public.campaign_folders FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cf update own or admin" ON public.campaign_folders FOR UPDATE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cf delete own or admin" ON public.campaign_folders FOR DELETE TO authenticated USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS campaign_folders_updated_at ON public.campaign_folders;
CREATE TRIGGER campaign_folders_updated_at BEFORE UPDATE ON public.campaign_folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS source_type public.campaign_source_type NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS campaign_folder_id uuid REFERENCES public.campaign_folders(id) ON DELETE SET NULL;

-- Add campaign_folder_id where the table exists
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['tasks','meetings','content_posts','social_posts','generated_strategy_content','seo_ppc_consultations','generated_images','video_projects','ai_copies','human_strategy_requests','human_seo_ppc_requests','seo_recommendations','ppc_recommendations','seo_keywords','ppc_keywords','strategy_recommendations','strategy_consultations','content_calendar','competitor_research'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS campaign_folder_id uuid REFERENCES public.campaign_folders(id) ON DELETE SET NULL', t);
    END IF;
  END LOOP;
END $$;

-- Add source_type where applicable
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['content_posts','social_posts','generated_strategy_content','generated_images','video_projects','ai_copies','tasks','meetings'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_type public.campaign_source_type NOT NULL DEFAULT ''ai''', t);
    END IF;
  END LOOP;
END $$;

-- Auto-create folder on new campaign
CREATE OR REPLACE FUNCTION public.auto_create_campaign_folder()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_folder_id uuid; ft public.campaign_folder_type;
BEGIN
  IF NEW.campaign_folder_id IS NOT NULL THEN RETURN NEW; END IF;
  ft := CASE NEW.type::text
    WHEN 'seo' THEN 'seo'::public.campaign_folder_type
    WHEN 'ppc' THEN 'ppc'::public.campaign_folder_type
    WHEN 'social_media' THEN 'social_media'::public.campaign_folder_type
    ELSE 'combined'::public.campaign_folder_type END;
  INSERT INTO public.campaign_folders (user_id, client_id, campaign_id, name, folder_type, source_type, status, goal)
  VALUES (NEW.user_id, NEW.client_id, NEW.id, NEW.name, ft, COALESCE(NEW.source_type,'ai'), 'draft'::public.campaign_folder_status, NEW.goal)
  RETURNING id INTO new_folder_id;
  NEW.campaign_folder_id := new_folder_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_campaign_folder ON public.campaigns;
CREATE TRIGGER trg_auto_campaign_folder BEFORE INSERT ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.auto_create_campaign_folder();

-- Backfill folders for existing campaigns
INSERT INTO public.campaign_folders (user_id, client_id, campaign_id, name, folder_type, source_type, status, goal)
SELECT c.user_id, c.client_id, c.id, c.name,
  CASE c.type::text WHEN 'seo' THEN 'seo'::public.campaign_folder_type WHEN 'ppc' THEN 'ppc'::public.campaign_folder_type WHEN 'social_media' THEN 'social_media'::public.campaign_folder_type ELSE 'combined'::public.campaign_folder_type END,
  COALESCE(c.source_type,'ai'), 'draft'::public.campaign_folder_status, c.goal
FROM public.campaigns c
LEFT JOIN public.campaign_folders f ON f.campaign_id = c.id
WHERE f.id IS NULL;

UPDATE public.campaigns c SET campaign_folder_id = f.id
FROM public.campaign_folders f WHERE f.campaign_id = c.id AND c.campaign_folder_id IS NULL;

-- Linker function
CREATE OR REPLACE FUNCTION public.link_asset_to_campaign_folder()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE fid uuid;
BEGIN
  IF NEW.campaign_folder_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT campaign_folder_id INTO fid FROM public.campaigns WHERE id = NEW.campaign_id;
    IF fid IS NOT NULL THEN NEW.campaign_folder_id := fid; END IF;
  END IF;
  RETURN NEW;
END $$;

-- Attach linker triggers + backfill, only where BOTH columns exist
DO $$ DECLARE t text; has_cid boolean; has_fid boolean;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks','meetings','content_posts','social_posts','generated_strategy_content','generated_images','video_projects','ai_copies'] LOOP
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='campaign_id') INTO has_cid;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='campaign_folder_id') INTO has_fid;
    IF has_cid AND has_fid THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_link_folder ON public.%I', t);
      EXECUTE format('CREATE TRIGGER trg_link_folder BEFORE INSERT OR UPDATE OF campaign_id ON public.%I FOR EACH ROW EXECUTE FUNCTION public.link_asset_to_campaign_folder()', t);
      EXECUTE format('UPDATE public.%I a SET campaign_folder_id = c.campaign_folder_id FROM public.campaigns c WHERE a.campaign_id = c.id AND a.campaign_folder_id IS NULL AND c.campaign_folder_id IS NOT NULL', t);
    END IF;
  END LOOP;
END $$;
