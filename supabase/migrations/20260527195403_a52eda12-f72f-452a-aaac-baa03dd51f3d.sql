
-- Recreate trigger function: insert folder WITHOUT campaign_id (campaign row doesn't exist yet in BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.auto_create_campaign_folder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_folder_id uuid; ft public.campaign_folder_type;
BEGIN
  IF NEW.campaign_folder_id IS NOT NULL THEN RETURN NEW; END IF;
  ft := CASE NEW.type::text
    WHEN 'seo' THEN 'seo'::public.campaign_folder_type
    WHEN 'ppc' THEN 'ppc'::public.campaign_folder_type
    WHEN 'social_media' THEN 'social_media'::public.campaign_folder_type
    ELSE 'combined'::public.campaign_folder_type END;
  INSERT INTO public.campaign_folders (user_id, client_id, campaign_id, name, folder_type, source_type, status, goal)
  VALUES (NEW.user_id, NEW.client_id, NULL, NEW.name, ft, COALESCE(NEW.source_type,'ai'), 'draft'::public.campaign_folder_status, NEW.goal)
  RETURNING id INTO new_folder_id;
  NEW.campaign_folder_id := new_folder_id;
  RETURN NEW;
END $function$;

-- After the campaign row exists, link the folder back to it
CREATE OR REPLACE FUNCTION public.link_campaign_folder_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.campaign_folder_id IS NOT NULL THEN
    UPDATE public.campaign_folders
       SET campaign_id = NEW.id
     WHERE id = NEW.campaign_folder_id
       AND campaign_id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_link_campaign_folder_after_insert ON public.campaigns;
CREATE TRIGGER trg_link_campaign_folder_after_insert
AFTER INSERT ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.link_campaign_folder_after_insert();
