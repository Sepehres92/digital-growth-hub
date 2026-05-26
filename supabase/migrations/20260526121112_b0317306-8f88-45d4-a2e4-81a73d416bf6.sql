
-- creative_projects
CREATE TABLE public.creative_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  campaign_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creative_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.creative_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.creative_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.creative_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.creative_projects FOR DELETE USING (auth.uid() = user_id);

-- client_images
CREATE TABLE public.client_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.client_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.client_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.client_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.client_images FOR DELETE USING (auth.uid() = user_id);

-- generated_images
CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  campaign_id UUID,
  source_image_id UUID,
  prompt TEXT NOT NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('from_scratch','edit_uploaded_image')),
  style TEXT,
  size TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.generated_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.generated_images FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_creative_projects_user ON public.creative_projects(user_id);
CREATE INDEX idx_client_images_user ON public.client_images(user_id);
CREATE INDEX idx_generated_images_user ON public.generated_images(user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads','client-uploads', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images','generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- client-uploads: private, per-user folder
CREATE POLICY "client-uploads select own" ON storage.objects FOR SELECT
USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client-uploads insert own" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client-uploads update own" ON storage.objects FOR UPDATE
USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client-uploads delete own" ON storage.objects FOR DELETE
USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- generated-images: public read, owner-only write
CREATE POLICY "generated-images public select" ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');
CREATE POLICY "generated-images insert own" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "generated-images update own" ON storage.objects FOR UPDATE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "generated-images delete own" ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
