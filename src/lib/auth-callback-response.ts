export type AuthCallbackSession = object | null;

type AuthSessionResult = {
  data: { session: AuthCallbackSession };
  error?: unknown;
};

export type AuthCallbackClient = {
  setSession: (tokens: {
    access_token: string;
    refresh_token: string;
  }) => Promise<AuthSessionResult>;
  exchangeCodeForSession: (code: string) => Promise<AuthSessionResult>;
  getSession: () => Promise<AuthSessionResult>;
};

export type AuthCallbackCompletion = { ok: true } | { ok: false; message: string };

const PROVIDER_ERROR_MESSAGE =
  "Google sign-in was cancelled or denied. Return to sign in and try again.";
const INCOMPLETE_RESPONSE_MESSAGE =
  "Google sign-in returned an incomplete response. Return to sign in and try again.";
const MISSING_RESPONSE_MESSAGE =
  "No Google sign-in response was found. Return to sign in and try again.";
const SESSION_ERROR_MESSAGE =
  "Google sign-in did not create a session. Return to sign in and try again.";

type CallbackResponse =
  | { kind: "provider-error" }
  | { kind: "pkce"; code: string }
  | { kind: "tokens"; accessToken: string; refreshToken: string }
  | { kind: "incomplete-tokens" }
  | { kind: "missing" };

function callbackParams(url: URL): URLSearchParams[] {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  return [url.searchParams, new URLSearchParams(hash)];
}

function parseCallbackResponse(href: string): CallbackResponse {
  const url = new URL(href);
  const [query, hash] = callbackParams(url);

  if (query.has("error") || hash.has("error")) {
    return { kind: "provider-error" };
  }

  const code = query.get("code");
  if (code) return { kind: "pkce", code };

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "tokens", accessToken, refreshToken };
  }
  if (accessToken || refreshToken) return { kind: "incomplete-tokens" };

  return { kind: "missing" };
}

async function establishSession(
  operation: () => Promise<AuthSessionResult>,
): Promise<AuthCallbackCompletion> {
  try {
    const result = await operation();
    return !result.error && result.data.session
      ? { ok: true }
      : { ok: false, message: SESSION_ERROR_MESSAGE };
  } catch {
    return { ok: false, message: SESSION_ERROR_MESSAGE };
  }
}

/**
 * Captures callback credentials before removing them from browser history,
 * then starts session work from that in-memory copy.
 * Returned failures are deliberately fixed strings so provider/session details
 * cannot accidentally render credential material.
 */
export async function completeAuthCallback({
  href,
  auth,
  cleanup,
}: {
  href: string;
  auth: AuthCallbackClient;
  cleanup: () => void;
}): Promise<AuthCallbackCompletion> {
  const response = parseCallbackResponse(href);

  if (response.kind === "provider-error") {
    cleanup();
    return { ok: false, message: PROVIDER_ERROR_MESSAGE };
  }

  if (response.kind === "incomplete-tokens") {
    cleanup();
    return { ok: false, message: INCOMPLETE_RESPONSE_MESSAGE };
  }

  if (response.kind === "tokens") {
    const tokens = {
      access_token: response.accessToken,
      refresh_token: response.refreshToken,
    };
    cleanup();
    return establishSession(() => auth.setSession(tokens));
  }

  if (response.kind === "pkce") {
    const code = response.code;
    cleanup();
    return establishSession(() => auth.exchangeCodeForSession(code));
  }

  try {
    const result = await auth.getSession();
    cleanup();
    return !result.error && result.data.session
      ? { ok: true }
      : { ok: false, message: MISSING_RESPONSE_MESSAGE };
  } catch {
    cleanup();
    return { ok: false, message: MISSING_RESPONSE_MESSAGE };
  }
}

export function shouldDeferAuthUrlCleanup(pathname: string): boolean {
  return pathname === "/auth/callback" || pathname === "/auth/callback/";
}
