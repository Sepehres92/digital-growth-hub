import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { setPendingConsent } from "@/lib/consent-pending";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["login", "signup"]).optional(),
    plan: z.string().optional(),
  }),
  head: () =>
    pageHead({
      path: "/auth",
      title: "Sign in — Digital Agency OS",
      description: "Sign in to your Digital Agency OS workspace, or create a new account.",
      noindex: true,
    }),
  component: AuthPage,
});

/**
 * Sign-up password policy. Login is deliberately unaffected so existing
 * accounts with older, shorter passwords keep working.
 */
function passwordProblem(pw: string, email: string): string | null {
  if (pw.length < 12) return "Use at least 12 characters — a short passphrase works well.";
  if (/^(.)\1+$/.test(pw)) return "That password is a single repeated character. Try a passphrase.";
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length > 2 && pw.toLowerCase().includes(local)) {
    return "Your password should not contain your email address.";
  }
  const common = ["password", "12345678", "qwerty", "letmein", "welcome", "agencyos"];
  if (common.some((c) => pw.toLowerCase().includes(c))) {
    return "That password contains a very common word. Try unrelated words instead.";
  }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length < 16 && variety < 2) {
    return "Mix in numbers, capitals or symbols — or use a longer passphrase (16+ characters).";
  }
  return null;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !consent) {
      toast.error("Please agree to the Terms and Privacy Policy.");
      return;
    }
    if (mode === "signup") {
      const weak = passwordProblem(password, email);
      if (weak) {
        toast.error(weak);
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        setPendingConsent("email_signup");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };


  const handleGoogle = async () => {
    // Google sign-in can create a brand-new account, so consent is required here too.
    if (!consent) {
      toast.error("Please agree to the Terms and Privacy Policy before continuing with Google.");
      return;
    }
    setLoading(true);
    setPendingConsent("google_oauth");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/auth/callback" });
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="size-7 rounded-md bg-primary" />
          <span className="font-semibold">Agency OS</span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your workspace"
              : "Get started in seconds"}
          </p>

          <label className="mt-6 flex min-h-11 items-start gap-2 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 rounded border-border"
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              Required to create an account, including with Google.
            </span>
          </label>

          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11 w-full"
            onClick={handleGoogle}
            disabled={loading || !consent}
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 min-h-11"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 12 : 6}
                aria-describedby={mode === "signup" ? "password-help" : undefined}
                className="mt-1.5 min-h-11"
              />
              {mode === "signup" && (
                <p id="password-help" className="mt-1.5 text-xs text-muted-foreground">
                  Use at least 12 characters. A passphrase of three or four unrelated
                  words (for example “amber-harbour-drift-92”) is easier to remember and
                  much harder to guess than a short password.
                </p>
              )}
            </div>
            <Button type="submit" className="min-h-11 w-full" disabled={loading || (mode === "signup" && !consent)}>
              {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
            {mode === "login" && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) return toast.error("Enter your email first");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Password reset email sent");
                }}
                className="flex min-h-11 w-full items-center justify-center text-center text-xs text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </button>
            )}
          </form>


          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="min-h-11 px-2 font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>

          <div className="mt-4 flex justify-center gap-2 text-xs text-muted-foreground">
            <Link to="/privacy" className="inline-flex min-h-11 items-center px-3 hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center px-3 hover:text-foreground">Terms</Link>
            <Link to="/cookies" className="inline-flex min-h-11 items-center px-3 hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

