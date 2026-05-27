import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserCog,
  Wand2,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  saveConsultationIntake,
  researchBestPractices,
  executeStrategy,
  requestHumanStrategist,
  getFreeConsultationStatus,
  type Recommendations,
} from "@/lib/strategy-consultant.functions";

export const Route = createFileRoute("/_authenticated/ai-strategy-consultant")({
  component: StrategyConsultant,
  head: () => ({
    meta: [
      { title: "AI Strategy Consultant | Agency OS" },
      {
        name: "description",
        content:
          "Consult clients, research current best practices, and generate an approved 30-day content strategy.",
      },
    ],
  }),
});

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X / Twitter" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

const GOALS = [
  { id: "leads", label: "Leads" },
  { id: "sales", label: "Sales" },
  { id: "awareness", label: "Awareness" },
  { id: "engagement", label: "Engagement" },
  { id: "bookings", label: "Bookings" },
  { id: "followers", label: "Followers" },
] as const;

const TONES = ["Professional", "Funny", "Luxury", "Friendly", "Bold", "Educational"];

function StrategyConsultant() {
  const [step, setStep] = useState<Step>(0);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendations | null>(null);

  // Intake state
  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    services: "",
    audience: "",
    location: "",
    goal: "leads" as (typeof GOALS)[number]["id"],
    platforms: ["instagram"] as string[],
    postingFrequency: "5/week",
    brandAssets: "",
    tone: "Professional",
    customizeMode: false,
  });

  // Customize state
  const [custom, setCustom] = useState({
    postingFrequency: "",
    platforms: [] as string[],
    contentTypes: [] as string[],
    tone: "",
    monthlyGoal: "",
    offer: "",
    campaignFocus: "",
    requireApproval: true,
  });

  // Human strategist
  const [humanNotes, setHumanNotes] = useState("");
  const [humanTime, setHumanTime] = useState("");

  const saveFn = useServerFn(saveConsultationIntake);
  const researchFn = useServerFn(researchBestPractices);
  const executeFn = useServerFn(executeStrategy);
  const humanFn = useServerFn(requestHumanStrategist);
  const statusFn = useServerFn(getFreeConsultationStatus);

  const freeStatus = useQuery({
    queryKey: ["free-consult-status"],
    queryFn: () => statusFn(),
  });

  const saveMut = useMutation({
    mutationFn: async () => saveFn({ data: form }),
    onSuccess: async ({ id }) => {
      setConsultationId(id);
      setStep(1);
      researchMut.mutate(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const researchMut = useMutation({
    mutationFn: async (id: string) => researchFn({ data: { consultationId: id } }),
    onSuccess: ({ recommendations }) => {
      setRecs(recommendations);
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const executeMut = useMutation({
    mutationFn: async (mode: "best_practices" | "customized") =>
      executeFn({
        data: {
          consultationId: consultationId!,
          mode,
          customizations: mode === "customized" ? custom : undefined,
        },
      }),
    onSuccess: ({ postsCreated }) => {
      toast.success(`Strategy executed — ${postsCreated} posts created in approval queue.`);
      setStep(5);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const humanMut = useMutation({
    mutationFn: async (type: "free" | "paid") =>
      humanFn({
        data: {
          consultationId: consultationId!,
          type,
          notes: humanNotes,
          preferredTime: humanTime,
        },
      }),
    onSuccess: () => {
      toast.success("Request submitted — the team has been notified.");
      freeStatus.refetch();
      setStep(5);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePlatform = (id: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
  };

  const toggleCustomPlatform = (id: string) => {
    setCustom((c) => ({
      ...c,
      platforms: c.platforms.includes(id)
        ? c.platforms.filter((p) => p !== id)
        : [...c.platforms, id],
    }));
  };

  const progress = (step / 5) * 100;
  const canSubmit =
    form.businessName.trim() &&
    form.industry.trim() &&
    form.services.trim() &&
    form.audience.trim() &&
    form.platforms.length > 0;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Strategy Consultant</h1>
            <p className="text-sm text-muted-foreground">
              Consult, research best practices, approve, and auto-generate a 30-day content plan.
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {["Consultation", "Research", "Recommendations", "Customize", "Approve", "Done"].map(
            (label, i) => (
              <span
                key={label}
                className={
                  i === step
                    ? "rounded-full bg-primary px-3 py-1 text-primary-foreground"
                    : i < step
                      ? "rounded-full bg-muted px-3 py-1"
                      : "rounded-full border border-border px-3 py-1"
                }
              >
                {i + 1}. {label}
              </span>
            ),
          )}
        </div>
      </header>

      {step === 0 && (
        <Card className="space-y-5 p-5">
          <h2 className="text-lg font-semibold">Tell us about your business</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name">
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Acme Co."
              />
            </Field>
            <Field label="Industry">
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. dental clinic, e-commerce, SaaS"
              />
            </Field>
            <Field label="Services / products" className="md:col-span-2">
              <Textarea
                rows={2}
                value={form.services}
                onChange={(e) => setForm({ ...form, services: e.target.value })}
                placeholder="What do you sell?"
              />
            </Field>
            <Field label="Target audience">
              <Input
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="Who is this for?"
              />
            </Field>
            <Field label="City / area served">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. London, UK or Global"
              />
            </Field>
            <Field label="Main goal">
              <Select
                value={form.goal}
                onValueChange={(v) => setForm({ ...form, goal: v as typeof form.goal })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Posting frequency">
              <Input
                value={form.postingFrequency}
                onChange={(e) => setForm({ ...form, postingFrequency: e.target.value })}
                placeholder="e.g. 5/week"
              />
            </Field>
            <Field label="Platforms" className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={
                      form.platforms.includes(p.id)
                        ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                        : "rounded-full border border-border px-3 py-1 text-sm"
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tone of voice">
              <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Brand assets (notes)" className="md:col-span-2">
              <Textarea
                rows={2}
                value={form.brandAssets}
                onChange={(e) => setForm({ ...form, brandAssets: e.target.value })}
                placeholder="Brand colors, logo URL, current offers, hero images, anything to inform the strategy."
              />
            </Field>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Recommendations come from established best practices and may need testing for your
              market. The AI will not guarantee results. Always review content before publishing.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!canSubmit || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              Start consultation
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3 p-8 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />
          <h2 className="text-lg font-semibold">Researching current best practices…</h2>
          <p className="text-sm text-muted-foreground">
            Analyzing benchmarks for {form.industry || "your industry"} on{" "}
            {form.platforms.join(", ")} for {form.goal}.
          </p>
        </Card>
      )}

      {step === 2 && recs && (
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Recommended strategy</h2>
            </div>
            <p className="text-sm text-muted-foreground">{recs.summary}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <RecCard label="Posting frequency" value={recs.posting_frequency} />
              <RecCard label="Video / image ratio" value={recs.video_image_ratio} />
              <RecCard label="Hashtag strategy" value={recs.hashtag_strategy} />
              <RecCard label="CTA strategy" value={recs.cta_strategy} />
              {recs.local_seo_tips && (
                <RecCard label="Local SEO tips" value={recs.local_seo_tips} />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ListCard title="Content types" items={recs.content_types} />
              <ListCard title="Recommended platforms" items={recs.recommended_platforms} />
              <ListCard title="Content pillars" items={recs.content_pillars} />
            </div>

            {recs.best_posting_times && Object.keys(recs.best_posting_times).length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested posting times
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(recs.best_posting_times).map(([p, t]) => (
                    <Badge key={p} variant="secondary">{p}: {t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {recs.caveats?.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="size-3.5" /> Important caveats
                </div>
                <ul className="ml-5 list-disc space-y-1 text-xs text-muted-foreground">
                  {recs.caveats.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">How would you like to proceed?</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                onClick={() => executeMut.mutate("best_practices")}
                disabled={executeMut.isPending}
                className="h-auto flex-col items-start gap-1 py-3 text-left"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-4" /> Continue with best practices
                </span>
                <span className="text-xs opacity-80">Auto-generate the 30-day plan.</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="h-auto flex-col items-start gap-1 py-3 text-left"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Wand2 className="size-4" /> Customize strategy
                </span>
                <span className="text-xs opacity-80">Tweak platforms, frequency, offers.</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStep(4)}
                className="h-auto flex-col items-start gap-1 py-3 text-left"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <UserCog className="size-4" /> Request human strategist
                </span>
                <span className="text-xs opacity-80">
                  {freeStatus.data?.freeUsed ? "Paid only" : "1 free hour available"}
                </span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Customize your strategy</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Posting frequency">
              <Input
                value={custom.postingFrequency}
                onChange={(e) => setCustom({ ...custom, postingFrequency: e.target.value })}
                placeholder={recs?.posting_frequency || "e.g. 5/week"}
              />
            </Field>
            <Field label="Tone">
              <Select value={custom.tone} onValueChange={(v) => setCustom({ ...custom, tone: v })}>
                <SelectTrigger><SelectValue placeholder="Same as intake" /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Platforms" className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleCustomPlatform(p.id)}
                    className={
                      custom.platforms.includes(p.id)
                        ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                        : "rounded-full border border-border px-3 py-1 text-sm"
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Monthly goal">
              <Input
                value={custom.monthlyGoal}
                onChange={(e) => setCustom({ ...custom, monthlyGoal: e.target.value })}
                placeholder="e.g. 50 booked calls"
              />
            </Field>
            <Field label="Offer / promotion">
              <Input
                value={custom.offer}
                onChange={(e) => setCustom({ ...custom, offer: e.target.value })}
                placeholder="e.g. 20% off first session"
              />
            </Field>
            <Field label="Campaign focus" className="md:col-span-2">
              <Textarea
                rows={2}
                value={custom.campaignFocus}
                onChange={(e) => setCustom({ ...custom, campaignFocus: e.target.value })}
                placeholder="What should this 30-day push prioritise?"
              />
            </Field>
            <Field label="Content types (comma-separated)" className="md:col-span-2">
              <Input
                value={custom.contentTypes.join(", ")}
                onChange={(e) =>
                  setCustom({
                    ...custom,
                    contentTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g. Reels, Carousels, Testimonials, Educational"
              />
            </Field>
            <label className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                checked={custom.requireApproval}
                onCheckedChange={(v) => setCustom({ ...custom, requireApproval: !!v })}
              />
              <span className="text-sm">Require client approval before publishing</span>
            </label>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <Button
              disabled={executeMut.isPending}
              onClick={() => executeMut.mutate("customized")}
            >
              {executeMut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Approve & generate plan
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <UserCog className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Request a human strategist</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            You can request a one-time human consultation with a real strategist. This consultation
            is limited to <strong>1 hour</strong> and is available <strong>one time only</strong>.
            Future consultations will require a paid booking.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Notes for the strategist" className="md:col-span-2">
              <Textarea
                rows={3}
                value={humanNotes}
                onChange={(e) => setHumanNotes(e.target.value)}
                placeholder="What do you want to discuss?"
              />
            </Field>
            <Field label="Preferred time">
              <Input
                value={humanTime}
                onChange={(e) => setHumanTime(e.target.value)}
                placeholder="e.g. weekday afternoons GMT"
              />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Button
              disabled={!!freeStatus.data?.freeUsed || humanMut.isPending}
              onClick={() => humanMut.mutate("free")}
            >
              {humanMut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Request free one-time consultation
            </Button>
            <Button variant="outline" disabled={humanMut.isPending} onClick={() => humanMut.mutate("paid")}>
              <Calendar className="mr-2 size-4" /> Book paid consultation (placeholder)
            </Button>
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 size-4" /> Continue with AI only
            </Button>
          </div>
          {freeStatus.data?.freeUsed && (
            <p className="text-xs text-muted-foreground">
              Your free consultation has already been used. Please use a paid booking.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Paid bookings: price and calendar are placeholders. Payment integration is Stripe-ready
            but not yet active.
          </p>
        </Card>
      )}

      {step === 5 && (
        <Card className="space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h2 className="text-xl font-semibold">All set</h2>
          <p className="text-sm text-muted-foreground">
            Your strategy is saved. Posts are in the approval queue, and any human requests have
            been routed to the team.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/content-calendar">View content calendar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/campaigns">Open campaigns</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/tasks">View tasks</Link>
            </Button>
          </div>
          <Button
            variant="link"
            onClick={() => {
              setStep(0);
              setConsultationId(null);
              setRecs(null);
            }}
          >
            Start a new consultation
          </Button>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-1 text-sm">
        {items?.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
