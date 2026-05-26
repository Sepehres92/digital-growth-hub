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
    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

const SnippetInput = z.object({
  kind: z.enum(["caption", "hashtags", "cta", "video_title", "seo_description", "thumbnail_prompt"]),
  platform: z.string().max(40).default(""),
  topic: z.string().max(800).default(""),
  tone: z.string().max(40).default("Professional"),
  audience: z.string().max(200).default(""),
});

const PROMPTS: Record<string, (i: z.infer<typeof SnippetInput>) => { sys: string; user: string }> = {
  caption: (i) => ({
    sys: "You write engaging short-form social media captions. Output the caption only, no preamble, no quotes.",
    user: `Write a ${i.platform || "social media"} caption.\nTopic: ${i.topic}\nTone: ${i.tone}\nAudience: ${i.audience || "general"}\nKeep under 220 characters when possible. Add 1-2 emojis if it fits the tone.`,
  }),
  hashtags: (i) => ({
    sys: "You generate effective social media hashtags. Output a single line of 12 hashtags separated by spaces, each starting with #, lowercase, no commentary.",
    user: `Topic: ${i.topic}\nPlatform: ${i.platform}\nAudience: ${i.audience}`,
  }),
  cta: (i) => ({
    sys: "You write punchy CTAs (call-to-action) for social posts. Output ONE CTA line, no quotes, no preamble. Max 8 words.",
    user: `Topic: ${i.topic}\nTone: ${i.tone}\nPlatform: ${i.platform}`,
  }),
  video_title: (i) => ({
    sys: "You write click-worthy video titles. Output ONE title, no quotes, no preamble. Max 70 characters.",
    user: `Video about: ${i.topic}\nPlatform: ${i.platform || "YouTube"}\nTone: ${i.tone}`,
  }),
  seo_description: (i) => ({
    sys: "You write SEO descriptions optimised for video / blog discoverability. Output the description only, 140-160 characters, no preamble.",
    user: `Subject: ${i.topic}\nAudience: ${i.audience}`,
  }),
  thumbnail_prompt: (i) => ({
    sys: "You write detailed prompts for AI image generators that produce eye-catching thumbnails. Output the prompt only, single paragraph, no preamble.",
    user: `Video / post topic: ${i.topic}\nPlatform: ${i.platform || "YouTube"}\nTone: ${i.tone}`,
  }),
};

export const generateSnippet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SnippetInput.parse(d))
  .handler(async ({ data }) => {
    const p = PROMPTS[data.kind](data);
    const text = await callAI(p.sys, p.user);
    return { text: text.trim() };
  });

const PlanInput = z.object({
  businessType: z.string().min(2).max(200),
  goal: z.string().min(2).max(300),
  postsPerWeek: z.number().int().min(1).max(21),
  platforms: z.array(z.enum(["instagram", "facebook", "x", "tiktok", "youtube"])).min(1).max(5),
  tone: z.string().max(40).default("Professional"),
  audience: z.string().max(300).default(""),
  startDate: z.string().optional(),
});

export type PlannedPost = {
  date: string; // ISO date
  hour: number; // 0-23
  platform: string;
  category: string;
  caption: string;
  hashtags: string;
  cta: string;
  idea: string;
};

export const generateContentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const start = data.startDate ? new Date(data.startDate) : new Date();
    const startIso = start.toISOString().slice(0, 10);
    const totalPosts = Math.min(data.postsPerWeek * 4, 60);

    const sys = `You are a senior social-media strategist. You output ONLY valid JSON matching this TypeScript type:
{"posts":[{"date":"YYYY-MM-DD","hour":number,"platform":"instagram|facebook|x|tiktok|youtube","category":string,"caption":string,"hashtags":string,"cta":string,"idea":string}]}
Captions: under 220 chars. Hashtags: single line, 8-12 tags starting with #. CTA: max 8 words. Idea: short content idea (max 25 words). Spread posts across the 30 days starting at the provided start date. Distribute across the requested platforms in a balanced way.`;

    const user = `Build a 30-day content plan.
Business type: ${data.businessType}
Goal: ${data.goal}
Tone: ${data.tone}
Audience: ${data.audience || "general"}
Platforms: ${data.platforms.join(", ")}
Total posts: ${totalPosts} (~${data.postsPerWeek}/week)
Start date: ${startIso}
Pick best posting hours for each platform (Instagram: 11, Facebook: 13, X: 9, TikTok: 19, YouTube: 17).`;

    const raw = await callAI(sys, user, true);
    let parsed: { posts: PlannedPost[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON object from the text
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned malformed plan");
      parsed = JSON.parse(m[0]);
    }
    if (!parsed?.posts?.length) throw new Error("AI returned no posts");
    // Validate / clamp each post
    const out: PlannedPost[] = parsed.posts.slice(0, 60).map((p) => ({
      date: String(p.date || startIso).slice(0, 10),
      hour: Math.min(23, Math.max(0, Number(p.hour) || 12)),
      platform: ["instagram", "facebook", "x", "tiktok", "youtube"].includes(p.platform)
        ? p.platform
        : data.platforms[0],
      category: String(p.category || "General").slice(0, 60),
      caption: String(p.caption || "").slice(0, 600),
      hashtags: String(p.hashtags || "").slice(0, 400),
      cta: String(p.cta || "").slice(0, 80),
      idea: String(p.idea || "").slice(0, 300),
    }));
    return { posts: out };
  });
