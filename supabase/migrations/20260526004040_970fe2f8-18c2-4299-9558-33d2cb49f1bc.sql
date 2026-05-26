-- Open up reads/inserts to everyone
DROP POLICY IF EXISTS "anyone authenticated can view posts" ON public.blog_posts;
DROP POLICY IF EXISTS "insert own posts" ON public.blog_posts;

CREATE POLICY "anyone can view posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anyone can insert posts"
  ON public.blog_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(title) BETWEEN 1 AND 200
    AND char_length(content) BETWEEN 1 AND 20000
    AND char_length(coalesce(author_name, '')) BETWEEN 1 AND 80
  );

-- Make user_id nullable for guest posts
ALTER TABLE public.blog_posts ALTER COLUMN user_id DROP NOT NULL;

-- Public storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "blog images public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog images public upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'blog-images');