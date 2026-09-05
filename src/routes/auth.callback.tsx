import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanAuthUrl } from "@/lib/clean-auth-url";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Digital Agency OS" },
      { name: "description", content: "Completing your Digital Agency OS sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const go = (to: "/dashboard" | "/auth") => {
      if (!cancelled) navigate({ to, replace: true });
    };

    const start = async () => {
      // Complete a PKCE exchange if the provider returned a code, then strip
      // every token/code fragment from the address bar and history.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          /* falls through to the session checks below */
        }
      }
      cleanAuthUrl();
      return supabase.auth.getSession();
    };

    start().then(({ data }) => {
      if (data.session) return go("/dashboard");
      // The session may land a tick later via the auth listener.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          sub.subscription.unsubscribe();
          go("/dashboard");
        }
      });
      setTimeout(() => {
        sub.subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: d }) => go(d.session ? "/dashboard" : "/auth"));
      }, 4000);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
