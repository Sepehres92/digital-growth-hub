import assert from "node:assert/strict";
import test from "node:test";

import {
  completeAuthCallback,
  shouldDeferAuthUrlCleanup,
} from "../src/lib/auth-callback-response.ts";
import { cleanAuthUrl } from "../src/lib/clean-auth-url.ts";

const session = { user: { id: "test-user" } };

function unusedAuth(overrides: Record<string, unknown> = {}) {
  return {
    setSession: async () => ({ data: { session }, error: undefined }),
    exchangeCodeForSession: async () => ({ data: { session }, error: undefined }),
    getSession: async () => ({ data: { session: null }, error: undefined }),
    ...overrides,
  };
}

test("hash token pair is captured and URL cleanup precedes async session completion", async () => {
  const calls: string[] = [];
  const accessToken = "fixture-access-token";
  const refreshToken = "fixture-refresh-token";
  let capturedTokens: { access_token: string; refresh_token: string } | undefined;
  let resolveSession!: (value: { data: { session: typeof session } }) => void;
  const deferredSession = new Promise<{ data: { session: typeof session } }>((resolve) => {
    resolveSession = resolve;
  });

  const completion = completeAuthCallback({
    href: `https://example.test/auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=3600`,
    auth: unusedAuth({
      setSession: async (tokens: { access_token: string; refresh_token: string }) => {
        calls.push("setSession");
        capturedTokens = tokens;
        return deferredSession;
      },
    }),
    cleanup: () => calls.push("cleanup"),
  });

  assert.deepEqual(calls, ["cleanup", "setSession"]);
  assert.deepEqual(capturedTokens, {
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  resolveSession({ data: { session } });
  const result = await completion;
  assert.deepEqual(result, { ok: true });
  assert.doesNotMatch(JSON.stringify(result), /fixture-(access|refresh)-token/);
});

test("PKCE code is captured and URL cleanup precedes async exchange completion", async () => {
  const calls: string[] = [];
  const code = "fixture-code";
  let capturedCode: string | undefined;
  let resolveExchange!: (value: { data: { session: typeof session } }) => void;
  const deferredExchange = new Promise<{ data: { session: typeof session } }>((resolve) => {
    resolveExchange = resolve;
  });

  const completion = completeAuthCallback({
    href: `https://example.test/auth/callback?code=${code}`,
    auth: unusedAuth({
      exchangeCodeForSession: async (receivedCode: string) => {
        calls.push("exchangeCodeForSession");
        capturedCode = receivedCode;
        return deferredExchange;
      },
    }),
    cleanup: () => calls.push("cleanup"),
  });

  assert.deepEqual(calls, ["cleanup", "exchangeCodeForSession"]);
  assert.equal(capturedCode, code);

  resolveExchange({ data: { session } });
  const result = await completion;
  assert.deepEqual(result, { ok: true });
  assert.doesNotMatch(JSON.stringify(result), /fixture-code/);
});

test("provider errors synchronously sanitize query and hash without calling Supabase", async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const queryDetail = "access_token=query-description-secret&refresh_token=query-refresh-secret";
  const hashDetail = "id_token=hash-description-secret&code=hash-description-code";
  const href =
    "https://example.test/auth/callback" +
    `?campaign=spring&error=access_denied&error_code=query-code&error_description=${encodeURIComponent(queryDetail)}` +
    `&error_uri=${encodeURIComponent("https://provider.test/query-error")}&state=query-state&code=query-credential&provider_token=query-provider-token` +
    `#tab=security&error=server_error&error_code=hash-code&error_description=${encodeURIComponent(hashDetail)}` +
    `&error_uri=${encodeURIComponent("https://provider.test/hash-error")}&state=hash-state&access_token=hash-access-token&refresh_token=hash-refresh-token`;
  const calls: string[] = [];
  let replacement = "";
  let settled = false;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { href },
      history: {
        state: { fixture: true },
        replaceState: (_state: unknown, _title: string, nextUrl: string) => {
          assert.equal(settled, false);
          calls.push("replaceState");
          replacement = nextUrl;
        },
      },
    },
  });

  try {
    const failIfCalled = async () => {
      calls.push("supabase-session-method");
      return { data: { session }, error: undefined };
    };
    const completion = completeAuthCallback({
      href,
      auth: unusedAuth({
        setSession: failIfCalled,
        exchangeCodeForSession: failIfCalled,
        getSession: failIfCalled,
      }),
      cleanup: cleanAuthUrl,
    });
    void completion.then(() => {
      settled = true;
    });

    assert.equal(settled, false);
    assert.deepEqual(calls, ["replaceState"]);
    assert.equal(replacement, "/auth/callback?campaign=spring#tab=security");
    assert.doesNotMatch(
      replacement,
      /error|state|code|token|query-description-secret|hash-description-secret/,
    );

    const result = await completion;
    assert.equal(settled, true);
    assert.deepEqual(calls, ["replaceState"]);
    assert.equal(result.ok, false);
    assert.match(result.ok ? "" : result.message, /Return to sign in and try again/);
    assert.doesNotMatch(
      JSON.stringify(result),
      /query-description-secret|hash-description-secret|access_token|id_token/,
    );
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});

test("an incomplete hash token pair fails visibly without calling Supabase", async () => {
  const calls: string[] = [];
  const result = await completeAuthCallback({
    href: "https://example.test/auth/callback#access_token=orphaned-secret",
    auth: unusedAuth({
      setSession: async () => {
        calls.push("setSession");
        return { data: { session }, error: undefined };
      },
    }),
    cleanup: () => calls.push("cleanup"),
  });

  assert.deepEqual(calls, ["cleanup"]);
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.message, /incomplete response/);
  assert.doesNotMatch(JSON.stringify(result), /orphaned-secret/);
});

test("an empty callback checks for an existing session and reports when absent", async () => {
  const calls: string[] = [];
  const result = await completeAuthCallback({
    href: "https://example.test/auth/callback",
    auth: unusedAuth({
      getSession: async () => {
        calls.push("getSession");
        return { data: { session: null }, error: undefined };
      },
    }),
    cleanup: () => calls.push("cleanup"),
  });

  assert.deepEqual(calls, ["getSession", "cleanup"]);
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.message, /No Google sign-in response/);
});

test("session failures remain fixed text after synchronous URL cleanup", async () => {
  const calls: string[] = [];
  const result = await completeAuthCallback({
    href: "https://example.test/auth/callback?code=bad-code",
    auth: unusedAuth({
      exchangeCodeForSession: async () => {
        calls.push("exchangeCodeForSession");
        throw new Error("credential-shaped provider detail");
      },
    }),
    cleanup: () => calls.push("cleanup"),
  });

  assert.deepEqual(calls, ["cleanup", "exchangeCodeForSession"]);
  assert.equal(result.ok, false);
  assert.doesNotMatch(JSON.stringify(result), /credential-shaped provider detail|bad-code/);
});

test("root URL cleanup defers for callback paths only", () => {
  assert.equal(shouldDeferAuthUrlCleanup("/auth/callback"), true);
  assert.equal(shouldDeferAuthUrlCleanup("/auth/callback/"), true);
  assert.equal(shouldDeferAuthUrlCleanup("/auth"), false);
  assert.equal(shouldDeferAuthUrlCleanup("/dashboard"), false);
});
