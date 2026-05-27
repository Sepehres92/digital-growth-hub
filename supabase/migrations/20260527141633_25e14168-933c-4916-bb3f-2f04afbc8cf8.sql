
-- 1. Extend social_posts with provenance columns
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_module text,
  ADD COLUMN IF NOT EXISTS source_post_id uuid,
  ADD COLUMN IF NOT EXISTS source_strategy_id uuid,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS campaign_name text;

CREATE UNIQUE INDEX IF NOT EXISTS social_posts_source_post_uniq
  ON public.social_posts(source_post_id) WHERE source_post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_source_strategy_uniq
  ON public.social_posts(source_strategy_id) WHERE source_strategy_id IS NOT NULL;

-- 2. Mirror content_posts -> social_posts
CREATE OR REPLACE FUNCTION public.sync_content_post_to_social()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sched timestamptz;
BEGIN
  sched := COALESCE(NEW.scheduled_for, NEW.published_at, NEW.created_at, now());
  INSERT INTO public.social_posts (
    user_id, client_id, campaign_id, platform, caption, hashtags,
    media_url, scheduled_at, status, ai_generated, source_module, source_post_id
  ) VALUES (
    NEW.user_id, NEW.client_id, NEW.campaign_id,
    CASE WHEN NEW.platform IN ('instagram','facebook','x','tiktok','youtube')
         THEN NEW.platform ELSE 'instagram' END,
    COALESCE(NEW.caption, ''),
    COALESCE(NEW.hashtags, ''),
    COALESCE(NULLIF(NEW.media_urls::text, '[]'), NULL),
    sched,
    CASE WHEN NEW.status IN ('draft','pending','approved','scheduled','published','failed','rejected')
         THEN NEW.status ELSE 'draft' END,
    COALESCE(NEW.ai_generated, false),
    'content_posts',
    NEW.id
  )
  ON CONFLICT (source_post_id) DO UPDATE SET
    platform = EXCLUDED.platform,
    caption = EXCLUDED.caption,
    hashtags = EXCLUDED.hashtags,
    media_url = EXCLUDED.media_url,
    scheduled_at = EXCLUDED.scheduled_at,
    status = EXCLUDED.status,
    client_id = EXCLUDED.client_id,
    campaign_id = EXCLUDED.campaign_id,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_content_post_to_social_ins ON public.content_posts;
CREATE TRIGGER sync_content_post_to_social_ins
  AFTER INSERT OR UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_content_post_to_social();

-- 3. Mirror generated_strategy_content -> social_posts
CREATE OR REPLACE FUNCTION public.sync_strategy_content_to_social()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  cid uuid;
  campid uuid;
  plat text;
  sched timestamptz;
  st text;
BEGIN
  SELECT c.user_id INTO uid FROM public.strategy_consultations c WHERE c.id = NEW.consultation_id;
  IF uid IS NULL THEN RETURN NEW; END IF;
  cid := NEW.client_id;
  campid := NEW.campaign_id;
  plat := CASE WHEN NEW.platform IN ('instagram','facebook','x','tiktok','youtube')
              THEN NEW.platform ELSE 'instagram' END;
  sched := COALESCE(NEW.scheduled_date, NEW.created_at, now());
  st := CASE
    WHEN NEW.approval_status::text = 'approved' THEN 'approved'
    WHEN NEW.approval_status::text = 'rejected' THEN 'rejected'
    ELSE 'pending' END;

  INSERT INTO public.social_posts (
    user_id, client_id, campaign_id, platform, caption, hashtags,
    cta, scheduled_at, status, ai_generated, source_module, source_strategy_id
  ) VALUES (
    uid, cid, campid, plat,
    COALESCE(NEW.title || E'\n\n', '') || COALESCE(NEW.caption, ''),
    COALESCE(NEW.hashtags, ''),
    COALESCE(NEW.cta, ''),
    sched, st, true, 'ai_strategy_consultant', NEW.id
  )
  ON CONFLICT (source_strategy_id) DO UPDATE SET
    caption = EXCLUDED.caption,
    hashtags = EXCLUDED.hashtags,
    cta = EXCLUDED.cta,
    platform = EXCLUDED.platform,
    scheduled_at = EXCLUDED.scheduled_at,
    status = EXCLUDED.status,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_strategy_content_to_social_ins ON public.generated_strategy_content;
