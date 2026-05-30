import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidUUID } from "@/lib/utils";

function assertOptionalUUID(value: string | null | undefined, label: string) {
  if (value == null || value === "") return;
  if (!isValidUUID(value)) throw new Error(`Valid ${label} is required`);
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(system: string, user: string, asJson = false): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (asJson) body.response_format = { type: "json_object" };
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

async function loadBrand(supabase: any, clientId?: string | null) {
  if (!clientId) return null;
  const { data } = await supabase
    .from("clients")
    .select("business_name,industry,services,brand_voice,brand_colors,target_audience,preferred_tone,keywords")
    .eq("id", clientId)
    .maybeSingle();
  return data || null;
}

function brandContext(brand: any): string {
  if (!brand) return "";
  return `\nBrand context:
- Business: ${brand.business_name || ""}
- Industry: ${brand.industry || ""}
- Services: ${brand.services || ""}
- Voice: ${brand.brand_voice || ""}
- Tone: ${brand.preferred_tone || ""}
- Audience: ${brand.target_audience || ""}
- Colors: ${brand.brand_colors || ""}`;
}

// ============ Snippet generator (script / hook / CTA / subtitles / VO script / thumbnail prompt) ============

const SnippetInput = z.object({
  kind: z.enum([
    "script",
    "hook",
    "cta",
    "subtitles",
    "voiceover_script",
    "thumbnail_prompt",
    "blog_to_video",
    "offer_to_ad",
    "long_to_shorts",
  ]),
  platform: z.string().max(40).default("TikTok"),
  topic: z.string().max(2000).default(""),
  style: z.string().max(50).default(""),
  tone: z.string().max(40).default("Energetic"),
  duration: z.number().int().min(5).max(600).default(30),
  clientId: z.string().uuid().optional().nullable(),
});

const SNIPPET_PROMPTS: Record<string, (i: z.infer<typeof SnippetInput>, brand: string) => { sys: string; user: string }> = {
  script: (i, b) => ({
    sys: "You write short-form video scripts. Output plain text only, formatted with [HOOK], [BODY], [CTA] sections. No preamble.",
    user: `Write a ${i.duration}s ${i.platform} script.\nTopic: ${i.topic}\nStyle: ${i.style}\nTone: ${i.tone}${b}`,
  }),
  hook: (i, b) => ({
    sys: "You write scroll-stopping video hooks (first 3 seconds). Output 3 numbered hook options. No preamble.",
    user: `Topic: ${i.topic}\nPlatform: ${i.platform}\nTone: ${i.tone}${b}`,
  }),
  cta: (i, b) => ({
    sys: "You write punchy video CTAs. Output 5 numbered CTA options, max 8 words each.",
    user: `Topic: ${i.topic}\nPlatform: ${i.platform}${b}`,
  }),
  subtitles: (i) => ({
    sys: "You produce SRT-formatted subtitles. Output ONLY valid SRT, no preamble or commentary.",
    user: `Turn the following script into clean SRT subtitles (max 7 words per cue, ~2s per cue):\n\n${i.topic}`,
  }),
  voiceover_script: (i, b) => ({
    sys: "You write voiceover scripts optimised for natural narration. Plain paragraphs, no stage directions, no preamble.",
    user: `Topic: ${i.topic}\nDuration: ~${i.duration}s\nTone: ${i.tone}\nPlatform: ${i.platform}${b}`,
  }),
  thumbnail_prompt: (i) => ({
    sys: "You write detailed AI-image prompts for video thumbnails. Single paragraph, no preamble.",
    user: `Video topic: ${i.topic}\nPlatform: ${i.platform}\nStyle: ${i.style || "bold, high-contrast, scroll-stopping"}`,
  }),
  blog_to_video: (i, b) => ({
    sys: "You convert blog posts into short-form video scripts with [HOOK] [BODY] [CTA] sections plus 3-5 b-roll suggestions tagged [B-ROLL].",
    user: `Convert this blog post into a ${i.duration}s ${i.platform} video script:\n\n${i.topic}${b}`,
  }),
  offer_to_ad: (i, b) => ({
    sys: "You turn business offers into high-converting short-video ad scripts with [HOOK] [PROBLEM] [SOLUTION] [OFFER] [CTA] sections.",
    user: `Offer: ${i.topic}\nPlatform: ${i.platform}\nTone: ${i.tone}${b}`,
  }),
  long_to_shorts: (i) => ({
    sys: "You analyse long-form video transcripts and extract 5 viral short-form clips. Output a numbered list. Each item: clip title, suggested duration, exact transcript excerpt, and why it works.",
    user: `Transcript / long video summary:\n\n${i.topic}`,
  }),
};

export const generateVideoSnippet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SnippetInput.parse(d))
  .handler(async ({ data, context }) => {
    const brand = await loadBrand(context.supabase, data.clientId);
    const p = SNIPPET_PROMPTS[data.kind](data, brandContext(brand));
    const text = await callAI(p.sys, p.user);
    return { text: text.trim() };
  });

