
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  campaign_id uuid,
  platform text NOT NULL CHECK (platform IN ('instagram','facebook','x','tiktok','youtube')),
  caption text NOT NULL DEFAULT '',
  hashtags text DEFAULT '',
  cta text DEFAULT '',
  link text DEFAULT '',
  media_url text DEFAULT '',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','scheduled','published','failed','rejected')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.social_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.social_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.social_posts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_social_posts_user_date ON public.social_posts(user_id, scheduled_at);

CREATE TRIGGER set_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image','video','logo','other')),
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','ai','brand')),
  tags text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.media_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.media_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.media_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.media_assets FOR DELETE USING (auth.uid() = user_id);
