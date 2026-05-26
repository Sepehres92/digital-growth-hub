
-- Meetings
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  campaign_id UUID,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  video_link TEXT,
  agenda TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meetings FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_meetings_user_date ON public.meetings(user_id, meeting_date);

-- Agenda items
CREATE TABLE public.meeting_agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  owner TEXT DEFAULT '',
  time_estimate INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_agenda_items TO authenticated;
GRANT ALL ON public.meeting_agenda_items TO service_role;
ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meeting_agenda_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meeting_agenda_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meeting_agenda_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meeting_agenda_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_agenda_meeting ON public.meeting_agenda_items(meeting_id);

-- Notes
CREATE TABLE public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discussion TEXT DEFAULT '',
  decisions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT ALL ON public.meeting_notes TO service_role;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meeting_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meeting_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meeting_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meeting_notes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_notes_meeting ON public.meeting_notes(meeting_id);

-- Action items
CREATE TABLE public.meeting_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT DEFAULT '',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_action_items TO authenticated;
GRANT ALL ON public.meeting_action_items TO service_role;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meeting_action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meeting_action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meeting_action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meeting_action_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_action_meeting ON public.meeting_action_items(meeting_id);

-- Attendees
CREATE TABLE public.meeting_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'team',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated;
GRANT ALL ON public.meeting_attendees TO service_role;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meeting_attendees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meeting_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meeting_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meeting_attendees FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_attendees_meeting ON public.meeting_attendees(meeting_id);

-- Attachments
CREATE TABLE public.meeting_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attachments TO authenticated;
GRANT ALL ON public.meeting_attachments TO service_role;
ALTER TABLE public.meeting_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meeting_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meeting_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meeting_attachments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meeting_attachments FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_attach_meeting ON public.meeting_attachments(meeting_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-files', 'meeting-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users select own meeting files" ON storage.objects FOR SELECT
  USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users upload own meeting files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own meeting files" ON storage.objects FOR DELETE
  USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Updated_at trigger
CREATE TRIGGER meetings_set_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER meeting_notes_set_updated_at
BEFORE UPDATE ON public.meeting_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
