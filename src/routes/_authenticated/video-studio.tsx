import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, Film, Wand2, FileVideo, Layers, Library, Repeat } from "lucide-react";
import {
  generateVideoIdeas,
  generateShortScript,
  generateLongScript,
  generateVideoPrompts,
  generateStoryboard,
  repurposeContent,
} from "@/lib/video-ai.functions";

export const Route = createFileRoute("/_authenticated/video-studio")({
  component: VideoStudioPage,
});

type Client = { id: string; business_name: string };
type Campaign = { id: string; name: string; client_id: string | null };
type Project = {
  id: string;
  type: string;
  platform: string;
  title: string;
  output: string;
  status: string;
  created_at: string;
  client_id: string | null;
  campaign_id: string | null;
};
type AssetRow = {
  id: string;
  asset_type: string;
  name: string;
  file_url: string;
  tags: string;
  created_at: string;
};

const PLATFORMS = [
  { v: "tiktok", l: "TikTok" },
  { v: "instagram_reels", l: "Instagram Reels" },
  { v: "youtube_shorts", l: "YouTube Shorts" },
  { v: "youtube_long", l: "YouTube Long-Form" },
  { v: "facebook_reels", l: "Facebook Reels" },
];

const STATUSES = ["draft", "needs_review", "approved", "in_production", "scheduled", "published"];

function tryParse<T = unknown>(raw: string): T | null {
  try { return JSON.parse(raw) as T; } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]) as T; } catch { return null; }
  }
}

function VideoStudioPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const refresh = async () => {
    const [c, ca, p, a] = await Promise.all([
      supabase.from("clients").select("id, business_name").order("business_name"),
      supabase.from("campaigns").select("id, name, client_id").order("created_at", { ascending: false }),
      supabase.from("video_projects").select("id, type, platform, title, output, status, created_at, client_id, campaign_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("video_assets").select("id, asset_type, name, file_url, tags, created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setClients((c.data ?? []) as Client[]);
    setCampaigns((ca.data ?? []) as Campaign[]);
    setProjects((p.data ?? []) as Project[]);
    setAssets((a.data ?? []) as AssetRow[]);
  };

  useEffect(() => { if (userId) refresh(); }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Film className="size-6 text-primary" /> AI Video Studio
          </h1>
          <p className="text-sm text-muted-foreground">Ideas, scripts, prompts, storyboards & asset library — powered by AI.</p>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="ideas"><Sparkles className="mr-1 size-4" />Ideas</TabsTrigger>
          <TabsTrigger value="short"><FileVideo className="mr-1 size-4" />Short</TabsTrigger>
          <TabsTrigger value="long"><FileVideo className="mr-1 size-4" />Long</TabsTrigger>
          <TabsTrigger value="prompts"><Wand2 className="mr-1 size-4" />Prompts</TabsTrigger>
          <TabsTrigger value="storyboard"><Layers className="mr-1 size-4" />Storyboard</TabsTrigger>
          <TabsTrigger value="repurpose"><Repeat className="mr-1 size-4" />Repurpose</TabsTrigger>
          <TabsTrigger value="library"><Library className="mr-1 size-4" />Library</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <IdeasTab clients={clients} campaigns={campaigns} userId={userId} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="short">
          <ShortScriptTab clients={clients} campaigns={campaigns} userId={userId} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="long">
          <LongScriptTab clients={clients} campaigns={campaigns} userId={userId} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="prompts">
          <PromptsTab userId={userId} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="storyboard">
          <StoryboardTab userId={userId} projects={projects} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="repurpose">
          <RepurposeTab userId={userId} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="library">
          <LibraryTab userId={userId} assets={assets} onChanged={refresh} />
        </TabsContent>
      </Tabs>

      <ProjectsList projects={projects} onChanged={refresh} />
    </div>
  );
}

// ---------- Shared field helpers ----------
function ClientCampaignFields({
  clients, campaigns, clientId, setClientId, campaignId, setCampaignId,
}: {
  clients: Client[]; campaigns: Campaign[];
  clientId: string; setClientId: (v: string) => void;
  campaignId: string; setCampaignId: (v: string) => void;
}) {
  const filtered = clientId ? campaigns.filter((c) => c.client_id === clientId) : campaigns;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Client</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Campaign</Label>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {filtered.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

async function insertProject(payload: {
  userId: string; type: string; platform: string; title: string;
  output: string; inputs: Record<string, unknown>;
  clientId: string; campaignId: string;
}) {
  const { error } = await supabase.from("video_projects").insert({
    user_id: payload.userId,
    type: payload.type,
    platform: payload.platform,
    title: payload.title.slice(0, 200) || "Untitled",
    output: payload.output,
    inputs: payload.inputs as never,
    client_id: payload.clientId && payload.clientId !== "__none" ? payload.clientId : null,
    campaign_id: payload.campaignId && payload.campaignId !== "__none" ? payload.campaignId : null,
    status: "draft",
  });
  if (error) throw error;
}

// ---------- Ideas ----------
function IdeasTab({ clients, campaigns, userId, onSaved }: { clients: Client[]; campaigns: Campaign[]; userId: string | null; onSaved: () => void }) {
  const run = useServerFn(generateVideoIdeas);
  const [platform, setPlatform] = useState("tiktok");
  const [businessType, setBusinessType] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState("engaging");
  const [videoLength, setVideoLength] = useState("30s");
  const [clientId, setClientId] = useState("__none");
  const [campaignId, setCampaignId] = useState("__none");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    setLoading(true);
    try {
      const { raw } = await run({ data: { platform: platform as never, businessType, audience, goal, offer, tone, videoLength } });
      setOutput(raw);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const onSave = async () => {
    if (!userId || !output) return;
    try {
      await insertProject({
        userId, type: "idea", platform, title: `${businessType || "Video"} ideas`,
        output, inputs: { businessType, audience, goal, offer, tone, videoLength },
        clientId, campaignId,
      });
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const parsed = tryParse<{ ideas?: Array<{ title: string; hook: string; script: string; cta?: string; caption?: string; hashtags?: string; scenes?: Array<{ n: number; visual: string; text: string; voiceover: string }> }> }>(output);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Business type</Label><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. dental clinic" /></div>
        <div><Label>Target audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. families 25-45" /></div>
        <div><Label>Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="bookings, awareness…" /></div>
        <div><Label>Offer</Label><Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="free consult…" /></div>
        <div><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
        <div><Label>Video length</Label><Input value={videoLength} onChange={(e) => setVideoLength(e.target.value)} /></div>
      </div>
      <ClientCampaignFields clients={clients} campaigns={campaigns} clientId={clientId} setClientId={setClientId} campaignId={campaignId} setCampaignId={setCampaignId} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate ideas
        </Button>
        {output && <Button variant="outline" onClick={onSave}><Save className="size-4" />Save to projects</Button>}
      </div>
      {parsed?.ideas && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {parsed.ideas.map((idea, i) => (
            <Card key={i} className="p-3 space-y-2 bg-surface">
              <div className="font-semibold">{idea.title}</div>
              <div className="text-xs text-muted-foreground"><b>Hook:</b> {idea.hook}</div>
              <div className="text-xs whitespace-pre-wrap">{idea.script}</div>
              {idea.cta && <div className="text-xs"><b>CTA:</b> {idea.cta}</div>}
              {idea.caption && <div className="text-xs text-muted-foreground">{idea.caption}</div>}
              {idea.hashtags && <div className="text-xs text-primary">{idea.hashtags}</div>}
            </Card>
          ))}
        </div>
      )}
      {output && !parsed?.ideas && <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{output}</pre>}
    </Card>
  );
}

// ---------- Short Script ----------
function ShortScriptTab({ clients, campaigns, userId, onSaved }: { clients: Client[]; campaigns: Campaign[]; userId: string | null; onSaved: () => void }) {
  const run = useServerFn(generateShortScript);
  const [platform, setPlatform] = useState("tiktok");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("energetic");
  const [cta, setCta] = useState("");
  const [clientId, setClientId] = useState("__none");
  const [campaignId, setCampaignId] = useState("__none");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!topic.trim()) return toast.error("Enter a topic");
    setLoading(true);
    try {
      const { raw } = await run({ data: { platform: platform as never, topic, audience, tone, cta } });
      setOutput(raw);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const onSave = async () => {
    if (!userId || !output) return;
    await insertProject({ userId, type: "short_script", platform, title: topic, output, inputs: { topic, audience, tone, cta }, clientId, campaignId });
    toast.success("Saved"); onSaved();
  };

  const parsed = tryParse<{ hook: string; main_message: string; visual_direction: string; on_screen_text: string[]; voiceover: string; cta: string }>(output);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PLATFORMS.filter(p => p.v !== "youtube_long").map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
        <div><Label>Audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} /></div>
        <div><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>CTA</Label><Input value={cta} onChange={(e) => setCta(e.target.value)} /></div>
      </div>
      <ClientCampaignFields clients={clients} campaigns={campaigns} clientId={clientId} setClientId={setClientId} campaignId={campaignId} setCampaignId={setCampaignId} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate script</Button>
        {output && <Button variant="outline" onClick={onSave}><Save className="size-4" />Save</Button>}
      </div>
      {parsed && (
        <div className="space-y-2 rounded-md bg-surface p-4 text-sm">
          <div><b>3-sec hook:</b> {parsed.hook}</div>
          <div><b>Main message:</b> {parsed.main_message}</div>
          <div><b>Visual direction:</b> {parsed.visual_direction}</div>
          <div><b>On-screen text:</b> <ul className="list-disc pl-5">{parsed.on_screen_text?.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          <div><b>Voiceover:</b> <div className="whitespace-pre-wrap">{parsed.voiceover}</div></div>
          <div><b>CTA:</b> {parsed.cta}</div>
        </div>
      )}
      {output && !parsed && <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{output}</pre>}
    </Card>
  );
}

// ---------- Long Script ----------
function LongScriptTab({ clients, campaigns, userId, onSaved }: { clients: Client[]; campaigns: Campaign[]; userId: string | null; onSaved: () => void }) {
  const run = useServerFn(generateLongScript);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("10 minutes");
  const [tone, setTone] = useState("informative");
  const [keywords, setKeywords] = useState("");
  const [clientId, setClientId] = useState("__none");
  const [campaignId, setCampaignId] = useState("__none");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!topic.trim()) return toast.error("Enter a topic");
    setLoading(true);
    try {
      const { raw } = await run({ data: { topic, audience, duration, tone, keywords } });
      setOutput(raw);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const onSave = async () => {
    if (!userId || !output) return;
    await insertProject({ userId, type: "long_script", platform: "youtube_long", title: topic, output, inputs: { topic, audience, duration, tone, keywords }, clientId, campaignId });
    toast.success("Saved"); onSaved();
  };

  const parsed = tryParse<{ titles: string[]; thumbnail_ideas: string[]; intro: string; outline: Array<{ section: string; summary: string }>; script_sections: Array<{ heading: string; content: string }>; cta: string; seo_description: string; tags: string[] }>(output);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
        <div><Label>Audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} /></div>
        <div><Label>Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
        <div><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Target keywords</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></div>
      </div>
      <ClientCampaignFields clients={clients} campaigns={campaigns} clientId={clientId} setClientId={setClientId} campaignId={campaignId} setCampaignId={setCampaignId} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate script</Button>
        {output && <Button variant="outline" onClick={onSave}><Save className="size-4" />Save</Button>}
      </div>
      {parsed && (
        <div className="space-y-3 rounded-md bg-surface p-4 text-sm">
          <div><b>Titles</b><ul className="list-disc pl-5">{parsed.titles?.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          <div><b>Thumbnail ideas</b><ul className="list-disc pl-5">{parsed.thumbnail_ideas?.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          <div><b>Intro</b><div className="whitespace-pre-wrap">{parsed.intro}</div></div>
          <div><b>Outline</b><ul className="list-disc pl-5">{parsed.outline?.map((o, i) => <li key={i}><b>{o.section}:</b> {o.summary}</li>)}</ul></div>
          <div><b>Script</b>{parsed.script_sections?.map((s, i) => (
            <div key={i} className="mt-2"><div className="font-semibold">{s.heading}</div><div className="whitespace-pre-wrap text-xs">{s.content}</div></div>
          ))}</div>
          <div><b>CTA:</b> {parsed.cta}</div>
          <div><b>SEO description:</b> {parsed.seo_description}</div>
          <div><b>Tags:</b> {parsed.tags?.join(", ")}</div>
        </div>
      )}
      {output && !parsed && <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{output}</pre>}
    </Card>
  );
}

// ---------- Prompts ----------
function PromptsTab({ userId, onSaved }: { userId: string | null; onSaved: () => void }) {
  const run = useServerFn(generateVideoPrompts);
  const [tool, setTool] = useState("runway");
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [mood, setMood] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!subject.trim()) return toast.error("Enter a subject");
    setLoading(true);
    try {
      const { raw } = await run({ data: { tool: tool as never, subject, style, mood } });
      setOutput(raw);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const onSave = async () => {
    if (!userId || !output) return;
    await insertProject({ userId, type: "ai_prompt", platform: "tiktok", title: `${tool}: ${subject}`, output, inputs: { tool, subject, style, mood }, clientId: "__none", campaignId: "__none" });
    toast.success("Saved"); onSaved();
  };

  const parsed = tryParse<{ prompts: Array<{ scene_prompt: string; camera_movement: string; lighting: string; style: string; subject: string; background: string; duration_seconds: number; negative_prompt: string }> }>(output);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>AI Video Tool</Label>
          <Select value={tool} onValueChange={setTool}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="runway">Runway</SelectItem>
              <SelectItem value="pika">Pika</SelectItem>
              <SelectItem value="kling">Kling</SelectItem>
              <SelectItem value="sora">Sora-style</SelectItem>
              <SelectItem value="luma">Luma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div><Label>Style</Label><Input value={style} onChange={(e) => setStyle(e.target.value)} /></div>
        <div><Label>Mood</Label><Input value={mood} onChange={(e) => setMood(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Generate prompts</Button>
        {output && <Button variant="outline" onClick={onSave}><Save className="size-4" />Save</Button>}
      </div>
      {parsed?.prompts && (
        <div className="grid gap-3 md:grid-cols-2">
          {parsed.prompts.map((p, i) => (
            <Card key={i} className="p-3 space-y-1 bg-surface text-xs">
              <div><b>Scene:</b> {p.scene_prompt}</div>
              <div><b>Camera:</b> {p.camera_movement}</div>
              <div><b>Lighting:</b> {p.lighting}</div>
              <div><b>Style:</b> {p.style}</div>
              <div><b>Subject:</b> {p.subject}</div>
              <div><b>Background:</b> {p.background}</div>
              <div><b>Duration:</b> {p.duration_seconds}s</div>
              <div><b>Negative:</b> {p.negative_prompt}</div>
            </Card>
          ))}
        </div>
      )}
      {output && !parsed?.prompts && <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{output}</pre>}
    </Card>
  );
}

// ---------- Storyboard ----------
function StoryboardTab({ userId, projects, onSaved }: { userId: string | null; projects: Project[]; onSaved: () => void }) {
  const run = useServerFn(generateStoryboard);
  const [script, setScript] = useState("");
  const [sceneCount, setSceneCount] = useState(6);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("__none");

  const onGenerate = async () => {
    if (script.trim().length < 10) return toast.error("Paste a script first");
    setLoading(true);
    try {
      const { raw } = await run({ data: { script, sceneCount } });
      setOutput(raw);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const parsed = tryParse<{ scenes: Array<{ scene_number: number; visual: string; voiceover: string; on_screen_text: string; shot_type: string; duration_seconds: number; asset_needed: string }> }>(output);

  const onSave = async () => {
    if (!userId || !parsed?.scenes) return;
    const targetProject = projectId !== "__none" ? projectId : null;
    const rows = parsed.scenes.map((s) => ({
      user_id: userId,
      project_id: targetProject,
      scene_number: s.scene_number,
      visual: String(s.visual ?? "").slice(0, 1000),
      voiceover: String(s.voiceover ?? "").slice(0, 1000),
      on_screen_text: String(s.on_screen_text ?? "").slice(0, 500),
      shot_type: String(s.shot_type ?? "").slice(0, 100),
      duration_seconds: Number(s.duration_seconds) || 5,
      asset_needed: String(s.asset_needed ?? "").slice(0, 300),
    }));
    const { error } = await supabase.from("video_storyboards").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Saved ${rows.length} scenes`);
    onSaved();
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div>
        <Label>Paste script</Label>
        <Textarea value={script} onChange={(e) => setScript(e.target.value)} rows={6} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Scene count</Label><Input type="number" min={2} max={20} value={sceneCount} onChange={(e) => setSceneCount(Number(e.target.value))} /></div>
        <div>
          <Label>Attach to project (optional)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title || p.type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />} Build storyboard</Button>
        {parsed?.scenes && <Button variant="outline" onClick={onSave}><Save className="size-4" />Save scenes</Button>}
      </div>
      {parsed?.scenes && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {parsed.scenes.map((s) => (
            <Card key={s.scene_number} className="p-3 space-y-1 bg-surface text-xs">
              <div className="flex items-center justify-between">
                <Badge>Scene {s.scene_number}</Badge>
                <span className="text-muted-foreground">{s.duration_seconds}s · {s.shot_type}</span>
              </div>
              <div><b>Visual:</b> {s.visual}</div>
              <div><b>VO:</b> {s.voiceover}</div>
              <div><b>Text:</b> {s.on_screen_text}</div>
              <div><b>Asset:</b> {s.asset_needed}</div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Repurpose ----------
function RepurposeTab({ userId, onSaved }: { userId: string | null; onSaved: () => void }) {
  const run = useServerFn(repurposeContent);
  const [source, setSource] = useState("");
  const [tone, setTone] = useState("");
  const [targets, setTargets] = useState<string[]>(["tiktok", "instagram_reels", "linkedin"]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (t: string) => setTargets((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);

  const onGenerate = async () => {
    if (source.trim().length < 20) return toast.error("Paste at least 20 characters of source content");
    if (targets.length === 0) return toast.error("Pick at least one target format");
    setLoading(true);
    try {
      const { raw } = await run({ data: { source, targets: targets as never, tone } });
      setOutput(raw);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const parsed = tryParse<{ outputs: Array<{ format: string; title: string; content: string; hashtags?: string; cta?: string }> }>(output);

  const saveOne = async (item: { format: string; title: string; content: string }) => {
    if (!userId) return;
    const platformMap: Record<string, string> = {
      tiktok: "tiktok", instagram_reels: "instagram_reels", youtube_shorts: "youtube_shorts",
      facebook_reels: "facebook_reels", linkedin: "linkedin", email: "youtube_long",
    };
    await insertProject({
      userId, type: "repurpose", platform: platformMap[item.format] ?? "tiktok",
      title: item.title || item.format, output: item.content, inputs: { source_excerpt: source.slice(0, 500), format: item.format },
      clientId: "__none", campaignId: "__none",
    });
    toast.success(`Saved ${item.format}`);
    onSaved();
  };

  const allFormats = [
    { v: "tiktok", l: "TikTok" }, { v: "instagram_reels", l: "Reels" }, { v: "youtube_shorts", l: "YT Shorts" },
    { v: "facebook_reels", l: "FB Reels" }, { v: "linkedin", l: "LinkedIn" }, { v: "email", l: "Email" },
  ];

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div>
        <Label>Source content (blog, notes, script…)</Label>
        <Textarea value={source} onChange={(e) => setSource(e.target.value)} rows={6} />
      </div>
      <div><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="optional" /></div>
      <div>
        <Label>Target formats</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {allFormats.map((f) => (
            <Badge key={f.v} onClick={() => toggle(f.v)}
              className={`cursor-pointer ${targets.includes(f.v) ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"}`}>
              {f.l}
            </Badge>
          ))}
        </div>
      </div>
      <Button onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Repeat className="size-4" />} Repurpose</Button>
      {parsed?.outputs && (
        <div className="grid gap-3 md:grid-cols-2">
          {parsed.outputs.map((o, i) => (
            <Card key={i} className="p-3 space-y-2 bg-surface text-sm">
              <div className="flex items-center justify-between">
                <Badge>{o.format}</Badge>
                <Button size="sm" variant="ghost" onClick={() => saveOne(o)}><Save className="size-3" />Save</Button>
              </div>
              {o.title && <div className="font-semibold">{o.title}</div>}
              <div className="whitespace-pre-wrap text-xs">{o.content}</div>
              {o.hashtags && <div className="text-xs text-primary">{o.hashtags}</div>}
              {o.cta && <div className="text-xs"><b>CTA:</b> {o.cta}</div>}
            </Card>
          ))}
        </div>
      )}
      {output && !parsed?.outputs && <pre className="whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{output}</pre>}
    </Card>
  );
}

// ---------- Library ----------
function LibraryTab({ userId, assets, onChanged }: { userId: string | null; assets: AssetRow[]; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [assetType, setAssetType] = useState("clip");

  const onUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("video-assets").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("video-assets").getPublicUrl(path);
      const { error: insErr } = await supabase.from("video_assets").insert({
        user_id: userId, asset_type: assetType, name: file.name,
        file_url: pub.publicUrl, storage_path: path,
      });
      if (insErr) throw insErr;
      toast.success("Uploaded");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const onDelete = async (a: AssetRow) => {
    await supabase.from("video_assets").delete().eq("id", a.id);
    onChanged();
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <Label>Asset type</Label>
          <Select value={assetType} onValueChange={setAssetType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clip">Video clip</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="ai_image">AI image</SelectItem>
              <SelectItem value="logo">Logo</SelectItem>
              <SelectItem value="brand">Brand asset</SelectItem>
              <SelectItem value="script">Script</SelectItem>
              <SelectItem value="storyboard">Storyboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Upload file</Label>
          <Input type="file" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </div>
      </div>
      {assets.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No assets yet — upload clips, images, logos, scripts or storyboards.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((a) => (
            <Card key={a.id} className="overflow-hidden bg-surface text-xs">
              {a.asset_type === "image" || a.asset_type === "ai_image" || a.asset_type === "logo" || a.asset_type === "brand"
                ? <img src={a.file_url} alt={a.name} className="aspect-video w-full object-cover" />
                : a.asset_type === "clip"
                  ? <video src={a.file_url} className="aspect-video w-full bg-black" controls />
                  : <div className="aspect-video w-full bg-muted flex items-center justify-center"><Library className="size-8 text-muted-foreground" /></div>}
              <div className="p-2 space-y-1">
                <div className="font-medium truncate">{a.name}</div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{a.asset_type}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(a)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Projects list ----------
function ProjectsList({ projects, onChanged }: { projects: Project[]; onChanged: () => void }) {
  const updateStatus = async (id: string, status: string) => {
    await supabase.from("video_projects").update({ status }).eq("id", id);
    onChanged();
  };
  const saveToCalendar = async (p: Project) => {
    const { data: ures } = await supabase.auth.getUser();
    const uid = ures.user?.id;
    if (!uid) return;
    const { data: post, error: postErr } = await supabase.from("content_posts").insert({
      user_id: uid, client_id: p.client_id, campaign_id: p.campaign_id,
      title: p.title, caption: p.output.slice(0, 4000), hashtags: "",
      platform: p.platform, media_urls: [], status: "draft", ai_generated: true,
    }).select("id").single();
    if (postErr || !post) return toast.error(postErr?.message ?? "Failed");
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("content_calendar").insert({
      user_id: uid, post_id: post.id, calendar_date: today, platform: p.platform, status: "scheduled",
    });
    toast.success("Saved to Content Calendar");
  };
  const onDelete = async (id: string) => {
    await supabase.from("video_projects").delete().eq("id", id);
    onChanged();
  };

  if (projects.length === 0) return null;

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-3 font-semibold">Recent projects</div>
      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{p.type}</Badge>
                <Badge>{p.platform}</Badge>
                <div className="truncate text-sm font-medium">{p.title}</div>
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.output.slice(0, 220)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => saveToCalendar(p)}>To calendar</Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
