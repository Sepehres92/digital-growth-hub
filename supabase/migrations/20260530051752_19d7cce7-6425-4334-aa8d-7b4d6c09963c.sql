CREATE OR REPLACE FUNCTION public.sync_content_post_to_social()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ON CONFLICT (source_post_id) WHERE source_post_id IS NOT NULL DO UPDATE SET
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_strategy_content_to_social()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ON CONFLICT (source_strategy_id) WHERE source_strategy_id IS NOT NULL DO UPDATE SET
    caption = EXCLUDED.caption,
    hashtags = EXCLUDED.hashtags,
    cta = EXCLUDED.cta,
    platform = EXCLUDED.platform,
    scheduled_at = EXCLUDED.scheduled_at,
    status = EXCLUDED.status,
    updated_at = now();
  RETURN NEW;
END;
$function$;

-- Backfill: re-fire the (now-fixed) trigger on content_posts rows that never synced.
-- Touching the status column is a no-op semantically but fires AFTER UPDATE.
UPDATE public.content_posts cp
   SET status = cp.status
 WHERE NOT EXISTS (
   SELECT 1 FROM public.social_posts sp WHERE sp.source_post_id = cp.id
 );