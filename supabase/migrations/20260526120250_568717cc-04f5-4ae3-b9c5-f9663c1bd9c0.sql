CREATE TABLE public.ai_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  campaign_id uuid,
  mode text NOT NULL,
  prompt text NOT NULL,
  style text,
  size text,
  source_url text,
  image_url text NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.ai_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.ai_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.ai_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.ai_images FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX ai_images_user_created_idx ON public.ai_images (user_id, created_at DESC);
CREATE INDEX ai_images_client_idx ON public.ai_images (client_id);
CREATE INDEX ai_images_campaign_idx ON public.ai_images (campaign_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('ai-images', 'ai-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ai-images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-images');

CREATE POLICY "ai-images auth insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ai-images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);