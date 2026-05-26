import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [email, setEmail] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      setEmail(u.user.email ?? "");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setAgencyName(profile.agency_name ?? "");
      setDisplayName(profile.display_name ?? "");
      const t = (profile.theme === "dark" ? "dark" : "light") as "light" | "dark";
      setTheme(t);
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  }, [profile]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({
        id: u.user.id,
        agency_name: agencyName.trim() || null,
        display_name: displayName.trim() || null,
        theme,
      });
      if (error) throw error;
      document.documentElement.classList.toggle("dark", theme === "dark");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your agency profile.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}
        className="space-y-6 rounded-xl border border-border bg-card p-6"
      >
        <div>
          <h2 className="font-semibold">Agency</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Agency name</Label>
              <Input className="mt-1.5" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Acme Digital" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input className="mt-1.5" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={email} disabled />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="font-semibold">Theme</h2>
          <div className="mt-4">
            <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
          >
            Sign out
          </Button>
          <Button type="submit" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
