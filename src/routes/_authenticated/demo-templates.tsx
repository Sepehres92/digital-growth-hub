import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedDemoWorkspace } from "@/lib/onboarding.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Home, Building2, UtensilsCrossed, Dumbbell, Hammer, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/demo-templates")({
  component: DemoTemplates,
});

const TEMPLATES = [
  { key: "roofing", label: "Roofing company", desc: "Local home services", icon: Home },
  { key: "real_estate", label: "Real estate agent", desc: "Residential & luxury", icon: Building2 },
  { key: "restaurant", label: "Restaurant", desc: "Bistro & catering", icon: UtensilsCrossed },
  { key: "fitness", label: "Fitness coach", desc: "Online coaching", icon: Dumbbell },
  { key: "contractor", label: "Local contractor", desc: "Renovations & remodels", icon: Hammer },
  { key: "agency", label: "Digital marketing agency", desc: "SMB growth shop", icon: Briefcase },
] as const;

function DemoTemplates() {
  const navigate = useNavigate();
  const seed = useServerFn(seedDemoWorkspace);
  const [busy, setBusy] = useState<string | null>(null);

  async function pick(key: string) {
    setBusy(key);
    try {
      await seed({ data: { template: key as "roofing" } });
      toast.success("Demo workspace created");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pick a demo business</h1>
        <p className="text-sm text-muted-foreground">
          We'll create a sample client, campaigns, content calendar, and posts so you can explore safely.
          Publishing, payments, and integrations stay disabled while in demo mode.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Card key={t.key} className="transition hover:border-primary">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <t.icon className="size-5" />
              </div>
              <CardTitle>{t.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <Button className="w-full" disabled={busy !== null} onClick={() => pick(t.key)}>
                {busy === t.key ? "Setting up…" : "Use this demo"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center text-sm">
        <Link to="/onboarding" className="text-muted-foreground underline">
          ← Back to onboarding
        </Link>
      </div>
    </div>
  );
}
