import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Megaphone,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  UserCog,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  saveSeoPpcIntake,
  researchSeoPpcBestPractices,
  executeSeoPpcStrategy,
  requestSeoPpcSpecialist,
} from "@/lib/seo-ppc-consultant.functions";

export const Route = createFileRoute("/_authenticated/ai-seo-ppc-consultant")({
  component: SeoPpcConsultant,
  head: () => ({
    meta: [
      { title: "AI SEO/PPC Consultant | Agency OS" },
      {
        name: "description",
        content:
          "Build approved SEO, PPC, and SEM strategies with AI-driven best-practice research and one-click execution.",
      },
    ],
  }),
});

type Module = "seo" | "ppc";
type Step = 0 | 1 | 2 | 3;

const PPC_PLATFORMS = [
  { id: "google_ads", label: "Google Ads" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "youtube_ads", label: "YouTube Ads" },
  { id: "tiktok_ads", label: "TikTok Ads" },
] as const;

function SeoPpcConsultant() {
  const [module, setModule] = useState<Module>("seo");
  const [step, setStep] = useState<Step>(0);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, unknown> | null>(null);
  const [requireApproval, setRequireApproval] = useState(true);
  const [customizeMode, setCustomizeMode] = useState(false);

  // SEO state
  const [seoForm, setSeoForm] = useState({
    businessName: "",
    websiteUrl: "",
    location: "",
    services: "",
    targetCustomer: "",
    targetKeywords: "",
    competitors: "",
    monthlyBudget: 1000,
    primaryGoal: "leads",
    seoScope: "local" as "local" | "national" | "ecommerce",
  });

  // PPC state
  const [ppcForm, setPpcForm] = useState({
    businessName: "",
    websiteUrl: "",
    location: "",
    services: "",
    monthlyBudget: 1500,
    idealCostPerLead: 50,
    platforms: ["google_ads"] as string[],
    existingLandingPages: "",
    conversionGoal: "forms" as "calls" | "forms" | "purchases" | "bookings",
    offers: "",
    primaryGoal: "leads",
  });

  const saveIntake = useServerFn(saveSeoPpcIntake);
  const research = useServerFn(researchSeoPpcBestPractices);
  const execute = useServerFn(executeSeoPpcStrategy);
  const requestSpecialist = useServerFn(requestSeoPpcSpecialist);

  const intakeMut = useMutation({
    mutationFn: async () => {
      const payload =
        module === "seo"
          ? { module: "seo" as const, ...seoForm }
          : { module: "ppc" as const, ...ppcForm, platforms: ppcForm.platforms as never };
      return saveIntake({ data: payload });
    },
    onSuccess: async ({ id }) => {
      setConsultationId(id);
      setStep(1);
      researchMut.mutate(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const researchMut = useMutation({
    mutationFn: (id: string) => research({ data: { consultationId: id } }),
    onSuccess: ({ recommendations }) => {
      setRecommendations(recommendations as Record<string, unknown>);
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const executeMut = useMutation({
    mutationFn: () =>
      execute({
        data: {
          consultationId: consultationId!,
          mode: customizeMode ? "customized" : "best_practices",
          requireApproval,
        },
      }),
    onSuccess: ({ campaignId, tasksCreated }) => {
      toast.success(`Strategy executed — ${tasksCreated} tasks queued.`);
      setStep(3);
      void campaignId;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const specialistMut = useMutation({
    mutationFn: (type: "free" | "paid") =>
      requestSpecialist({ data: { consultationId: consultationId!, type, notes: "" } }),
    onSuccess: () => toast.success("Specialist request submitted."),
    onError: (e: Error) => toast.error(e.message),
  });

  const progress = (step / 3) * 100;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-6 text-primary" />
            AI SEO/PPC Consultant
          </h1>
          <p className="text-sm text-muted-foreground">
            Research best practices, build the strategy, and execute — across SEO, PPC, and SEM.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <ShieldAlert className="size-3" /> Guidance only — no guarantees
        </Badge>
      </div>

      <Progress value={progress} />

      {step === 0 && (
        <Card className="p-6">
          <Tabs value={module} onValueChange={(v) => setModule(v as Module)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="seo" className="gap-2">
                <Search className="size-4" /> SEO Strategy
              </TabsTrigger>
              <TabsTrigger value="ppc" className="gap-2">
                <Megaphone className="size-4" /> PPC Strategy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seo" className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business name">
                  <Input
                    value={seoForm.businessName}
                    onChange={(e) => setSeoForm({ ...seoForm, businessName: e.target.value })}
                  />
                </Field>
                <Field label="Website URL">
                  <Input
                    value={seoForm.websiteUrl}
                    onChange={(e) => setSeoForm({ ...seoForm, websiteUrl: e.target.value })}
                    placeholder="https://"
                  />
                </Field>
                <Field label="City / area served">
                  <Input
                    value={seoForm.location}
                    onChange={(e) => setSeoForm({ ...seoForm, location: e.target.value })}
                  />
                </Field>
                <Field label="Monthly SEO budget ($)">
                  <Input
                    type="number"
                    value={seoForm.monthlyBudget}
                    onChange={(e) =>
                      setSeoForm({ ...seoForm, monthlyBudget: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Services / products" className="md:col-span-2">
                  <Textarea
                    value={seoForm.services}
                    onChange={(e) => setSeoForm({ ...seoForm, services: e.target.value })}
                  />
                </Field>
                <Field label="Target customer" className="md:col-span-2">
                  <Textarea
                    value={seoForm.targetCustomer}
                    onChange={(e) =>
                      setSeoForm({ ...seoForm, targetCustomer: e.target.value })
                    }
                  />
                </Field>
                <Field label="Keywords you want to rank for" className="md:col-span-2">
                  <Textarea
                    value={seoForm.targetKeywords}
                    onChange={(e) =>
                      setSeoForm({ ...seoForm, targetKeywords: e.target.value })
                    }
                    placeholder="comma separated"
                  />
                </Field>
                <Field label="Competitors" className="md:col-span-2">
                  <Textarea
                    value={seoForm.competitors}
                    onChange={(e) => setSeoForm({ ...seoForm, competitors: e.target.value })}
                  />
                </Field>
                <Field label="Primary goal">
                  <Select
                    value={seoForm.primaryGoal}
                    onValueChange={(v) => setSeoForm({ ...seoForm, primaryGoal: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["traffic", "leads", "calls", "bookings", "sales", "local visibility"].map(
                        (g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Scope">
                  <Select
                    value={seoForm.seoScope}
                    onValueChange={(v) =>
                      setSeoForm({ ...seoForm, seoScope: v as "local" | "national" | "ecommerce" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local SEO</SelectItem>
                      <SelectItem value="national">National SEO</SelectItem>
                      <SelectItem value="ecommerce">E-commerce SEO</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="ppc" className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business name">
                  <Input
                    value={ppcForm.businessName}
                    onChange={(e) => setPpcForm({ ...ppcForm, businessName: e.target.value })}
                  />
                </Field>
                <Field label="Website URL">
                  <Input
                    value={ppcForm.websiteUrl}
                    onChange={(e) => setPpcForm({ ...ppcForm, websiteUrl: e.target.value })}
                  />
                </Field>
                <Field label="What are you advertising?" className="md:col-span-2">
                  <Textarea
                    value={ppcForm.services}
                    onChange={(e) => setPpcForm({ ...ppcForm, services: e.target.value })}
                  />
                </Field>
                <Field label="Target location">
                  <Input
                    value={ppcForm.location}
                    onChange={(e) => setPpcForm({ ...ppcForm, location: e.target.value })}
                  />
                </Field>
                <Field label="Monthly ad budget ($)">
                  <Input
                    type="number"
                    value={ppcForm.monthlyBudget}
                    onChange={(e) =>
                      setPpcForm({ ...ppcForm, monthlyBudget: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Ideal cost per lead ($)">
                  <Input
                    type="number"
                    value={ppcForm.idealCostPerLead}
                    onChange={(e) =>
                      setPpcForm({ ...ppcForm, idealCostPerLead: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Conversion goal">
                  <Select
                    value={ppcForm.conversionGoal}
                    onValueChange={(v) =>
                      setPpcForm({
                        ...ppcForm,
                        conversionGoal: v as typeof ppcForm.conversionGoal,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calls">Calls</SelectItem>
                      <SelectItem value="forms">Form submissions</SelectItem>
                      <SelectItem value="purchases">Purchases</SelectItem>
                      <SelectItem value="bookings">Bookings</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Platforms" className="md:col-span-2">
                  <div className="flex flex-wrap gap-3">
                    {PPC_PLATFORMS.map((p) => {
                      const checked = ppcForm.platforms.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setPpcForm({
                                ...ppcForm,
                                platforms: c
                                  ? [...ppcForm.platforms, p.id]
                                  : ppcForm.platforms.filter((x) => x !== p.id),
                              })
                            }
                          />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Existing landing pages" className="md:col-span-2">
                  <Textarea
                    value={ppcForm.existingLandingPages}
                    onChange={(e) =>
                      setPpcForm({ ...ppcForm, existingLandingPages: e.target.value })
                    }
                    placeholder="URLs or describe"
                  />
                </Field>
                <Field label="Offers / promotions" className="md:col-span-2">
                  <Textarea
                    value={ppcForm.offers}
                    onChange={(e) => setPpcForm({ ...ppcForm, offers: e.target.value })}
                  />
                </Field>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => intakeMut.mutate()}
              disabled={intakeMut.isPending || researchMut.isPending}
            >
              {intakeMut.isPending || researchMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Research best practices <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="flex flex-col items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Researching current {module.toUpperCase()} best practices…
          </p>
        </Card>
      )}

      {step === 2 && recommendations && (
        <StrategySummary
          module={module}
          recommendations={recommendations}
          customizeMode={customizeMode}
          setCustomizeMode={setCustomizeMode}
          requireApproval={requireApproval}
          setRequireApproval={setRequireApproval}
          onBack={() => setStep(0)}
          onExecute={() => executeMut.mutate()}
          executing={executeMut.isPending}
          onRequestSpecialist={(t) => specialistMut.mutate(t)}
          specialistLoading={specialistMut.isPending}
        />
      )}

      {step === 3 && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold">Strategy executed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Campaign created. Tasks, content topics, and ad copy are queued in your workspace.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setStep(0); setRecommendations(null); }}>
              Start another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function StrategySummary({
  module,
  recommendations,
  customizeMode,
  setCustomizeMode,
  requireApproval,
  setRequireApproval,
  onBack,
  onExecute,
  executing,
  onRequestSpecialist,
  specialistLoading,
}: {
  module: Module;
  recommendations: Record<string, unknown>;
  customizeMode: boolean;
  setCustomizeMode: (v: boolean) => void;
  requireApproval: boolean;
  setRequireApproval: (v: boolean) => void;
  onBack: () => void;
  onExecute: () => void;
  executing: boolean;
  onRequestSpecialist: (type: "free" | "paid") => void;
  specialistLoading: boolean;
}) {
  const r = recommendations;
  const list = (k: string): string[] => {
    const v = r[k];
    return Array.isArray(v) ? (v as unknown[]).map((x) => String(x)) : [];
  };
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recommended {module.toUpperCase()} strategy</h2>
            <p className="text-sm text-muted-foreground">{str("summary")}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            Risk: {str("risk_level") || "n/a"} · {str("difficulty") || "n/a"}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-3">
          <Meta label="Timeline" value={str("timeline")} />
          <Meta label="Testing period" value={str("testing_period")} />
          <Meta label="Why this strategy" value={str("why_chosen")} />
        </div>

        {str("sources_summary") && (
          <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <strong>Sources:</strong> {str("sources_summary")}
          </p>
        )}
      </Card>

      {module === "seo" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ListCard title="Primary keywords" items={(r.keyword_strategy as { primary?: string[] } | undefined)?.primary ?? []} />
          <ListCard title="Long-tail keywords" items={(r.keyword_strategy as { long_tail?: string[] } | undefined)?.long_tail ?? []} />
          <ListCard title="On-page improvements" items={list("on_page")} />
          <ListCard title="Technical SEO" items={list("technical_seo")} />
          <ListCard title="Content topics" items={list("content_topics")} />
          <ListCard title="Backlink strategy" items={list("backlink_strategy")} />
          <ListCard title="Competitor gaps" items={list("competitor_gaps")} />
          <ListCard title="GBP recommendations" items={list("gbp_recommendations")} />
          <ListCard
            title="30 / 60 / 90 day plan"
            items={[
              ...((r.action_plan as Record<string, string[]> | undefined)?.["30_day"] ?? []).map((t) => `30d: ${t}`),
              ...((r.action_plan as Record<string, string[]> | undefined)?.["60_day"] ?? []).map((t) => `60d: ${t}`),
              ...((r.action_plan as Record<string, string[]> | undefined)?.["90_day"] ?? []).map((t) => `90d: ${t}`),
            ]}
            className="md:col-span-2"
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Keyword groups</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Group</th>
                    <th className="py-2">Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {((r.keyword_groups as { name: string; keywords: string[] }[] | undefined) ?? []).map((g, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{g.name}</td>
                      <td className="py-2 text-muted-foreground">{(g.keywords ?? []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <ListCard title="Negative keywords" items={list("negative_keywords")} />
          <ListCard title="Landing page recommendations" items={list("landing_page_recommendations")} />
          <ListCard title="A/B testing plan" items={list("ab_testing_plan")} />
          <ListCard title="Conversion tracking" items={list("conversion_tracking_checklist")} />
          <Card className="p-4 md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Budget allocation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Channel</th>
                    <th className="py-2">%</th>
                    <th className="py-2">$</th>
                  </tr>
                </thead>
                <tbody>
                  {((r.budget_allocation as { channel: string; percent: number; amount: number }[] | undefined) ?? []).map(
                    (b, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{b.channel}</td>
                        <td className="py-2">{b.percent}%</td>
                        <td className="py-2">${b.amount}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="p-4 md:col-span-2">
            <h3 className="mb-2 text-sm font-semibold">Ad copy ideas</h3>
            <div className="space-y-2">
              {((r.ad_copy_ideas as { headline: string; description: string }[] | undefined) ?? []).map((a, i) => (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{a.headline}</div>
                  <div className="text-muted-foreground">{a.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {list("caveats").length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm dark:bg-amber-950/20">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <ShieldAlert className="size-4" /> Caveats
          </div>
          <ul className="ml-5 list-disc text-muted-foreground">
            {list("caveats").map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-3 text-sm font-semibold">Continue, customize, or get help</h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={customizeMode}
              onCheckedChange={(c) => setCustomizeMode(Boolean(c))}
            />
            Customize strategy before launch
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={requireApproval}
              onCheckedChange={(c) => setRequireApproval(Boolean(c))}
            />
            Require human approval before launch
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" /> Back
          </Button>
          <Button onClick={onExecute} disabled={executing}>
            {executing ? <Loader2 className="size-4 animate-spin" /> : (
              <>Continue with best practices <ArrowRight className="ml-2 size-4" /></>
            )}
          </Button>
        </div>
      </Card>

      <Card className="border-primary/40 p-6">
        <div className="flex items-start gap-3">
          <UserCog className="mt-1 size-5 text-primary" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Request a human SEO/PPC specialist</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each client gets one free 1-hour specialist consultation. Future consultations require a paid booking.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="default"
                onClick={() => onRequestSpecialist("free")}
                disabled={specialistLoading}
              >
                Request free one-time consultation
              </Button>
              <Button
                variant="outline"
                onClick={() => onRequestSpecialist("paid")}
                disabled={specialistLoading}
              >
                Book paid consultation
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}

function ListCard({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <Card className={`p-4 ${className ?? ""}`}>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          {items.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      )}
    </Card>
  );
}
