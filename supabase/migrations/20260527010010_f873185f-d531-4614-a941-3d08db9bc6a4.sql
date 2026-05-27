
-- Channels
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  channel_type text NOT NULL DEFAULT 'public' CHECK (channel_type IN ('public','private','invite','dm')),
  client_id uuid,
  campaign_id uuid,
  created_by uuid NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_channels TO service_role;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Members
CREATE TABLE public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  muted boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_channel_members TO authenticated;
GRANT ALL ON public.chat_channel_members TO service_role;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_channel_members WHERE channel_id = _channel_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_channel_admin(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_channel_members WHERE channel_id = _channel_id AND user_id = _user_id AND role IN ('owner','admin'));
$$;

-- Channel policies
CREATE POLICY "view channels you're in or public" ON public.chat_channels FOR SELECT TO authenticated
  USING (channel_type = 'public' OR public.is_channel_member(id, auth.uid()));
CREATE POLICY "create channels" ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "admins update channels" ON public.chat_channels FOR UPDATE TO authenticated
  USING (public.is_channel_admin(id, auth.uid()));
CREATE POLICY "owner deletes channel" ON public.chat_channels FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Member policies
CREATE POLICY "view members of your channels" ON public.chat_channel_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "join public or self insert" ON public.chat_channel_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));
CREATE POLICY "update own membership or admin" ON public.chat_channel_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));
CREATE POLICY "leave or admin remove" ON public.chat_channel_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

-- Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','video','file','voice','code','gif','ai','system')),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  mentions uuid[] NOT NULL DEFAULT '{}',
  ai_generated boolean NOT NULL DEFAULT false,
  edited boolean NOT NULL DEFAULT false,
  deleted_for uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_parent ON public.chat_messages(parent_id) WHERE parent_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view messages in your channels" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()) AND NOT (auth.uid() = ANY(deleted_for)));
CREATE POLICY "send message to your channels" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "edit own messages or hide" ON public.chat_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "delete own messages" ON public.chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Reactions
CREATE TABLE public.chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.chat_reactions TO authenticated;
GRANT ALL ON public.chat_reactions TO service_role;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view reactions" ON public.chat_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid())));
CREATE POLICY "react to messages" ON public.chat_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid())));
CREATE POLICY "remove own reaction" ON public.chat_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Presence
CREATE TABLE public.chat_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online','away','busy','offline')),
  typing_in uuid,
  last_seen timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_presence TO authenticated;
GRANT ALL ON public.chat_presence TO service_role;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone authed views presence" ON public.chat_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "upsert own presence" ON public.chat_presence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own presence" ON public.chat_presence FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Audit
CREATE TABLE public.chat_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_id uuid,
  message_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_audit_log TO authenticated;
GRANT ALL ON public.chat_audit_log TO service_role;
ALTER TABLE public.chat_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select audit" ON public.chat_audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert audit" ON public.chat_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER chat_channels_updated BEFORE UPDATE ON public.chat_channels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER chat_messages_updated BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER chat_presence_updated BEFORE UPDATE ON public.chat_presence FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_presence;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_presence REPLICA IDENTITY FULL;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files','chat-files', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat files: owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chat files: upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chat files: delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed default channels owned by no one but discoverable; using a function for first user is overkill.
-- Insert system channels as public empty channels created by a placeholder; skipped — users create channels in UI.
