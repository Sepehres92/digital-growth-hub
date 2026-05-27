import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMarketingProfile, saveMarketingProfile } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business-profile")({
  component: BusinessProfilePage,
});

const PLATFORMS = ["Instagram", "Facebook", "X", "TikTok", "YouTube", "Google Ads", "SEO"];
const CONTENT_TYPES = ["image", "video", "carousel", "blog", "ad", "email"];

type S = Record<string, unknown>;

function BusinessProfilePage() {
  const getProfile = useServerFn(getMarketingProfile);
  const save = useServerFn(saveMarketingProfile);
  const [p, setP] = useState<S>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile({})
      .then((r) => setP((r.profile as S) ?? {}))
      .finally(() => setLoading(false));
  }, [getProfile]);

  const set = (k: string, v: unknown) => setP((prev) => ({ ...prev, [k]: v }));
  const toggleArr = (k: string, v: string) => {
    const cur = (p[k] as string[]) ?? [];
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };

  async function onSave() {
    setSaving(true);
    try {
      const payload = {
        business_name: (p.business_name as string) || null,
        website_url: (p.website_url as string) || null,
        industry: (p.industry as string) || null,
        location: (p.location as string) || null,
        services: (p.services as string) || null,
        target_audience: (p.target_audience as string) || null,
        main_goal: (p.main_goal as string) || null,
        budget_range: (p.budget_range as string) || null,
        brand_tone: (p.brand_tone as string) || null,
        brand_colors: (p.brand_colors as string[]) ?? [],
        competitors: (p.competitors as string) || null,
        usps: (p.usps as string) || null,
        offers: (p.offers as string) || null,
        platforms: (p.platforms as string[]) ?? [],
        posting_frequency: (p.posting_frequency as string) || null,
        content_types: (p.content_types as string[]) ?? [],
        approval_required: Boolean(p.approval_required ?? true),
        creation_mode: ((p.creation_mode as "ai" | "human" | "ai_human") ?? "ai"),
        target_keywords: (p.target_keywords as string[]) ?? [],
        seo_competitors: (p.seo_competitors as string) || null,
        target_locations: (p.target_locations as string[]) ?? [],
        ppc_budget: (p.ppc_budget as number) ?? null,
        conversion_goal: (p.conversion_goal as string) || null,
        human_consultation_requested: Boolean(p.human_consultation_requested),
      };
      await save({ data: payload });
      toast.success("Business profile updated. All AI tools now use these answers.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="size-5 text-primary" /> Business Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One source of truth. Every AI tool reads from here so you never refill the same form twice.
          </p>
        </div>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Business basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Business name"><Input value={(p.business_name as string) ?? ""} onChange={(e) => set("business_name", e.target.value)} /></Field>
          <Field label="Website"><Input value={(p.website_url as string) ?? ""} onChange={(e) => set("website_url", e.target.value)} /></Field>
          <Field label="Industry"><Input value={(p.industry as string) ?? ""} onChange={(e) => set("industry", e.target.value)} /></Field>
          <Field label="Location"><Input value={(p.location as string) ?? ""} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="Services" className="md:col-span-2"><Textarea value={(p.services as string) ?? ""} onChange={(e) => set("services", e.target.value)} /></Field>
          <Field label="Unique selling points" className="md:col-span-2"><Textarea value={(p.usps as string) ?? ""} onChange={(e) => set("usps", e.target.value)} /></Field>
          <Field label="Current offers" className="md:col-span-2"><Textarea value={(p.offers as string) ?? ""} onChange={(e) => set("offers", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audience & brand voice</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Target audience" className="md:col-span-2"><Textarea value={(p.target_audience as string) ?? ""} onChange={(e) => set("target_audience", e.target.value)} /></Field>
          <Field label="Brand tone"><Input placeholder="e.g. Warm, expert, witty" value={(p.brand_tone as string) ?? ""} onChange={(e) => set("brand_tone", e.target.value)} /></Field>
          <Field label="Brand colors (comma-separated hex)">
            <Input
              value={((p.brand_colors as string[]) ?? []).join(", ")}
              onChange={(e) => set("brand_colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Competitors" className="md:col-span-2"><Textarea value={(p.competitors as string) ?? ""} onChange={(e) => set("competitors", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content & platforms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((pl) => (
                <label key={pl} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <Checkbox checked={((p.platforms as string[]) ?? []).includes(pl)} onCheckedChange={() => toggleArr("platforms", pl)} /> {pl}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Content types</Label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((ct) => (
                <label key={ct} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm capitalize">
                  <Checkbox checked={((p.content_types as string[]) ?? []).includes(ct)} onCheckedChange={() => toggleArr("content_types", ct)} /> {ct}
                </label>
              ))}
            </div>
          </div>
          <Field label="Posting frequency">
            <Input placeholder="e.g. 3 posts per week" value={(p.posting_frequency as string) ?? ""} onChange={(e) => set("posting_frequency", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO & PPC</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Target keywords (comma-separated)" className="md:col-span-2">
            <Input
              value={((p.target_keywords as string[]) ?? []).join(", ")}
              onChange={(e) => set("target_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="SEO competitors"><Input value={(p.seo_competitors as string) ?? ""} onChange={(e) => set("seo_competitors", e.target.value)} /></Field>
          <Field label="Target locations (comma-separated)">
            <Input
              value={((p.target_locations as string[]) ?? []).join(", ")}
              onChange={(e) => set("target_locations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Monthly PPC budget ($)">
            <Input type="number" value={(p.ppc_budget as number) ?? ""} onChange={(e) => set("ppc_budget", e.target.value === "" ? null : Number(e.target.value))} />
          </Field>
          <Field label="Conversion goal"><Input value={(p.conversion_goal as string) ?? ""} onChange={(e) => set("conversion_goal", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div>
              <div className="font-medium">Require my approval before anything publishes</div>
              <div className="text-sm text-muted-foreground">Applied to all AI-generated posts, ads, and campaigns.</div>
            </div>
            <Switch checked={Boolean(p.approval_required ?? true)} onCheckedChange={(v) => set("approval_required", v)} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <div>
              <div className="font-medium">I want human consultations available</div>
              <div className="text-sm text-muted-foreground">Used by Strategy and SEO/PPC consultants.</div>
            </div>
            <Switch checked={Boolean(p.human_consultation_requested)} onCheckedChange={(v) => set("human_consultation_requested", v)} />
          </div>
          <Field label="Default campaign creation method">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={(p.creation_mode as string) ?? "ai"}
              onChange={(e) => set("creation_mode", e.target.value)}
            >
              <option value="ai">AI-Generated</option>
              <option value="ai_human">AI + Human Review</option>
              <option value="human">Human-Assisted</option>
            </select>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}
