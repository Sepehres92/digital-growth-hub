import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProfileAutofillBanner } from "@/components/ProfileAutofillBanner";

import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createCampaignWithFolder } from "@/lib/create-campaign-with-folder.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  UserCheck,
  Users,
  Megaphone,
  Search,
  Target,
  Layers,
  Globe,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/campaign-wizard")({
  component: CampaignWizardPage,
});

type CampaignKind = "social_media" | "seo" | "ppc" | "seo_ppc" | "full";
type SourceType = "ai" | "human" | "ai_human_review";

const KIND_META: Record<CampaignKind, { label: string; icon: typeof Megaphone; desc: string }> = {
  social_media: { label: "Social Media", icon: Megaphone, desc: "Captions, posts, calendar" },
  seo: { label: "SEO", icon: Search, desc: "Keywords, content, on-page" },
  ppc: { label: "PPC", icon: Target, desc: "Ads, budget, landing pages" },
  seo_ppc: { label: "SEO + PPC", icon: Layers, desc: "Search + paid combined" },
  full: { label: "Full Digital Marketing", icon: Globe, desc: "Everything end-to-end" },
};

const SOURCE_META: Record<SourceType, { label: string; icon: typeof Sparkles; desc: string }> = {
  ai: { label: "AI-Generated", icon: Sparkles, desc: "Fast. AI produces the full plan." },
  human: { label: "Human-Assisted", icon: UserCheck, desc: "A specialist builds it with you." },
  ai_human_review: { label: "AI + Human Review", icon: Users, desc: "AI drafts, a human reviews." },
};

const PLATFORMS = ["instagram", "facebook", "x", "tiktok", "youtube", "linkedin"];

function CampaignWizardPage() {
  const navigate = useNavigate();
  const createFromWizard = useServerFn(createCampaignFromWizard);

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState<string>("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CampaignKind | "">("");
  const [source, setSource] = useState<SourceType | "">("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [tone, setTone] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["wizard-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, business_name")
        .order("business_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const needsKeywords = kind === "seo" || kind === "ppc" || kind === "seo_ppc" || kind === "full";
  const needsPlatforms = kind === "social_media" || kind === "full";
  const needsBudget = kind === "ppc" || kind === "seo_ppc" || kind === "full";

  const strategyPreview = useMemo(() => {
    if (!kind || !source) return "";
    const parts: string[] = [];
    parts.push(`📋 ${name || "Untitled campaign"}`);
    parts.push(`Type: ${KIND_META[kind].label}`);
    parts.push(`Method: ${SOURCE_META[source].label}`);
    if (goal) parts.push(`\nGoal:\n${goal}`);
    if (audience) parts.push(`\nAudience:\n${audience}`);
    if (tone) parts.push(`Tone: ${tone}`);
    if (needsBudget && budget) parts.push(`Monthly budget: $${budget}`);
    if (needsPlatforms && platforms.length) parts.push(`Platforms: ${platforms.join(", ")}`);
    if (needsKeywords && keywords) parts.push(`\nKeywords / focus:\n${keywords}`);
    if (customNotes) parts.push(`\nCustomization:\n${customNotes}`);
    return parts.join("\n");
  }, [name, kind, source, goal, audience, tone, budget, platforms, keywords, customNotes, needsBudget, needsPlatforms, needsKeywords]);

  const create = useMutation({
    mutationFn: () =>
      createFromWizard({
        data: {
          clientId: clientId || null,
          name: name.trim(),
          campaignKind: kind as CampaignKind,
          sourceType: source as SourceType,
          goal: goal || undefined,
          targetAudience: audience || undefined,
          monthlyBudget: budget ? Number(budget) : undefined,
          tone: tone || undefined,
          platforms: needsPlatforms ? platforms : undefined,
          keywords: needsKeywords ? keywords : undefined,
          strategySummary: strategyPreview,
        },
      }),
    onSuccess: () => {
      toast.success("Campaign folder created with all assets connected.");
      navigate({ to: "/campaign-folders" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canNext = (() => {
    switch (step) {
      case 1: return Boolean(clientId);
      case 2: return Boolean(kind) && name.trim().length > 0;
      case 3: return Boolean(source);
      case 4: return Boolean(goal.trim());
      case 5: return true;
      default: return true;
    }
  })();

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <ProfileAutofillBanner toolName="Campaign Wizard" highlight={["business_name", "industry", "target_audience", "main_goal", "creation_mode", "approval_required"]} />
      <div>

        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">Step {step} of 6</p>
        <div className="flex gap-1 mt-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Step 1 — Select client"}
            {step === 2 && "Step 2 — Campaign type"}
            {step === 3 && "Step 3 — How should it be created?"}
            {step === 4 && "Step 4 — Consultation questions"}
            {step === 5 && "Step 5 — Review strategy"}
            {step === 6 && "Step 6 — Approve, customize, or request help"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Pick a client" /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clients?.length && (
                <p className="text-sm text-muted-foreground">No clients yet — add one from the Clients page first.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Campaign name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 Holiday Push" />
              </div>
              <div className="space-y-2">
                <Label>Campaign type</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(KIND_META) as CampaignKind[]).map((k) => {
                    const M = KIND_META[k];
                    const Icon = M.icon;
                    const active = kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={`text-left p-4 rounded-lg border-2 transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4" />{M.label}</div>
                        <p className="text-xs text-muted-foreground mt-1">{M.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="grid gap-3">
              {(Object.keys(SOURCE_META) as SourceType[]).map((s) => {
                const M = SOURCE_META[s];
                const Icon = M.icon;
                const active = source === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`text-left p-4 rounded-lg border-2 transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4" />{M.label}</div>
                    <p className="text-sm text-muted-foreground mt-1">{M.desc}</p>
                    {s === "human" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Your first human consultation is limited to 1 hour and available one time only. Future human consultations require paid booking.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>What is the main business goal?</Label>
                <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Drive 100 qualified leads / month" />
              </div>
              <div className="space-y-2">
                <Label>Target audience</Label>
                <Textarea value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who are we talking to?" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. friendly, expert" />
                </div>
                {needsBudget && (
                  <div className="space-y-2">
                    <Label>Monthly budget ($)</Label>
                    <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              {needsPlatforms && (
                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                        <Checkbox
                          checked={platforms.includes(p)}
                          onCheckedChange={(v) => {
                            setPlatforms((cur) => v ? [...cur, p] : cur.filter((x) => x !== p));
                          }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {needsKeywords && (
                <div className="space-y-2">
                  <Label>Keywords / focus areas</Label>
                  <Textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Comma-separated keywords or topics" />
                </div>
              )}
            </>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {kind && <Badge variant="secondary">{KIND_META[kind].label}</Badge>}
                {source && <Badge variant="outline">{SOURCE_META[source].label}</Badge>}
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{strategyPreview}</pre>
              <p className="text-xs text-muted-foreground">
                This is your draft strategy. You can customize or request human help in the next step.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customization notes (optional)</Label>
                <Textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Anything to tweak before we save?"
                />
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border space-y-1 text-sm">
                <p className="font-medium flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> When you approve, we will:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Create a campaign + Campaign Folder</li>
                  <li>Save the strategy inside the folder</li>
                  <li>Auto-link any future tasks, content, images, videos, and meetings</li>
                  {(source === "human" || source === "ai_human_review") && (
                    <li>Create a human strategist request</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || create.isPending}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < 6 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => create.mutate()} disabled={create.isPending || !canNext}>
            {create.isPending ? "Creating…" : "Approve & Create Folder"}
          </Button>
        )}
      </div>
    </div>
  );
}