// ============ Video concept (from scratch) — returns full concept + storyboard JSON ============

const ConceptInput = z.object({
  prompt: z.string().min(2).max(2000),
  platform: z.enum(["tiktok", "instagram_reel", "youtube_short", "facebook_reel", "youtube_long"]),
  format: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  style: z.string().max(60).default("cinematic"),
  duration: z.number().int().min(5).max(600).default(30),
  clientId: z.string().uuid().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
});

export type StoryboardScene = {
  scene_number: number;
  visual: string;
  voiceover: string;
  on_screen_text: string;
  shot_type: string;
  duration_seconds: number;
  asset_needed: string;
};

export const generateVideoConcept = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConceptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    assertOptionalUUID(data.clientId, "client ID");
    assertOptionalUUID(data.campaignId, "campaign ID");
    const brand = await loadBrand(supabase, data.clientId);

    const sys = `You are an elite short-form video director. Output ONLY valid JSON matching:
{"title":string,"hook":string,"script":string,"cta":string,"hashtags":string,"thumbnail_prompt":string,"music_vibe":string,"scenes":[{"scene_number":number,"visual":string,"voiceover":string,"on_screen_text":string,"shot_type":string,"duration_seconds":number,"asset_needed":string}]}
Rules:
- Scenes should sum to roughly the target duration
- shot_type: e.g. "close-up", "wide", "POV", "b-roll", "talking head"
- asset_needed: short description of what footage/image is required
- script: full narration / dialogue text
- hook: first 3 seconds, scroll-stopping`;

    const user = `Create a ${data.duration}s ${data.platform} video (${data.format}).
Prompt: ${data.prompt}
Style: ${data.style}${brandContext(brand)}`;

    const raw = await callAI(sys, user, true);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned malformed concept");
      parsed = JSON.parse(m[0]);
    }
    const scenes: StoryboardScene[] = Array.isArray(parsed.scenes)
      ? parsed.scenes.slice(0, 20).map((s: any, i: number) => ({
          scene_number: Number(s.scene_number) || i + 1,
          visual: String(s.visual || "").slice(0, 500),
          voiceover: String(s.voiceover || "").slice(0, 500),
          on_screen_text: String(s.on_screen_text || "").slice(0, 200),
          shot_type: String(s.shot_type || "").slice(0, 60),
          duration_seconds: Math.min(60, Math.max(1, Number(s.duration_seconds) || 5)),
          asset_needed: String(s.asset_needed || "").slice(0, 300),
        }))
      : [];

    const output_json = {
      title: String(parsed.title || "").slice(0, 200),
      hook: String(parsed.hook || "").slice(0, 400),
      script: String(parsed.script || "").slice(0, 5000),
      cta: String(parsed.cta || "").slice(0, 200),
      hashtags: String(parsed.hashtags || "").slice(0, 400),
      thumbnail_prompt: String(parsed.thumbnail_prompt || "").slice(0, 600),
      music_vibe: String(parsed.music_vibe || "").slice(0, 200),
      format: data.format,
      style: data.style,
      duration: data.duration,
      scenes,
    };

    // Persist as a video_project + storyboards
    const { data: project, error: projErr } = await supabase
      .from("video_projects")
      .insert({
        user_id: userId,
        client_id: data.clientId || null,
        campaign_id: data.campaignId || null,
        type: "from_scratch",
        platform: data.platform,
        title: output_json.title || data.prompt.slice(0, 80),
        inputs: { prompt: data.prompt, format: data.format, style: data.style, duration: data.duration },
        output: output_json.script,
        output_json,
        status: "draft",
      })
      .select()
      .single();
    if (projErr) throw new Error(projErr.message);

    if (scenes.length) {
      await supabase.from("video_storyboards").insert(
        scenes.map((s) => ({
          user_id: userId,
          project_id: project.id,
          scene_number: s.scene_number,
          visual: s.visual,
          voiceover: s.voiceover,
          on_screen_text: s.on_screen_text,
          shot_type: s.shot_type,
          duration_seconds: s.duration_seconds,
          asset_needed: s.asset_needed,
        })),
      );
    }

    return { project, concept: output_json };
  });

