
-- Lock down sensitive token columns on social_accounts.
-- Authenticated users keep CRUD on their own row, but cannot read or write
-- access_token / refresh_token from the client. Server code uses the
-- service role, which is unaffected.

REVOKE SELECT, UPDATE, INSERT ON public.social_accounts FROM authenticated;

GRANT SELECT (id, user_id, platform, account_name, expires_at, created_at)
  ON public.social_accounts TO authenticated;

GRANT INSERT (id, user_id, platform, account_name, expires_at)
  ON public.social_accounts TO authenticated;

GRANT UPDATE (account_name, expires_at)
  ON public.social_accounts TO authenticated;

-- DELETE privilege unchanged (full-row delete is fine; RLS still scopes to owner).
GRANT DELETE ON public.social_accounts TO authenticated;
