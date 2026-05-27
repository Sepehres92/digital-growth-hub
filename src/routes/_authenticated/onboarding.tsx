import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getMarketingProfile,
  saveMarketingProfile,
  completeOnboarding,
} from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const PLATFORMS = ["Instagram", "Facebook", "X", "TikTok", "YouTube", "Google Ads", "SEO"];
const CONTENT_TYPES = ["image", "video", "carousel", "blog", "ad", "email"];

type ProfileState = Record<string, unknown>;

function OnboardingPage() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMarketingProfile);
  const saveProfile = useServerFn(saveMarketingProfile);
  const finish = useServerFn(completeOnboarding);

  const [chose, setChose] = useState<null | "real">(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<ProfileState>({});

  useEffect(() => {
    getProfile({})
      .then((r) => {
        if (r.profile) {
          setP(r.profile as ProfileState);
          if ((r.profile as { onboarding_step?: number }).onboarding_step != null) {
            setStep((r.profile as { onboarding_step: number }).onboarding_step);
            setChose("real");
          }
        }
      })
      .finally(() => setLoading(false));
  }, [getProfile]);

  const set = (k: string, v: unknown) => setP((prev) => ({ ...prev, [k]: v }));
  const toggleArr = (k: string, v: string) => {
    const cur = (p[k] as string[]) ?? [];
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };

  async function persist(patch: ProfileState = {}) {
    setSaving(true);
    try {
      const next = { ...p, ...patch, onboarding_step: step };
      await saveProfile({ data: next });
      setP(next);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    await persist({ onboarding_step: step + 1 });
    setStep((s) => s + 1);
  }
  async function back() {
    setStep((s) => Math.max(0, s - 1));
  }
  async function complete() {
    setSaving(true);
    try {
      await saveProfile({ data: { ...p, onboarding_step: step } });
      await finish({});
      toast.success("Workspace ready");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Entry choice
  if (!chose) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Welcome to Agency OS</h1>
          <p className="text-muted-foreground">How do you want to start?</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer transition hover:border-primary"
            onClick={() => setChose("real")}
          >
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <CardTitle>Create My Real Workspace</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              For real businesses and real client data. We'll ask the important questions once and reuse them everywhere.
            </CardContent>
          </Card>
          <Link to="/demo-templates" className="block">
            <Card className="cursor-pointer transition hover:border-primary">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FlaskConical className="size-5" />
                </div>
                <CardTitle>Try Demo Workspace</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Explore with sample data. Pick a sample business — publishing & payments are disabled.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  // Wizard steps
  const TOTAL = 5;
  const progress = ((step + 1) / TOTAL) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Smart Onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {TOTAL} · You can save & continue later
        </p>
        <Progress value={progress} className="mt-3" />
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Business name" required>
              <Input value={(p.business_name as string) ?? ""} onChange={(e) => set("business_name", e.target.value)} />
            </Field>
            <Field label="Website URL">
              <Input value={(p.website_url as string) ?? ""} onChange={(e) => set("website_url", e.target.value)} placeholder="https://" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Industry">
                <Input value={(p.industry as string) ?? ""} onChange={(e) => set("industry", e.target.value)} />
              </Field>
              <Field label="Location / service area">
                <Input value={(p.location as string) ?? ""} onChange={(e) => set("location", e.target.value)} />
              </Field>
            </div>
            <Field label="Main services / products">
              <Textarea value={(p.services as string) ?? ""} onChange={(e) => set("services", e.target.value)} rows={2} />
            </Field>
            <Field label="Target audience">
              <Textarea value={(p.target_audience as string) ?? ""} onChange={(e) => set("target_audience", e.target.value)} rows={2} />
            </Field>
            <Field label="Main business goal">
              <Textarea value={(p.main_goal as string) ?? ""} onChange={(e) => set("main_goal", e.target.value)} rows={2} />
            </Field>
            <Field label="Monthly marketing budget range">
              <Input value={(p.budget_range as string) ?? ""} onChange={(e) => set("budget_range", e.target.value)} placeholder="e.g. $1,000 – $5,000" />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Brand tone">
              <Input value={(p.brand_tone as string) ?? ""} onChange={(e) => set("brand_tone", e.target.value)} placeholder="Professional, witty, warm…" />
            </Field>
            <Field label="Brand colors (comma separated hex)">
              <Input
                value={((p.brand_colors as string[]) ?? []).join(", ")}
                onChange={(e) => set("brand_colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="#0F172A, #3B82F6"
              />
            </Field>
            <Field label="Logo URL (paste link or upload elsewhere later)">
              <Input value={(p.logo_url as string) ?? ""} onChange={(e) => set("logo_url", e.target.value)} />
            </Field>
            <Field label="Competitors">
              <Textarea value={(p.competitors as string) ?? ""} onChange={(e) => set("competitors", e.target.value)} rows={2} />
            </Field>
            <Field label="Unique selling points">
              <Textarea value={(p.usps as string) ?? ""} onChange={(e) => set("usps", e.target.value)} rows={2} />
            </Field>
            <Field label="Current offers / promotions (optional)">
              <Textarea value={(p.offers as string) ?? ""} onChange={(e) => set("offers", e.target.value)} rows={2} />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Marketing Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2 block">Platforms to use</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((pl) => {
                  const active = ((p.platforms as string[]) ?? []).includes(pl);
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => toggleArr("platforms", pl)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {pl}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Posting frequency">
              <Input value={(p.posting_frequency as string) ?? ""} onChange={(e) => set("posting_frequency", e.target.value)} placeholder="e.g. 3x / week" />
            </Field>
            <div>
              <Label className="mb-2 block">Preferred content types</Label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((ct) => {
                  const active = ((p.content_types as string[]) ?? []).includes(ct);
                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => toggleArr("content_types", ct)}
                      className={`rounded-md border px-3 py-1.5 text-sm capitalize transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {ct}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="approval"
                checked={Boolean(p.approval_required)}
                onCheckedChange={(v) => set("approval_required", Boolean(v))}
              />
              <Label htmlFor="approval">Require approval before publishing</Label>
            </div>
            <div>
              <Label className="mb-2 block">Creation mode</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: "ai", l: "AI-only" },
                  { v: "human", l: "Human-assisted" },
                  { v: "ai_human", l: "AI + human review" },
                ].map((opt) => {
                  const active = p.creation_mode === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => set("creation_mode", opt.v)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {opt.l}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>SEO &amp; PPC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Target keywords (comma separated)">
              <Textarea
                value={((p.target_keywords as string[]) ?? []).join(", ")}
                onChange={(e) =>
                  set("target_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                rows={2}
              />
            </Field>
            <Field label="Target locations (comma separated)">
              <Input
                value={((p.target_locations as string[]) ?? []).join(", ")}
                onChange={(e) =>
                  set("target_locations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
              />
            </Field>
            <Field label="SEO competitors">
              <Textarea value={(p.seo_competitors as string) ?? ""} onChange={(e) => set("seo_competitors", e.target.value)} rows={2} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Monthly PPC budget">
                <Input
                  type="number"
                  value={(p.ppc_budget as number) ?? ""}
                  onChange={(e) => set("ppc_budget", e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Desired lead type">
                <Input value={(p.lead_type as string) ?? ""} onChange={(e) => set("lead_type", e.target.value)} placeholder="e.g. demo bookings" />
              </Field>
            </div>
            <Field label="Landing page URL">
              <Input value={(p.landing_page_url as string) ?? ""} onChange={(e) => set("landing_page_url", e.target.value)} />
            </Field>
            <Field label="Conversion goal">
              <Input value={(p.conversion_goal as string) ?? ""} onChange={(e) => set("conversion_goal", e.target.value)} placeholder="calls, forms, bookings, purchases" />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Team &amp; Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="portal"
                checked={Boolean(p.client_portal_enabled)}
                onCheckedChange={(v) => set("client_portal_enabled", Boolean(v))}
              />
              <Label htmlFor="portal">Enable client portal</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="human"
                checked={Boolean(p.human_consultation_requested)}
                onCheckedChange={(v) => set("human_consultation_requested", Boolean(v))}
              />
              <Label htmlFor="human">Request a free human consultation</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              You can invite team members from Settings later — no need to do it now.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" disabled={step === 0 || saving} onClick={back}>
            Back
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => persist()}>
            Save &amp; continue later
          </Button>
        </div>
        {step < 4 ? (
          <Button disabled={saving} onClick={next}>
            Next
          </Button>
        ) : (
          <Button disabled={saving} onClick={complete}>
            Finish setup
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
