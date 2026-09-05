-- Remove table-level grants that expose token columns to client roles
REVOKE ALL ON public.social_accounts FROM anon;
REVOKE ALL ON public.social_accounts FROM authenticated;

-- Authenticated clients: read only non-sensitive metadata (RLS still scopes rows to the owner)
GRANT SELECT (id, user_id, platform, account_name, expires_at, created_at) ON public.social_accounts TO authenticated;
-- Authenticated clients may still connect/update their own accounts (tokens write-only, never readable back)
GRANT INSERT (user_id, platform, account_name, access_token, refresh_token, expires_at) ON public.social_accounts TO authenticated;
GRANT UPDATE (platform, account_name, access_token, refresh_token, expires_at) ON public.social_accounts TO authenticated;
GRANT DELETE ON public.social_accounts TO authenticated;

-- Service role keeps full access to tokens
GRANT ALL ON public.social_accounts TO service_role;