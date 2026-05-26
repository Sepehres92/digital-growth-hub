import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateCopy } from "@/lib/ai-writer.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, Save, Trash2, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-writer")({
  component: AIWriterPage,
});

const CONTENT_TYPES = [
  { value: "facebook_ad", label: "Facebook Ad" },
  { value: "google_ad", label: "Google Ad" },
  { value: "instagram_caption", label: "Instagram Caption" },
  { value: "seo_blog_outline", label: "SEO Blog Outline" },
  { value: "email_marketing", label: "Email Marketing" },
  { value: "landing_page", label: "Landing Page Copy" },
  { value: "cta_button", label: "CTA Buttons" },
  { value: "hashtags", label: "Hashtags" },
];

const TONES = ["Professional", "Friendly", "Bold", "Playful", "Luxury", "Urgent", "Inspirational"];
const VARIATIONS = ["short", "long", "professional", "funny"] as const;

function AIWriterPage() {
  const qc = useQueryClient();
  const callGenerate = useServerFn(generateCopy);

  const [form, setForm] = useState({
    contentType: "facebook_ad",
    businessType: "",
    audience: "",
    offer: "",
    tone: "Professional",
    platform: "",
    goal: "",
    keywords: "",
  });
  const [result, setResult] = useState<Record<string, string> | null>(null);

  const gen = useMutation({
    mutationFn: () => callGenerate({ data: form }),
    onSuccess: (d) => {
      setResult(d.variations);
      toast.success("Copy generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saved = useQuery({
    queryKey: ["ai_copies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_copies")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const saveCopy = async (variation: string, output: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not signed in");
    const { error } = await supabase.from("ai_copies").insert({
      user_id: u.user.id,
      content_type: form.contentType,
      variation,
      prompt_inputs: form,
      output,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to project");
    qc.invalidateQueries({ queryKey: ["ai_copies"] });
  };

  const deleteCopy = async (id: string) => {
    const { error } = await supabase.from("ai_copies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ai_copies"] });
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Writer</h1>
          <p className="text-sm text-muted-foreground">Generate high-converting marketing copy in seconds.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Content type</Label>
              <Select value={form.contentType} onValueChange={(v) => set("contentType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Input value={form.businessType} onChange={(e) => set("businessType", e.target.value)} placeholder="SaaS, e-com…" />
              </div>
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target audience</Label>
              <Input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Founders, parents…" />
            </div>
            <div className="space-y-1.5">
              <Label>Offer</Label>
              <Textarea rows={2} value={form.offer} onChange={(e) => set("offer", e.target.value)} placeholder="What are you selling?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Input value={form.platform} onChange={(e) => set("platform", e.target.value)} placeholder="Facebook, IG…" />
              </div>
              <div className="space-y-1.5">
                <Label>Goal</Label>
                <Input value={form.goal} onChange={(e) => set("goal", e.target.value)} placeholder="Signups, sales…" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Keywords</Label>
              <Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="Comma separated" />
            </div>
            <Button className="w-full" disabled={gen.isPending} onClick={() => gen.mutate()}>
              {gen.isPending ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><Wand2 className="size-4" /> Generate copy</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variations</CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !gen.isPending && (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  Fill in the brief and click Generate.
                </div>
              )}
              {gen.isPending && (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
              {result && (
                <Tabs defaultValue="short">
                  <TabsList className="grid w-full grid-cols-4">
                    {VARIATIONS.map((v) => <TabsTrigger key={v} value={v} className="capitalize">{v}</TabsTrigger>)}
                  </TabsList>
                  {VARIATIONS.map((v) => (
                    <TabsContent key={v} value={v} className="mt-4">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{result[v] || "(empty)"}</pre>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyText(result[v] || "")}>
                          <Copy className="size-4" /> Copy
                        </Button>
                        <Button size="sm" onClick={() => saveCopy(v, result[v] || "")}>
                          <Save className="size-4" /> Save to project
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved copy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {saved.data && saved.data.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
              )}
              {saved.data?.map((row) => (
                <div key={row.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {row.content_type} · <span className="capitalize">{row.variation}</span> · {new Date(row.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => copyText(row.output)}><Copy className="size-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteCopy(row.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  <pre className="mt-2 line-clamp-3 whitespace-pre-wrap break-words font-sans text-sm">{row.output}</pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