CREATE TRIGGER sync_strategy_content_to_social_ins
  AFTER INSERT OR UPDATE ON public.generated_strategy_content
  FOR EACH ROW EXECUTE FUNCTION public.sync_strategy_content_to_social();

-- 4. Auto-maintain content_calendar from social_posts
CREATE OR REPLACE FUNCTION public.sync_social_to_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.content_calendar WHERE post_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Upsert by post_id
  IF EXISTS (SELECT 1 FROM public.content_calendar WHERE post_id = NEW.id) THEN
    UPDATE public.content_calendar SET
      calendar_date = (NEW.scheduled_at AT TIME ZONE 'UTC')::date,
      platform = NEW.platform,
      status = NEW.status,
      user_id = NEW.user_id
    WHERE post_id = NEW.id;
  ELSE
    INSERT INTO public.content_calendar (user_id, post_id, calendar_date, platform, status)
    VALUES (NEW.user_id, NULL, (NEW.scheduled_at AT TIME ZONE 'UTC')::date, NEW.platform, NEW.status);
    -- Note: content_calendar.post_id FKs to content_posts only; leave NULL for social_posts-origin rows.
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_social_to_calendar_iud ON public.social_posts;
CREATE TRIGGER sync_social_to_calendar_iud
  AFTER INSERT OR UPDATE OR DELETE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_social_to_calendar();

-- 5. Backfill orphaned content_posts -> social_posts
INSERT INTO public.social_posts (
  user_id, client_id, campaign_id, platform, caption, hashtags,
  scheduled_at, status, ai_generated, source_module, source_post_id
)
SELECT
  cp.user_id, cp.client_id, cp.campaign_id,
  CASE WHEN cp.platform IN ('instagram','facebook','x','tiktok','youtube')
       THEN cp.platform ELSE 'instagram' END,
  COALESCE(cp.caption, ''),
  COALESCE(cp.hashtags, ''),
  COALESCE(cp.scheduled_for, cp.published_at, cp.created_at, now()),
  CASE WHEN cp.status IN ('draft','pending','approved','scheduled','published','failed','rejected')
       THEN cp.status ELSE 'draft' END,
  COALESCE(cp.ai_generated, false),
  'content_posts',
  cp.id
FROM public.content_posts cp
LEFT JOIN public.social_posts sp ON sp.source_post_id = cp.id
WHERE sp.id IS NULL;

-- 6. Backfill orphaned generated_strategy_content -> social_posts
INSERT INTO public.social_posts (
  user_id, client_id, campaign_id, platform, caption, hashtags, cta,
  scheduled_at, status, ai_generated, source_module, source_strategy_id
)
SELECT
  c.user_id, gsc.client_id, gsc.campaign_id,
  CASE WHEN gsc.platform IN ('instagram','facebook','x','tiktok','youtube')
       THEN gsc.platform ELSE 'instagram' END,
  COALESCE(gsc.title || E'\n\n', '') || COALESCE(gsc.caption, ''),
  COALESCE(gsc.hashtags, ''),
  COALESCE(gsc.cta, ''),
  COALESCE(gsc.scheduled_date, gsc.created_at, now()),
  CASE
    WHEN gsc.approval_status::text = 'approved' THEN 'approved'
    WHEN gsc.approval_status::text = 'rejected' THEN 'rejected'
    ELSE 'pending' END,
  true, 'ai_strategy_consultant', gsc.id
FROM public.generated_strategy_content gsc
JOIN public.strategy_consultations c ON c.id = gsc.consultation_id
LEFT JOIN public.social_posts sp ON sp.source_strategy_id = gsc.id
WHERE sp.id IS NULL;

-- 7. Enable realtime
ALTER TABLE public.social_posts REPLICA IDENTITY FULL;
ALTER TABLE public.content_calendar REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='social_posts';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='content_calendar';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.content_calendar';
  END IF;
END $$;
