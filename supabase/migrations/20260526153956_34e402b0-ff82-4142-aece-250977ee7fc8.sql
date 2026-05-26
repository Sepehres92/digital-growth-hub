-- Audit log for media + AI video activity
CREATE TABLE public.video_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- upload | generate | render | export | publish | safety_block
  resource_type text NOT NULL, -- image | video | audio | logo | voice | render | post
  resource_id text,
  video_project_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.video_audit_log TO authenticated;
GRANT ALL ON public.video_audit_log TO service_role;

ALTER TABLE public.video_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.video_audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.video_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_video_audit_user_created ON public.video_audit_log (user_id, created_at DESC);
CREATE INDEX idx_video_audit_project ON public.video_audit_log (video_project_id);

-- Persistent rights acknowledgements per asset (or per generation request)
CREATE TABLE public.content_rights_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_type text NOT NULL, -- image | video | audio | music | logo | voice | ai_generation | publish
  resource_ref text NOT NULL,  -- storage path, URL, project id, or render id
  owns_rights boolean NOT NULL,
  music_licensed boolean NOT NULL DEFAULT false,
  no_celebrity_likeness boolean NOT NULL DEFAULT false,
  no_fake_endorsement boolean NOT NULL DEFAULT false,
  no_misleading_claims boolean NOT NULL DEFAULT false,
  human_reviewed boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.content_rights_acknowledgements TO authenticated;
GRANT ALL ON public.content_rights_acknowledgements TO service_role;

ALTER TABLE public.content_rights_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.content_rights_acknowledgements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.content_rights_acknowledgements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rights_ack_user_ref ON public.content_rights_acknowledgements (user_id, resource_ref);