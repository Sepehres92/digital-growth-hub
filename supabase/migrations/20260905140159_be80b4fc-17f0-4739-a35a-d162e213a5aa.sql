ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "anyone can view posts" ON public.blog_posts;

CREATE POLICY "published posts are public" ON public.blog_posts
FOR SELECT TO anon, authenticated
USING (published = true OR auth.uid() = user_id);