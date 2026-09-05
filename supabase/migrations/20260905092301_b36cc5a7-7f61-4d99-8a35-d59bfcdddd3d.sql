-- 1. Consent records -------------------------------------------------------
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_version text NOT NULL,
  terms_accepted boolean NOT NULL DEFAULT true,
  privacy_accepted boolean NOT NULL DEFAULT true,
  consent_source text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own consents"
  ON public.user_consents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users record own consents"
  ON public.user_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND char_length(policy_version) BETWEEN 1 AND 40
              AND consent_source IN ('email_signup','google_oauth','manual_reaccept'));

CREATE UNIQUE INDEX user_consents_unique_version
  ON public.user_consents (user_id, policy_version, consent_source);

CREATE TRIGGER user_consents_set_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Ordered per-user table inventory --------------------------------------
CREATE OR REPLACE FUNCTION public.user_data_tables()
RETURNS TABLE (table_name text, owner_column text, delete_order int)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT * FROM (VALUES
    ('chat_reactions','user_id',10),
    ('chat_messages','user_id',11),
    ('chat_channel_members','user_id',12),
    ('chat_channels','created_by',13),
    ('chat_presence','user_id',14),
    ('chat_audit_log','user_id',15),
    ('chatbot_messages','user_id',20),
    ('chatbot_conversations','user_id',21),
    ('chatbot_kb_articles','user_id',22),
    ('chatbot_settings','user_id',23),
    ('meeting_action_items','user_id',30),
    ('meeting_agenda_items','user_id',31),
    ('meeting_attachments','user_id',32),
    ('meeting_attendees','user_id',33),
    ('meeting_notes','user_id',34),
    ('meetings','user_id',35),
    ('video_subtitles','user_id',40),
    ('video_scenes','user_id',41),
    ('video_storyboards','user_id',42),
    ('video_renders','user_id',43),
    ('video_assets','user_id',44),
    ('video_audit_log','user_id',45),
    ('video_projects','user_id',46),
    ('content_calendar','user_id',50),
    ('content_posts','user_id',51),
    ('social_posts','user_id',52),
    ('social_accounts','user_id',53),
    ('human_seo_ppc_requests','user_id',60),
    ('human_strategy_requests','user_id',61),
    ('strategy_consultations','user_id',62),
    ('seo_ppc_consultations','user_id',63),
    ('strategy_admin_settings','user_id',64),
    ('seo_ppc_admin_settings','user_id',65),
    ('ai_copies','user_id',70),
    ('ai_images','user_id',71),
    ('generated_images','user_id',72),
    ('client_images','user_id',73),
    ('creative_projects','user_id',74),
    ('media_assets','user_id',75),
    ('content_rights_acknowledgements','user_id',76),
    ('support_tickets','user_id',77),
    ('blog_posts','user_id',78),
    ('tasks','user_id',80),
    ('leads','user_id',81),
    ('campaigns','user_id',82),
    ('campaign_folders','user_id',83),
    ('clients','user_id',84),
    ('onboarding_answers','user_id',90),
    ('onboarding_profiles','user_id',91),
    ('marketing_intelligence_profiles','user_id',92),
    ('marketing_profiles','user_id',93),
    ('demo_workspaces','user_id',94),
    ('workspace_mode','user_id',95),
    ('user_consents','user_id',96),
    ('user_roles','user_id',97),
    ('audit_logs','user_id',98),
    ('profiles','id',99)
  ) AS t(table_name, owner_column, delete_order);
$$;

REVOKE ALL ON FUNCTION public.user_data_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_data_tables() TO service_role;

-- 3. Fail-closed purge ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_user_data(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  deleted jsonb := '{}'::jsonb;
  n bigint;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'purge_user_data requires a user id';
  END IF;

  FOR rec IN SELECT * FROM public.user_data_tables() ORDER BY delete_order LOOP
    EXECUTE format('DELETE FROM public.%I WHERE %I = $1', rec.table_name, rec.owner_column)
      USING _user_id;
    GET DIAGNOSTICS n = ROW_COUNT;
    deleted := deleted || jsonb_build_object(rec.table_name, n);
  END LOOP;

  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_data(uuid) TO service_role;

-- 4. Verification -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_user_records(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  remaining jsonb := '{}'::jsonb;
  n bigint;
BEGIN
  FOR rec IN SELECT * FROM public.user_data_tables() ORDER BY delete_order LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', rec.table_name, rec.owner_column)
      INTO n USING _user_id;
    IF n > 0 THEN
      remaining := remaining || jsonb_build_object(rec.table_name, n);
    END IF;
  END LOOP;

  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.count_user_records(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_user_records(uuid) TO service_role;