
CREATE TABLE public.seo_ppc_admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  seo_enabled boolean NOT NULL DEFAULT true,
  ppc_enabled boolean NOT NULL DEFAULT true,
  free_consultation_minutes integer NOT NULL DEFAULT 60,
  paid_consultation_price numeric NOT NULL DEFAULT 0,
  seo_specialist_ids uuid[] NOT NULL DEFAULT '{}',
  ppc_specialist_ids uuid[] NOT NULL DEFAULT '{}',
  booking_link text NOT NULL DEFAULT '',
  payment_link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_ppc_admin_settings TO authenticated;
GRANT ALL ON public.seo_ppc_admin_settings TO service_role;

ALTER TABLE public.seo_ppc_admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.seo_ppc_admin_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.seo_ppc_admin_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.seo_ppc_admin_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.seo_ppc_admin_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER seo_ppc_admin_settings_updated_at
BEFORE UPDATE ON public.seo_ppc_admin_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
