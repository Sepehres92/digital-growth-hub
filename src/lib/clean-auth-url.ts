const TOKEN_HASH_KEYS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "id_token",
  "expires_in",
  "expires_at",
  "token_type",
  "type",
];

const TOKEN_QUERY_KEYS = ["code", "access_token", "refresh_token", "id_token", "token", "token_hash"];

/**
 * Removes any OAuth / recovery credential material from the address bar and
 * from browser history, without navigating. Safe to call repeatedly.
 */
export function cleanAuthUrl(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let dirty = false;

  if (url.hash && url.hash.length > 1) {
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    for (const key of TOKEN_HASH_KEYS) {
      if (params.has(key)) {
        params.delete(key);
        dirty = true;
      }
    }
    if (dirty) {
      const rest = params.toString();
      url.hash = rest ? `#${rest}` : "";
    }
  }

  for (const key of TOKEN_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      dirty = true;
    }
  }

  if (!dirty) return;

  const clean = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", clean || url.pathname);
}
