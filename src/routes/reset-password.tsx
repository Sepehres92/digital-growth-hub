import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead({
      path: "/reset-password",
      title: "Reset password — Digital Agency OS",
      description: "Choose a new password for your Digital Agency OS account.",
      noindex: true,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            required
            aria-describedby="new-password-help"
            className="mt-1.5 min-h-11"
          />
          <p id="new-password-help" className="mt-1.5 text-xs text-muted-foreground">
            At least 12 characters. Three or four unrelated words make a strong,
            memorable passphrase.
          </p>
        </div>
        <Button type="submit" className="min-h-11 w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>

      </form>
    </div>
  );
}
