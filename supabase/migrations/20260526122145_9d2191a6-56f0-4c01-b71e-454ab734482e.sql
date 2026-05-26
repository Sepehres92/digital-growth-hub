
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies -> only service role (server) can modify

-- 2. Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT policy -> only service role (server) can write

-- 3. Tighten blog_posts: remove anon insert
DROP POLICY IF EXISTS "anyone can insert posts" ON public.blog_posts;

CREATE POLICY "authenticated can insert posts" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND char_length(title) BETWEEN 1 AND 200
    AND char_length(content) BETWEEN 1 AND 20000
    AND char_length(COALESCE(author_name, '')) BETWEEN 1 AND 80
  );

-- 4. Constrain client_images file types
ALTER TABLE public.client_images
  ADD CONSTRAINT client_images_file_type_check
  CHECK (file_type IS NULL OR file_type IN ('image/png','image/jpeg','image/jpg','image/webp','image/gif'));
