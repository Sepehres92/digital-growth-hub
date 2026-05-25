
CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','proposal','won','lost');

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_user_id_idx ON public.leads(user_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
