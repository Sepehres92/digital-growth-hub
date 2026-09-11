import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanAuthUrl } from "@/lib/clean-auth-url";
import { completeAuthCallback } from "@/lib/auth-callback-response";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () =>
    pageHead({
      path: "/auth/callback",
      title: "Signing you in — Digital Agency OS",
      description: "Completing your Digital Agency OS sign-in.",
      noindex: true,
    }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const result = await completeAuthCallback({
        href: window.location.href,
        auth: {
          setSession: (tokens) => supabase.auth.setSession(tokens),
          exchangeCodeForSession: (code) => supabase.auth.exchangeCodeForSession(code),
          getSession: () => supabase.auth.getSession(),
        },
        cleanup: cleanAuthUrl,
      });

      if (cancelled) return;
      if (result.ok) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setErrorMessage(result.message);
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      {errorMessage ? (
        <div className="max-w-md text-center" role="alert">
          <h1 className="text-xl font-semibold text-foreground">Google sign-in failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
          <button
            type="button"
            className="mt-6 min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => navigate({ to: "/auth", replace: true })}
          >
            Return to sign in
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      )}
    </div>
  );
}
