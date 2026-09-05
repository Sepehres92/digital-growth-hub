ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS published_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "published posts are public" ON public.blog_posts;

CREATE POLICY "published posts are public" ON public.blog_posts
FOR SELECT TO anon
USING (published = true AND published_at <= now());

CREATE POLICY "authors read own or published posts" ON public.blog_posts
FOR SELECT TO authenticated
USING ((published = true AND published_at <= now()) OR auth.uid() = user_id);

-- social_account_tokens: explicit deny-by-default for client roles
REVOKE ALL ON public.social_account_tokens FROM anon, authenticated;
GRANT ALL ON public.social_account_tokens TO service_role;
ALTER TABLE public.social_account_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_account_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny all client access to tokens" ON public.social_account_tokens;
CREATE POLICY "deny all client access to tokens" ON public.social_account_tokens
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);