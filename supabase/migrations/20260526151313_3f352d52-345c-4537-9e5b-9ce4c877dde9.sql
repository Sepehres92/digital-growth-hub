CREATE TABLE public.video_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  campaign_id uuid,
  type text NOT NULL DEFAULT 'idea',
  platform text NOT NULL DEFAULT 'tiktok',
  title text NOT NULL DEFAULT '',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  output text NOT NULL DEFAULT '',
  output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_projects TO authenticated;
GRANT ALL ON public.video_projects TO service_role;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.video_storyboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  scene_number integer NOT NULL DEFAULT 1,
  visual text NOT NULL DEFAULT '',
  voiceover text NOT NULL DEFAULT '',
  on_screen_text text NOT NULL DEFAULT '',
  shot_type text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 5,
  asset_needed text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_storyboards TO authenticated;
GRANT ALL ON public.video_storyboards TO service_role;
ALTER TABLE public.video_storyboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_storyboards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_storyboards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_storyboards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_storyboards FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.video_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  asset_type text NOT NULL DEFAULT 'clip',
  name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  storage_path text,
  content text NOT NULL DEFAULT '',
  tags text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_assets TO authenticated;
GRANT ALL ON public.video_assets TO service_role;
ALTER TABLE public.video_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_assets FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('video-assets', 'video-assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own video-assets read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'video-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own video-assets insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own video-assets update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'video-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own video-assets delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'video-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE INDEX idx_video_projects_user_created ON public.video_projects(user_id, created_at DESC);
CREATE INDEX idx_video_storyboards_project ON public.video_storyboards(project_id, scene_number);
CREATE INDEX idx_video_assets_user ON public.video_assets(user_id, created_at DESC);