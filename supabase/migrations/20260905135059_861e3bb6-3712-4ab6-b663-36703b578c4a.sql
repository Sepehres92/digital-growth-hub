-- 1. Server-only token store
CREATE TABLE IF NOT EXISTS public.social_account_tokens (
  account_id uuid PRIMARY KEY REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.social_account_tokens FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.social_account_tokens TO service_role;

ALTER TABLE public.social_account_tokens ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only service_role (which bypasses RLS) may touch this table.

CREATE TRIGGER social_account_tokens_updated_at
BEFORE UPDATE ON public.social_account_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Migrate existing token material without exposing it
INSERT INTO public.social_account_tokens (account_id, user_id, access_token, refresh_token, expires_at)
SELECT id, user_id, access_token, refresh_token, expires_at
FROM public.social_accounts
ON CONFLICT (account_id) DO NOTHING;

-- 3. Remove secrets from the client-facing table
ALTER TABLE public.social_accounts DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.social_accounts DROP COLUMN IF EXISTS refresh_token;

-- 4. Restore normal (now secret-free) grants
REVOKE ALL ON public.social_accounts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;

-- 5. Include the new table in user data purge ordering (before social_accounts)
CREATE OR REPLACE FUNCTION public.user_data_tables()
 RETURNS TABLE(table_name text, owner_column text, delete_order integer)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
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
    ('social_account_tokens','user_id',53),
    ('social_accounts','user_id',54),
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
$function$;