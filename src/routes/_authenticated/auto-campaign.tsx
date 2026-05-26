import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  generateAutoCampaign,
  type AutoCampaignPost,
} from "@/lib/calendar-ai.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Wand2, Calendar as CalIcon, Hash, Image as ImageIcon, Video, MousePointerClick } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/auto-campaign")({
  component: AutoCampaignPage,
});

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "bg-pink-500" },
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
  { id: "x", label: "X (Twitter)", color: "bg-zinc-800" },
  { id: "tiktok", label: "TikTok", color: "bg-fuchsia-600" },
  { id: "youtube", label: "YouTube", color: "bg-red-600" },
] as const;

type Draft = AutoCampaignPost & { approved: boolean };

function AutoCampaignPage() {
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [offer, setOffer] = useState("");
  const [budget, setBudget] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook"]);

  const [strategy, setStrategy] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const generateFn = useServerFn(generateAutoCampaign);

  const genMut = useMutation({
    mutationFn: async () => {
      return generateFn({
        data: {
          businessType, goal, offer, budget, tone, audience,
          postsPerWeek,
          platforms: platforms as ("instagram" | "facebook" | "x" | "tiktok" | "youtube")[],
        },
      });
    },
    onSuccess: (res) => {
      setStrategy(res.strategy);
      setDrafts(res.posts.map((p) => ({ ...p, approved: true })));
      toast.success(`Generated ${res.posts.length} posts. Review and approve.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const rows = drafts.filter((d) => d.approved).map((d) => {
        const dt = new Date(`${d.date}T00:00:00`);
        dt.setHours(d.hour, 0, 0, 0);
        return {
          user_id: u.user.id,
          platform: d.platform,
          caption: d.caption,
          hashtags: d.hashtags,
          title: d.category,
          status: "approved",
          ai_generated: true,
          scheduled_for: dt.toISOString(),
          media_urls: {
            image_prompt: d.image_prompt,
            video_idea: d.video_idea,
            cta: d.cta,
          } as never,
        };
      });
      if (!rows.length) throw new Error("Approve at least one post");
      const { error } = await supabase.from("content_posts").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => toast.success(`Saved ${n} approved posts to Content Calendar`),
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePlatform = (id: string) => {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const approvedCount = drafts.filter((d) => d.approved).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Wand2 className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Auto Campaign</h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your business — get a complete 30-day campaign in one click.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Business type</Label>
            <Input placeholder="e.g. Boutique fitness studio" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Input placeholder="e.g. Drive 200 new memberships" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Offer</Label>
            <Textarea placeholder="e.g. 14-day free trial + free intro class" rows={2} value={offer} onChange={(e) => setOffer(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Budget (optional)</Label>
            <Input placeholder="e.g. $2,000/month" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Professional", "Friendly", "Playful", "Bold", "Luxury", "Inspirational"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Target audience</Label>
            <Textarea placeholder="e.g. Women 25-40, urban, value wellness and community" rows={2} value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Posts per week</Label>
            <Input type="number" min={3} max={21} value={postsPerWeek} onChange={(e) => setPostsPerWeek(Number(e.target.value) || 5)} />
          </div>
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={genMut.isPending || !businessType || !goal || !offer || !audience || !platforms.length}
          onClick={() => genMut.mutate()}
        >
          {genMut.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Generate 30-day campaign
        </Button>
      </div>

      {strategy && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="size-4" /> Strategy overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{strategy}</CardContent>
        </Card>
      )}

      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-y border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
            <div className="text-sm">
              <span className="font-semibold">{approvedCount}</span> of {drafts.length} posts approved
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDrafts((d) => d.map((x) => ({ ...x, approved: true })))}>Approve all</Button>
              <Button variant="outline" size="sm" onClick={() => setDrafts((d) => d.map((x) => ({ ...x, approved: false })))}>Reject all</Button>
              <Button size="sm" disabled={saveMut.isPending || approvedCount === 0} onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                Publish to Calendar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drafts.map((d, idx) => (
              <Card key={idx} className={d.approved ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="capitalize">{d.platform}</Badge>
                        <Badge variant="outline">{d.category}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalIcon className="size-3" />
                        {d.date} · {String(d.hour).padStart(2, "0")}:00
                      </div>
                    </div>
                    <Checkbox
                      checked={d.approved}
                      onCheckedChange={(v) =>
                        setDrafts((prev) => prev.map((p, i) => (i === idx ? { ...p, approved: !!v } : p)))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Textarea
                    rows={4}
                    value={d.caption}
                    onChange={(e) => setDrafts((prev) => prev.map((p, i) => (i === idx ? { ...p, caption: e.target.value } : p)))}
                  />
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Hash className="mt-0.5 size-3 shrink-0" />
                    <span className="break-words">{d.hashtags}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <MousePointerClick className="mt-0.5 size-3 shrink-0 text-primary" />
                    <span className="font-medium">{d.cta}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs">
                    <ImageIcon className="mt-0.5 size-3 shrink-0" />
                    <span><span className="font-medium">Image:</span> {d.image_prompt}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs">
                    <Video className="mt-0.5 size-3 shrink-0" />
                    <span><span className="font-medium">Video:</span> {d.video_idea}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
