CREATE TABLE public.ai_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  variation TEXT,
  prompt_inputs JSONB,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_copies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.ai_copies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.ai_copies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.ai_copies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.ai_copies FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX ai_copies_user_created ON public.ai_copies(user_id, created_at DESC);