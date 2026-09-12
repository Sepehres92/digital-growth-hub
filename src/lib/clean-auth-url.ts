const AUTH_CALLBACK_KEYS = [
  "code",
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "id_token",
  "token",
  "token_hash",
  "expires_in",
  "expires_at",
  "token_type",
  "type",
  "error",
  "error_code",
  "error_description",
  "error_uri",
  "state",
];

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
    let hashDirty = false;
    for (const key of AUTH_CALLBACK_KEYS) {
      if (params.has(key)) {
        params.delete(key);
        dirty = true;
        hashDirty = true;
      }
    }
    if (hashDirty) {
      const rest = params.toString();
      url.hash = rest ? `#${rest}` : "";
    }
  }

  for (const key of AUTH_CALLBACK_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      dirty = true;
    }
  }

  if (!dirty) return;

  const clean = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", clean || url.pathname);
}
