import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  generateVideoSnippet,
  generateVideoConcept,
  buildVideoFromMedia,
} from "@/lib/video-studio.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  Wand2,
  Upload,
  Film,
  Scissors,
  Music,
  Mic,
  Type as TypeIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Play,
  LayoutTemplate,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-video-studio")({
  component: AIVideoStudioPage,
});

type Client = { id: string; business_name: string };
type Campaign = { id: string; name: string };
type Project = {
  id: string;
  title: string;
  platform: string;
  type: string;
  status: string;
  output_json: any;
  created_at: string;
};

const PLATFORMS = [
  { value: "tiktok", label: "TikTok", format: "9:16" },
  { value: "instagram_reel", label: "Instagram Reel", format: "9:16" },
  { value: "youtube_short", label: "YouTube Short", format: "9:16" },
  { value: "facebook_reel", label: "Facebook Reel", format: "9:16" },
  { value: "youtube_long", label: "YouTube Long Form", format: "16:9" },
];

const STYLES = [
  "cinematic",
  "luxury ad",
  "construction company ad",
  "real estate",
  "product showcase",
  "educational",
  "funny",
  "testimonial",
];

const TEMPLATES = [
  { id: "construction_promo", label: "Construction company promo", platform: "tiktok", style: "construction company ad" },
  { id: "roofing_ad", label: "Roofing ad", platform: "facebook_reel", style: "construction company ad" },
  { id: "real_estate_listing", label: "Real estate listing", platform: "instagram_reel", style: "real estate" },
  { id: "before_after", label: "Before / after transformation", platform: "tiktok", style: "product showcase" },
  { id: "testimonial", label: "Testimonial video", platform: "instagram_reel", style: "testimonial" },
  { id: "service_explainer", label: "Service explainer", platform: "youtube_short", style: "educational" },
  { id: "social_announcement", label: "Social media announcement", platform: "instagram_reel", style: "luxury ad" },
  { id: "youtube_intro", label: "YouTube intro", platform: "youtube_long", style: "cinematic" },
  { id: "youtube_short", label: "YouTube Short", platform: "youtube_short", style: "educational" },
  { id: "tiktok_trend", label: "TikTok trend-style ad", platform: "tiktok", style: "funny" },
];

const AI_TOOLS: { kind: any; label: string; icon: any; needsTopic: string }[] = [
  { kind: "script", label: "Video script", icon: Film, needsTopic: "Video topic" },
  { kind: "hook", label: "Hook", icon: Sparkles, needsTopic: "Video topic" },
  { kind: "cta", label: "CTA", icon: Wand2, needsTopic: "Offer / goal" },
  { kind: "subtitles", label: "Subtitles (SRT)", icon: TypeIcon, needsTopic: "Paste script" },
  { kind: "voiceover_script", label: "Voiceover script", icon: Mic, needsTopic: "Video topic" },
  { kind: "thumbnail_prompt", label: "Thumbnail prompt", icon: ImageIcon, needsTopic: "Video topic" },
  { kind: "blog_to_video", label: "Blog → video", icon: Film, needsTopic: "Paste blog post" },
  { kind: "offer_to_ad", label: "Offer → ad", icon: Wand2, needsTopic: "Describe your offer" },
  { kind: "long_to_shorts", label: "Long video → shorts", icon: Scissors, needsTopic: "Paste transcript / summary" },
];

function AIVideoStudioPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientId, setClientId] = useState<string>("none");
  const [campaignId, setCampaignId] = useState<string>("none");

  const loadAll = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [c, ca, p] = await Promise.all([
      supabase.from("clients").select("id,business_name").order("business_name"),
      supabase.from("campaigns").select("id,name").order("name"),
      supabase
        .from("video_projects")
        .select("id,title,platform,type,status,output_json,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    setClients((c.data as any) || []);
    setCampaigns((ca.data as any) || []);
    setProjects((p.data as any) || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const brandClient = clients.find((c) => c.id === clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <VideoIcon className="size-6 text-primary" /> AI Video Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate scripts, storyboards, captions and finished video plans for every platform.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Client (brand kit)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No campaign</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {brandClient && (
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          Brand kit active: <span className="text-foreground font-medium">{brandClient.business_name}</span> — logo, colors, tone, audience and offer will be passed into every AI request.
        </div>
      )}

      <Tabs defaultValue="scratch" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="scratch">From Scratch</TabsTrigger>
          <TabsTrigger value="media">From Media</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tools">AI Tools</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        <TabsContent value="scratch">
          <FromScratch
            clientId={clientId === "none" ? null : clientId}
            campaignId={campaignId === "none" ? null : campaignId}
            onCreated={loadAll}
          />
        </TabsContent>

        <TabsContent value="media">
          <FromMedia
            clientId={clientId === "none" ? null : clientId}
            campaignId={campaignId === "none" ? null : campaignId}
            onCreated={loadAll}
          />
        </TabsContent>

        <TabsContent value="editor">
          <TimelineEditor projects={projects} onChanged={loadAll} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesGrid
            clientId={clientId === "none" ? null : clientId}
            campaignId={campaignId === "none" ? null : campaignId}
            onCreated={loadAll}
          />
        </TabsContent>

        <TabsContent value="tools">
          <AIToolsPanel clientId={clientId === "none" ? null : clientId} />
        </TabsContent>

        <TabsContent value="library">
          <ProjectLibrary projects={projects} onChanged={loadAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================== From Scratch =====================

function FromScratch({
  clientId,
  campaignId,
  onCreated,
}: {
  clientId: string | null;
  campaignId: string | null;
  onCreated: () => void;
}) {
  const generate = useServerFn(generateVideoConcept);
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [format, setFormat] = useState("9:16");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onGenerate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt");
    setLoading(true);
    try {
      const r = await generate({
        data: {
          prompt,
          platform: platform as any,
          format: format as any,
          style,
          duration,
          clientId,
          campaignId,
        },
      });
      setResult(r.concept);
      toast.success("Video concept generated and saved");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create video from scratch</CardTitle>
          <CardDescription>
            AI will generate a full concept: hook, script, scenes, captions and visual ideas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              rows={5}
              placeholder="e.g. 30-second ad for a roofing company offering free inspections this month"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => {
                setPlatform(v);
                const p = PLATFORMS.find((x) => x.value === v);
                if (p) setFormat(p.format);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (vertical)</SelectItem>
                  <SelectItem value="1:1">1:1 (square)</SelectItem>
                  <SelectItem value="16:9">16:9 (horizontal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration: {duration}s</Label>
              <Slider value={[duration]} min={5} max={180} step={5} onValueChange={(v) => setDuration(v[0])} />
            </div>
          </div>
          <Button onClick={onGenerate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
            Generate concept
          </Button>
        </CardContent>
      </Card>

      <ConceptPreview concept={result} />
    </div>
  );
}

function ConceptPreview({ concept }: { concept: any }) {
  if (!concept) {
    return (
      <Card className="flex items-center justify-center text-center text-sm text-muted-foreground min-h-[400px]">
        <CardContent className="pt-6">
          <Sparkles className="size-8 mx-auto mb-2 text-muted-foreground/60" />
          Your generated concept will appear here.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{concept.title}</CardTitle>
        <CardDescription className="flex flex-wrap gap-2">
          <Badge variant="secondary">{concept.format}</Badge>
          <Badge variant="secondary">{concept.style}</Badge>
          <Badge variant="secondary">{concept.duration}s</Badge>
          {concept.music_vibe && <Badge variant="outline">🎵 {concept.music_vibe}</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Section title="Hook">{concept.hook}</Section>
        <Section title="Script"><pre className="whitespace-pre-wrap font-sans">{concept.script}</pre></Section>
        <Section title="CTA">{concept.cta}</Section>
        {concept.hashtags && <Section title="Hashtags">{concept.hashtags}</Section>}
        {concept.thumbnail_prompt && <Section title="Thumbnail prompt">{concept.thumbnail_prompt}</Section>}
        <Separator />
        <div>
          <div className="font-semibold mb-2">Storyboard ({concept.scenes?.length || 0} scenes)</div>
          <div className="space-y-2">
            {concept.scenes?.map((s: any) => (
              <div key={s.scene_number} className="rounded-md border border-border p-3 bg-surface/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-xs">Scene {s.scene_number} · {s.shot_type}</div>
                  <Badge variant="outline" className="text-xs">{s.duration_seconds}s</Badge>
                </div>
                <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Visual:</span> {s.visual}</div>
                {s.voiceover && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">VO:</span> {s.voiceover}</div>}
                {s.on_screen_text && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">On-screen:</span> {s.on_screen_text}</div>}
                {s.asset_needed && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Asset:</span> {s.asset_needed}</div>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

// ===================== From Media =====================

function FromMedia({
  clientId,
  campaignId,
  onCreated,
}: {
  clientId: string | null;
  campaignId: string | null;
  onCreated: () => void;
}) {
  const build = useServerFn(buildVideoFromMedia);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [format, setFormat] = useState("9:16");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const uploaded: { url: string; name: string }[] = [];
      for (const f of Array.from(list)) {
        const path = `${u.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`;
        const { error } = await supabase.storage.from("video-assets").upload(path, f);
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("video-assets").createSignedUrl(path, 60 * 60 * 24 * 7);
        if (signed?.signedUrl) {
          uploaded.push({ url: signed.signedUrl, name: f.name });
          await supabase.from("video_assets").insert({
            user_id: u.user.id,
            client_id: clientId,
            name: f.name,
            file_url: signed.signedUrl,
            storage_path: path,
            asset_type: f.type.startsWith("video") ? "clip" : "image",
            content: "",
            tags: "",
          });
        }
      }
      setFiles((p) => [...p, ...uploaded]);
      toast.success(`Uploaded ${uploaded.length} file(s)`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onBuild = async () => {
    if (!files.length) return toast.error("Upload media first");
    if (!instructions.trim()) return toast.error("Add instructions");
    setLoading(true);
    try {
      const r = await build({
        data: {
          instructions,
          template,
          platform: platform as any,
          format: format as any,
          mediaUrls: files.map((f) => f.url),
          clientId,
          campaignId,
        },
      });
      setResult(r.concept);
      toast.success("Video plan ready");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create video from uploaded media</CardTitle>
          <CardDescription>Upload clips and images, pick a template, and AI assembles the video plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="block mb-2">Media</Label>
            <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground cursor-pointer hover:bg-accent/40">
              <Upload className="size-5 mb-1" />
              {uploading ? "Uploading..." : "Click to upload images / clips"}
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onUpload} />
            </label>
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative rounded-md border border-border overflow-hidden bg-surface aspect-square flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                    {f.name.match(/\.(mp4|mov|webm)$/i) ? <Film className="size-5" /> : <ImageIcon className="size-5" />}
                    <span className="absolute bottom-0 inset-x-0 truncate bg-background/80 px-1 text-[10px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 rounded bg-background/80 p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Template (optional)</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                {TEMPLATES.map((t) => <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="What should the video communicate? Who's it for?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => { setPlatform(v); const p = PLATFORMS.find(x => x.value === v); if (p) setFormat(p.format); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={onBuild} disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Wand2 className="size-4 mr-2" />}
            Build video
          </Button>
        </CardContent>
      </Card>

      <ConceptPreview concept={result} />
    </div>
  );
}

// ===================== Timeline Editor =====================

type Clip = {
  id: string;
  type: "video" | "image" | "text" | "audio" | "voiceover" | "logo";
  label: string;
  duration: number;
  transition?: string;
  trimStart?: number;
};

function TimelineEditor({ projects, onChanged }: { projects: Project[]; onChanged: () => void }) {
  const [projectId, setProjectId] = useState<string>("");
  const project = projects.find((p) => p.id === projectId);
  const [clips, setClips] = useState<Clip[]>([]);
  const [musicVol, setMusicVol] = useState(40);
  const [exportFormat, setExportFormat] = useState("mp4_9x16");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!project) {
      setClips([]);
      return;
    }
    const scenes = project.output_json?.scenes || [];
    setClips(
      scenes.map((s: any, i: number) => ({
        id: `scene-${i}`,
        type: "video",
        label: `Scene ${s.scene_number || i + 1} — ${(s.visual || "").slice(0, 40)}`,
        duration: s.duration_seconds || 5,
        transition: i === 0 ? "fade" : "cut",
      })),
    );
  }, [projectId]);

  const totalDuration = clips.filter((c) => c.type === "video" || c.type === "image").reduce((a, b) => a + b.duration, 0);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...clips];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setClips(next);
  };

  const remove = (id: string) => setClips((c) => c.filter((x) => x.id !== id));

  const add = (type: Clip["type"], label: string, duration = 3) =>
    setClips((c) => [...c, { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, type, label, duration }]);

  const onExport = async () => {
    if (!project) return toast.error("Pick a project first");
    await supabase.from("video_projects").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", project.id);
    toast.success(`Export queued (${exportFormat}). Total: ${totalDuration}s`);
    onChanged();
  };

  const onSave = async () => {
    if (!project) return;
    await supabase
      .from("video_projects")
      .update({ output_json: { ...(project.output_json || {}), timeline: { clips, music_volume: musicVol } } })
      .eq("id", project.id);
    toast.success("Timeline saved");
    onChanged();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scissors className="size-5" /> Timeline editor</CardTitle>
        <CardDescription>Reorder, trim, add overlays and music. Lightweight CapCut-style flow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Load a project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title} · {p.platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">Total: {totalDuration}s</Badge>
          {project && <Badge variant="secondary">{project.output_json?.format || "9:16"}</Badge>}
        </div>

        {!project ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Pick a generated project to load its storyboard onto the timeline.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => add("text", "Text overlay")}><TypeIcon className="size-4 mr-1" /> Text</Button>
              <Button size="sm" variant="outline" onClick={() => add("audio", "Background music", 30)}><Music className="size-4 mr-1" /> Music</Button>
              <Button size="sm" variant="outline" onClick={() => add("voiceover", "Voiceover", 15)}><Mic className="size-4 mr-1" /> Voiceover</Button>
              <Button size="sm" variant="outline" onClick={() => add("logo", "Logo overlay")}><ImageIcon className="size-4 mr-1" /> Logo</Button>
              <Button size="sm" variant="outline" onClick={() => { add("video", "Intro", 2); }}><Plus className="size-4 mr-1" /> Intro</Button>
              <Button size="sm" variant="outline" onClick={() => { add("video", "Outro", 2); }}><Plus className="size-4 mr-1" /> Outro</Button>
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                add(f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image", f.name, 5);
                e.target.value = "";
              }} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="size-4 mr-1" /> Add clip</Button>
            </div>

            <div className="space-y-2">
              {clips.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                  <Badge variant="outline" className="capitalize w-20 justify-center">{c.type}</Badge>
                  <div className="flex-1 min-w-0 text-sm truncate">{c.label}</div>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={c.duration}
                    onChange={(e) => setClips((p) => p.map((x) => x.id === c.id ? { ...x, duration: Number(e.target.value) || 1 } : x))}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">s</span>
                  <Select
                    value={c.transition || "cut"}
                    onValueChange={(v) => setClips((p) => p.map((x) => x.id === c.id ? { ...x, transition: v } : x))}
                  >
                    <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cut">Cut</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="dissolve">Dissolve</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Background music volume: {musicVol}%</Label>
                <Slider value={[musicVol]} onValueChange={(v) => setMusicVol(v[0])} max={100} step={5} />
              </div>
              <div>
                <Label className="text-xs">Export format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4_9x16">MP4 · TikTok / Reels (9:16)</SelectItem>
                    <SelectItem value="mp4_16x9">MP4 · YouTube (16:9)</SelectItem>
                    <SelectItem value="mp4_1x1">MP4 · Square (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onSave} variant="outline"><Save className="size-4 mr-1" /> Save timeline</Button>
              <Button onClick={onExport}><Download className="size-4 mr-1" /> Export</Button>
              <Button variant="ghost"><Play className="size-4 mr-1" /> Preview</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Templates =====================

function TemplatesGrid({
  clientId,
  campaignId,
  onCreated,
}: {
  clientId: string | null;
  campaignId: string | null;
  onCreated: () => void;
}) {
  const generate = useServerFn(generateVideoConcept);
  const [loading, setLoading] = useState<string | null>(null);

  const use = async (t: typeof TEMPLATES[number]) => {
    setLoading(t.id);
    try {
      await generate({
        data: {
          prompt: `Build a ${t.label} for ${clientId ? "this client" : "a new lead"}. Make it punchy and on-brand.`,
          platform: t.platform as any,
          format: (PLATFORMS.find((p) => p.value === t.platform)?.format as any) || "9:16",
          style: t.style,
          duration: t.platform === "youtube_long" ? 90 : 30,
          clientId,
          campaignId,
        },
      });
      toast.success(`Generated: ${t.label}`);
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((t) => (
        <Card key={t.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-10 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <LayoutTemplate className="size-5 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="text-xs">{t.platform}</Badge>
            </div>
            <CardTitle className="text-base">{t.label}</CardTitle>
            <CardDescription className="text-xs">{t.style}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button size="sm" className="w-full" disabled={loading === t.id} onClick={() => use(t)}>
              {loading === t.id ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
              Use template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===================== AI Tools =====================

function AIToolsPanel({ clientId }: { clientId: string | null }) {
  const gen = useServerFn(generateVideoSnippet);
  const [kind, setKind] = useState<any>("script");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [tone, setTone] = useState("Energetic");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  const current = AI_TOOLS.find((t) => t.kind === kind)!;

  const run = async () => {
    if (!topic.trim()) return toast.error("Add input");
    setLoading(true);
    setOutput("");
    try {
      const r = await gen({ data: { kind, topic, platform, tone, duration, clientId } });
      setOutput(r.text);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI tools</CardTitle>
          <CardDescription>Quick generators powered by the brand kit when a client is selected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {AI_TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.kind}
                  onClick={() => setKind(t.kind)}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs text-center transition-colors ${
                    kind === t.kind ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                  }`}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label>{current.needsTopic}</Label>
            <Textarea rows={6} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration: {duration}s</Label>
            <Slider value={[duration]} onValueChange={(v) => setDuration(v[0])} min={5} max={300} step={5} />
          </div>

          <Button onClick={run} disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
            Generate
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output</CardTitle>
        </CardHeader>
        <CardContent>
          {output ? (
            <div className="space-y-2">
              <pre className="whitespace-pre-wrap font-sans text-sm bg-surface/50 p-4 rounded-md border border-border max-h-[600px] overflow-auto">{output}</pre>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>Copy</Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground min-h-[300px] flex items-center justify-center">
              Output will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Library =====================

function ProjectLibrary({ projects, onChanged }: { projects: Project[]; onChanged: () => void }) {
  const remove = async (id: string) => {
    if (!confirm("Delete this video project?")) return;
    await supabase.from("video_storyboards").delete().eq("project_id", id);
    await supabase.from("video_projects").delete().eq("id", id);
    toast.success("Deleted");
    onChanged();
  };

  if (!projects.length) {
    return (
      <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No video projects yet. Create one from scratch or from uploaded media.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <Card key={p.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm leading-tight">{p.title}</CardTitle>
              <Badge variant="outline" className="text-xs">{p.status}</Badge>
            </div>
            <CardDescription className="text-xs">{p.platform} · {p.type} · {new Date(p.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground line-clamp-3">{p.output_json?.hook || p.output_json?.script || "—"}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">{p.output_json?.scenes?.length || 0} scenes</Badge>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="size-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
