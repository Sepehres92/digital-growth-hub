/**
 * Server-only access to OAuth token material for connected social accounts.
 *
 * Tokens live in `public.social_account_tokens`, which has no grants for the
 * `anon` or `authenticated` roles and RLS enabled with no policies — only the
 * service role can read or write it. Never return these values to the browser
 * and never log them.
 */

type SocialTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Read tokens for an account. Server-side use only (refresh, publish, crawl). */
export async function getSocialAccountTokens(
  accountId: string,
  userId: string,
): Promise<SocialTokens | null> {
  const db = await admin();
  const { data, error } = await db
    .from("social_account_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not read connection credentials: ${error.message}`);
  if (!data) return null;
  return {
    accessToken: data.access_token ?? null,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_at ?? null,
  };
}

/** Store or replace tokens after an OAuth callback or refresh. */
export async function saveSocialAccountTokens(params: {
  accountId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
}): Promise<void> {
  const db = await admin();
  const { error } = await db.from("social_account_tokens").upsert(
    {
      account_id: params.accountId,
      user_id: params.userId,
      access_token: params.accessToken ?? null,
      refresh_token: params.refreshToken ?? null,
      expires_at: params.expiresAt ?? null,
    },
    { onConflict: "account_id" },
  );
  if (error) throw new Error(`Could not store connection credentials: ${error.message}`);

  if (params.expiresAt !== undefined) {
    await db.from("social_accounts").update({ expires_at: params.expiresAt }).eq("id", params.accountId);
  }
}

/** Remove tokens on disconnect. Deleting the account row cascades here too. */
export async function deleteSocialAccountTokens(accountId: string, userId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("social_account_tokens")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", userId);
  if (error) throw new Error(`Could not remove connection credentials: ${error.message}`);
}
