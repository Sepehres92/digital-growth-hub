-- Tighten KB article reads to owner only (per-tenant isolation)
DROP POLICY IF EXISTS "read published" ON public.chatbot_kb_articles;

-- Remove broad SELECT policies on public storage buckets to prevent
-- listing of all objects via the storage API. Files remain accessible
-- via their public CDN URLs.
DROP POLICY IF EXISTS "ai-images public read" ON storage.objects;
DROP POLICY IF EXISTS "blog images public read" ON storage.objects;
DROP POLICY IF EXISTS "generated-images public select" ON storage.objects;

-- Explicitly forbid client-side inserts into audit_logs.
-- Server code uses the service_role client which bypasses RLS, so audit
-- writes still work; authenticated/anon users get a clear deny.
DROP POLICY IF EXISTS "no client insert" ON public.audit_logs;
CREATE POLICY "no client insert" ON public.audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);