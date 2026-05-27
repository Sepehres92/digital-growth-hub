
CREATE TABLE public.strategy_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  campaign_id uuid,
  business_name text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  services text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  posting_frequency text NOT NULL DEFAULT '',
  brand_assets text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  customize_mode boolean NOT NULL DEFAULT false,
  recommendations jsonb,
  customizations jsonb,
  status text NOT NULL DEFAULT 'intake',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_consultations TO authenticated;
GRANT ALL ON public.strategy_consultations TO service_role;
ALTER TABLE public.strategy_consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.strategy_consultations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.strategy_consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.strategy_consultations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.strategy_consultations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER set_strategy_consultations_updated_at BEFORE UPDATE ON public.strategy_consultations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.human_strategist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid,
  consultation_id uuid REFERENCES public.strategy_consultations(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  preferred_time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.human_strategist_requests TO authenticated;
GRANT ALL ON public.human_strategist_requests TO service_role;
ALTER TABLE public.human_strategist_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.human_strategist_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.human_strategist_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.human_strategist_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.human_strategist_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER set_human_strategist_requests_updated_at BEFORE UPDATE ON public.human_strategist_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
