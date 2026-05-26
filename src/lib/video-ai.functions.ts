import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

const Platform = z.enum(["tiktok", "instagram_reels", "youtube_shorts", "youtube_long", "facebook_reels", "linkedin"]);

const IdeaInput = z.object({
  platform: Platform,
  businessType: z.string().max(200).default(""),
  audience: z.string().max(300).default(""),
  goal: z.string().max(300).default(""),
  offer: z.string().max(300).default(""),
  tone: z.string().max(100).default("engaging"),
  videoLength: z.string().max(40).default("30s"),
  context: z.string().max(2000).default(""),
});

export const generateVideoIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdeaInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are a viral short-form video strategist. Output ONLY valid JSON matching:
{"ideas":[{"title":string,"hook":string,"script":string,"scenes":[{"n":number,"visual":string,"text":string,"voiceover":string}],"cta":string,"caption":string,"hashtags":string}]}
Provide 3 distinct, platform-native ideas. Hooks must grab attention in <3s.`;
    const user = `Platform: ${data.platform}
Business: ${data.businessType}
Audience: ${data.audience}
Goal: ${data.goal}
Offer: ${data.offer}
Tone: ${data.tone}
Length: ${data.videoLength}
Extra: ${data.context}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });

const ShortInput = z.object({
  platform: Platform,
  topic: z.string().min(1).max(500),
  audience: z.string().max(300).default(""),
  tone: z.string().max(100).default("energetic"),
  cta: z.string().max(200).default(""),
});

export const generateShortScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShortInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You write short-form vertical video scripts (15-60s). Output ONLY JSON:
{"hook":string,"main_message":string,"visual_direction":string,"on_screen_text":[string],"voiceover":string,"cta":string}`;
    const user = `Platform: ${data.platform}
Topic: ${data.topic}
Audience: ${data.audience}
Tone: ${data.tone}
CTA: ${data.cta}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });

const LongInput = z.object({
  topic: z.string().min(1).max(500),
  audience: z.string().max(300).default(""),
  duration: z.string().max(40).default("10 minutes"),
  tone: z.string().max(100).default("informative"),
  keywords: z.string().max(500).default(""),
});

export const generateLongScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LongInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You write long-form YouTube scripts. Output ONLY JSON:
{"titles":[string],"thumbnail_ideas":[string],"intro":string,"outline":[{"section":string,"summary":string}],"script_sections":[{"heading":string,"content":string}],"cta":string,"seo_description":string,"tags":[string]}`;
    const user = `Topic: ${data.topic}
Audience: ${data.audience}
Duration: ${data.duration}
Tone: ${data.tone}
Target Keywords: ${data.keywords}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });

const PromptInput = z.object({
  subject: z.string().min(1).max(500),
  style: z.string().max(200).default("cinematic"),
  tool: z.enum(["runway", "pika", "kling", "sora", "luma"]).default("runway"),
  mood: z.string().max(200).default(""),
});

export const generateVideoPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PromptInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are an expert prompt engineer for AI video tools (Runway, Pika, Kling, Sora, Luma). Output ONLY JSON:
{"prompts":[{"scene_prompt":string,"camera_movement":string,"lighting":string,"style":string,"subject":string,"background":string,"duration_seconds":number,"negative_prompt":string}]}
Provide 3 production-ready scene prompts.`;
    const user = `Tool: ${data.tool}
Subject: ${data.subject}
Style: ${data.style}
Mood: ${data.mood}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });

const StoryboardInput = z.object({
  script: z.string().min(10).max(20000),
  sceneCount: z.number().min(2).max(20).default(6),
});

export const generateStoryboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StoryboardInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You convert scripts into shot-by-shot storyboards. Output ONLY JSON:
{"scenes":[{"scene_number":number,"visual":string,"voiceover":string,"on_screen_text":string,"shot_type":string,"duration_seconds":number,"asset_needed":string}]}
Generate exactly ${data.sceneCount} scenes.`;
    const user = `Script:\n${data.script}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });

const RepurposeInput = z.object({
  source: z.string().min(20).max(30000),
  targets: z.array(z.enum(["tiktok", "instagram_reels", "youtube_shorts", "facebook_reels", "linkedin", "email"])).min(1).max(6),
  tone: z.string().max(100).default(""),
});

export const repurposeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RepurposeInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You repurpose long content into platform-native formats. Output ONLY JSON:
{"outputs":[{"format":string,"title":string,"content":string,"hashtags":string,"cta":string}]}
Match each requested format's voice and length. For "email" include subject in title, body in content.`;
    const user = `Targets: ${data.targets.join(", ")}
Tone: ${data.tone}
Source:
${data.source}`;
    const raw = await callAI(sys, user, true);
    return { raw };
  });