// ============ Create video from uploaded media ============

const FromMediaInput = z.object({
  instructions: z.string().min(2).max(2000),
  template: z.string().max(80).default(""),
  platform: z.enum(["tiktok", "instagram_reel", "youtube_short", "facebook_reel", "youtube_long"]),
  format: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  mediaUrls: z.array(z.string().url()).min(1).max(20),
  clientId: z.string().uuid().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
});

export const buildVideoFromMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FromMediaInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const brand = await loadBrand(supabase, data.clientId);

    const sys = `You are a video editor. Given a set of uploaded media assets (referenced by index), produce a finished video plan as JSON:
{"title":string,"hook":string,"script":string,"cta":string,"music_vibe":string,"scenes":[{"scene_number":number,"asset_index":number,"visual":string,"on_screen_text":string,"voiceover":string,"shot_type":string,"duration_seconds":number,"asset_needed":string}]}
asset_index references the position (1-based) in the uploaded media list. Reuse assets across scenes if needed.`;

    const user = `Template: ${data.template || "auto"}
Platform: ${data.platform} (${data.format})
Instructions: ${data.instructions}
Uploaded media (${data.mediaUrls.length} assets): ${data.mediaUrls.map((u, i) => `${i + 1}: ${u}`).join("\n")}${brandContext(brand)}`;

    const raw = await callAI(sys, user, true);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned malformed plan");
      parsed = JSON.parse(m[0]);
    }
    const scenes: StoryboardScene[] = Array.isArray(parsed.scenes)
      ? parsed.scenes.slice(0, 20).map((s: any, i: number) => ({
          scene_number: Number(s.scene_number) || i + 1,
          visual: String(s.visual || "").slice(0, 500),
          voiceover: String(s.voiceover || "").slice(0, 500),
          on_screen_text: String(s.on_screen_text || "").slice(0, 200),
          shot_type: String(s.shot_type || "").slice(0, 60),
          duration_seconds: Math.min(60, Math.max(1, Number(s.duration_seconds) || 4)),
          asset_needed: data.mediaUrls[Math.max(0, (Number(s.asset_index) || 1) - 1)] || "",
        }))
      : [];

    const output_json = {
      title: String(parsed.title || data.instructions.slice(0, 80)),
      hook: String(parsed.hook || "").slice(0, 400),
      script: String(parsed.script || "").slice(0, 5000),
      cta: String(parsed.cta || "").slice(0, 200),
      music_vibe: String(parsed.music_vibe || "").slice(0, 200),
      format: data.format,
      template: data.template,
      media_urls: data.mediaUrls,
      scenes,
    };

    const { data: project, error: projErr } = await supabase
      .from("video_projects")
      .insert({
        user_id: userId,
        client_id: data.clientId || null,
        campaign_id: data.campaignId || null,
        type: "from_media",
        platform: data.platform,
        title: output_json.title,
        inputs: {
          instructions: data.instructions,
          template: data.template,
          format: data.format,
          media_urls: data.mediaUrls,
        },
        output: output_json.script,
        output_json,
        status: "draft",
      })
      .select()
      .single();
    if (projErr) throw new Error(projErr.message);

    if (scenes.length) {
      await supabase.from("video_storyboards").insert(
        scenes.map((s) => ({
          user_id: userId,
          project_id: project.id,
          scene_number: s.scene_number,
          visual: s.visual,
          voiceover: s.voiceover,
          on_screen_text: s.on_screen_text,
          shot_type: s.shot_type,
          duration_seconds: s.duration_seconds,
          asset_needed: s.asset_needed,
        })),
      );
    }

    return { project, concept: output_json };
  });
