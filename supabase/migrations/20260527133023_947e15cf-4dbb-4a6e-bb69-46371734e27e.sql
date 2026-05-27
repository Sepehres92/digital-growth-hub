
CREATE TABLE public.strategy_admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  human_consultation_enabled BOOLEAN NOT NULL DEFAULT true,
  free_consultation_minutes INTEGER NOT NULL DEFAULT 60,
  paid_consultation_price NUMERIC(10,2) NOT NULL DEFAULT 150,
  available_strategist_ids UUID[] NOT NULL DEFAULT '{}',
  booking_link TEXT NOT NULL DEFAULT '',
  payment_link TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_admin_settings TO authenticated;
GRANT ALL ON public.strategy_admin_settings TO service_role;
ALTER TABLE public.strategy_admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view strategy settings" ON public.strategy_admin_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert strategy settings" ON public.strategy_admin_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update strategy settings" ON public.strategy_admin_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete strategy settings" ON public.strategy_admin_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_strategy_admin_settings_updated_at
  BEFORE UPDATE ON public.strategy_admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
