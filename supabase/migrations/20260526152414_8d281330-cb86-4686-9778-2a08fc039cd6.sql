
-- Extend video_projects
ALTER TABLE public.video_projects
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT '9:16',
  ADD COLUMN IF NOT EXISTS style text NOT NULL DEFAULT 'cinematic';

-- Extend video_assets
ALTER TABLE public.video_assets
  ADD COLUMN IF NOT EXISTS file_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration numeric;

-- video_scenes
CREATE TABLE IF NOT EXISTS public.video_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_project_id uuid NOT NULL,
  scene_order integer NOT NULL DEFAULT 1,
  scene_prompt text NOT NULL DEFAULT '',
  script_text text NOT NULL DEFAULT '',
  visual_description text NOT NULL DEFAULT '',
  duration numeric,
  media_url text NOT NULL DEFAULT '',
  text_overlay text NOT NULL DEFAULT '',
  transition text NOT NULL DEFAULT 'cut',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_scenes TO authenticated;
GRANT ALL ON public.video_scenes TO service_role;
ALTER TABLE public.video_scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_scenes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_scenes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_scenes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_scenes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_video_scenes_project ON public.video_scenes(video_project_id);

-- video_renders
CREATE TABLE IF NOT EXISTS public.video_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_project_id uuid NOT NULL,
  render_url text NOT NULL DEFAULT '',
  render_status text NOT NULL DEFAULT 'pending',
  export_format text NOT NULL DEFAULT 'mp4',
  platform text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_renders TO authenticated;
GRANT ALL ON public.video_renders TO service_role;
ALTER TABLE public.video_renders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_renders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_renders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_renders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_renders FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_video_renders_project ON public.video_renders(video_project_id);

-- video_templates (shared library)
CREATE TABLE IF NOT EXISTS public.video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT '9:16',
  template_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_templates TO authenticated;
GRANT ALL ON public.video_templates TO service_role;
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all authenticated read templates" ON public.video_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert templates" ON public.video_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update templates" ON public.video_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete templates" ON public.video_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- video_subtitles
CREATE TABLE IF NOT EXISTS public.video_subtitles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_project_id uuid NOT NULL,
  subtitle_text text NOT NULL DEFAULT '',
  start_time numeric NOT NULL DEFAULT 0,
  end_time numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_subtitles TO authenticated;
GRANT ALL ON public.video_subtitles TO service_role;
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.video_subtitles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_subtitles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.video_subtitles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.video_subtitles FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_video_subtitles_project ON public.video_subtitles(video_project_id);
