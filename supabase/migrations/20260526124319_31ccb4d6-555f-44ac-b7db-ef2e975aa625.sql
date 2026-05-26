
-- 1. social_accounts
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  account_name text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.social_accounts FOR DELETE USING (auth.uid() = user_id);

-- 2. content_posts
CREATE TABLE public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  campaign_id uuid,
  title text,
  caption text NOT NULL DEFAULT '',
  hashtags text NOT NULL DEFAULT '',
  platform text NOT NULL,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.content_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.content_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.content_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.content_posts FOR DELETE USING (auth.uid() = user_id);

-- 3. content_calendar
CREATE TABLE public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.content_posts(id) ON DELETE CASCADE,
  calendar_date date NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.content_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.content_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.content_calendar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.content_calendar FOR DELETE USING (auth.uid() = user_id);

-- 4. content_approvals
CREATE TABLE public.content_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  approved_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

-- Post owner or the approver can view
CREATE POLICY "owner or approver select" ON public.content_approvals
  FOR SELECT USING (
    auth.uid() = approved_by
    OR auth.uid() = (SELECT user_id FROM public.content_posts WHERE id = post_id)
  );
CREATE POLICY "approver insert" ON public.content_approvals
  FOR INSERT WITH CHECK (auth.uid() = approved_by);
CREATE POLICY "approver update" ON public.content_approvals
  FOR UPDATE USING (auth.uid() = approved_by);
CREATE POLICY "approver delete" ON public.content_approvals
  FOR DELETE USING (auth.uid() = approved_by);

CREATE INDEX idx_content_posts_user_scheduled ON public.content_posts(user_id, scheduled_for);
CREATE INDEX idx_content_calendar_user_date ON public.content_calendar(user_id, calendar_date);
CREATE INDEX idx_content_approvals_post ON public.content_approvals(post_id);
