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

const Platforms = z.enum(["instagram", "facebook", "x", "tiktok", "youtube"]);

const IntakeSchema = z.object({
  businessName: z.string().min(1).max(200),
  industry: z.string().min(1).max(200),
  services: z.string().min(1).max(800),
  audience: z.string().min(1).max(400),
  location: z.string().max(200).default(""),
  goal: z.enum(["leads", "sales", "awareness", "engagement", "bookings", "followers"]),
  platforms: z.array(Platforms).min(1).max(5),
  postingFrequency: z.string().max(60).default("3-5/week"),
  brandAssets: z.string().max(800).default(""),
  tone: z.string().max(60).default("Professional"),
  customizeMode: z.boolean().default(false),
});

export type StrategyIntake = z.infer<typeof IntakeSchema>;

export type Recommendations = {
  summary: string;
  posting_frequency: string;
  best_posting_times: Record<string, string>;
  content_types: string[];
  recommended_platforms: string[];
  content_pillars: string[];
  video_image_ratio: string;
  hashtag_strategy: string;
  cta_strategy: string;
  local_seo_tips?: string;
  caveats: string[];
};

// Save intake + return id
const SaveIntakeInput = IntakeSchema.extend({
  clientId: z.string().uuid().optional().nullable(),
});

export const saveConsultationIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveIntakeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Combine services into target_audience description since new schema drops `services`.
    const audienceCombined = `${data.audience}\n\nServices/products: ${data.services}${
      data.brandAssets ? `\n\nBrand notes: ${data.brandAssets}` : ""
    }`;
    const { data: row, error } = await supabase
      .from("strategy_consultations")
      .insert({
        user_id: userId,
        client_id: data.clientId ?? null,
        consultation_type: "ai_only",
        business_name: data.businessName,
        industry: data.industry,
        target_audience: audienceCombined,
        location: data.location,
        business_goal: data.goal,
        selected_platforms: data.platforms,
        preferred_posting_frequency: data.postingFrequency,
        tone: data.tone,
        status: "intake",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

// Research best practices via AI
const ResearchInput = z.object({ consultationId: z.string().uuid() });

export const researchBestPractices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: c, error } = await supabase
      .from("strategy_consultations")
      .select("*")
      .eq("id", data.consultationId)
      .single();
    if (error || !c) throw new Error("Consultation not found");

    const sys = `You are a senior content marketing strategist. Using widely-accepted current social-media and content-marketing best practices (industry benchmarks, platform algorithm guidance, and category norms), produce a recommended strategy.
Output ONLY valid JSON matching:
{
  "summary": string,
  "posting_frequency": string,
  "best_posting_times": { "instagram"?: string, "facebook"?: string, "x"?: string, "tiktok"?: string, "youtube"?: string },
  "content_types": string[],
  "recommended_platforms": string[],
  "content_pillars": string[],
  "video_image_ratio": string,
  "hashtag_strategy": string,
  "cta_strategy": string,
  "local_seo_tips": string,
  "caveats": string[]
}
Rules:
- Recommendations are based on available best practices and may need testing. Include this in caveats.
- Never guarantee results. No "we will 10x your sales" language.
- Keep each string concise (under 280 chars).`;

    const user = `Business: ${c.business_name}
Industry: ${c.industry}
Target audience: ${c.target_audience ?? "n/a"}
Location / service area: ${c.location || "n/a"}
Primary goal: ${c.business_goal ?? "n/a"}
Platforms: ${(c.selected_platforms as string[]).join(", ")}
Desired posting frequency: ${c.preferred_posting_frequency ?? "n/a"}
Tone of voice: ${c.tone ?? "Professional"}`;

    const raw = await callAI(sys, user, true);
    let parsed: Recommendations;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned malformed recommendations");
      parsed = JSON.parse(m[0]);
    }

    // Save into normalized strategy_recommendations table.
    await supabase.from("strategy_recommendations").insert({
      consultation_id: c.id,
      best_practices_summary: parsed.summary,
      recommended_platforms: parsed.recommended_platforms ?? [],
      recommended_posting_frequency: parsed.posting_frequency,
      recommended_content_pillars: parsed.content_pillars ?? [],
      recommended_posting_times: parsed.best_posting_times ?? {},
      recommended_hashtag_strategy: parsed.hashtag_strategy,
      recommended_cta_strategy: parsed.cta_strategy,
      sources_used: { caveats: parsed.caveats ?? [], local_seo_tips: parsed.local_seo_tips ?? "" },
    });

    await supabase
      .from("strategy_consultations")
      .update({ status: "recommended" })
      .eq("id", c.id);

    return { recommendations: parsed };
  });

// Approve / customize + execute -> creates campaign + posts
const ExecuteInput = z.object({
  consultationId: z.string().uuid(),
  mode: z.enum(["best_practices", "customized"]),
  customizations: z
    .object({
      postingFrequency: z.string().max(60).optional(),
      platforms: z.array(Platforms).optional(),
      contentTypes: z.array(z.string()).optional(),
      tone: z.string().max(60).optional(),
      monthlyGoal: z.string().max(300).optional(),
      offer: z.string().max(400).optional(),
      campaignFocus: z.string().max(400).optional(),
      requireApproval: z.boolean().optional(),
    })
    .optional(),
});

export type PlannedPost = {
  date: string;
  hour: number;
  platform: string;
  category: string;
  caption: string;
  hashtags: string;
  cta: string;
  image_prompt: string;
  video_idea: string;
};

export const executeStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExecuteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c, error } = await supabase
      .from("strategy_consultations")
      .select("*")
      .eq("id", data.consultationId)
      .single();
    if (error || !c) throw new Error("Consultation not found");

    const cz = data.customizations ?? {};
    const platforms = (cz.platforms ?? (c.selected_platforms as string[])) as string[];
    const frequency = cz.postingFrequency ?? c.preferred_posting_frequency ?? "5/week";
    const tone = cz.tone ?? c.tone ?? "Professional";
    const requireApproval = cz.requireApproval ?? true;

    // Estimate posts/week from frequency string
    const m = String(frequency).match(/(\d+)/);
    const perWeek = Math.min(21, Math.max(3, m ? parseInt(m[1], 10) : 5));
    const totalPosts = Math.min(perWeek * 4, 60);
    const startIso = new Date().toISOString().slice(0, 10);

    const sys = `You are an elite content strategist executing an approved 30-day strategy. Output ONLY valid JSON:
{"posts":[{"date":"YYYY-MM-DD","hour":number,"platform":"instagram|facebook|x|tiktok|youtube","category":string,"caption":string,"hashtags":string,"cta":string,"image_prompt":string,"video_idea":string}]}
Rules:
- caption under 220 chars, strong hook
- hashtags single line, 8-12 tags starting with #, lowercase
- cta max 8 words
- image_prompt: 1-2 sentences for an AI image generator
- video_idea: max 25 words
- Spread posts across 30 days from startDate. Balance the requested platforms. Best hours: instagram 11, facebook 13, x 9, tiktok 19, youtube 17.
- Recommendations are guidance not guarantees. No fake claims.`;

    const user = `Business: ${c.business_name}
Industry: ${c.industry}
Target audience: ${c.target_audience ?? "n/a"}
Location: ${c.location || "n/a"}
Goal: ${c.business_goal ?? "n/a"}
Tone: ${tone}
Platforms: ${platforms.join(", ")}
Posts per week: ${perWeek}
Total posts: ${totalPosts}
Start date: ${startIso}
Content types: ${(cz.contentTypes ?? []).join(", ") || "mix of educational, social proof, behind-the-scenes, offers"}
Offer: ${cz.offer ?? "n/a"}
Campaign focus: ${cz.campaignFocus ?? "n/a"}`;

    const raw = await callAI(sys, user, true);
    let parsed: { posts: PlannedPost[] };
    try { parsed = JSON.parse(raw); } catch {
      const mm = raw.match(/\{[\s\S]*\}/);
      if (!mm) throw new Error("AI returned malformed plan");
      parsed = JSON.parse(mm[0]);
    }
    if (!parsed?.posts?.length) throw new Error("AI returned no posts");

    const allowed = ["instagram", "facebook", "x", "tiktok", "youtube"];
    const posts: PlannedPost[] = parsed.posts.slice(0, 60).map((p) => ({
      date: String(p.date || startIso).slice(0, 10),
      hour: Math.min(23, Math.max(0, Number(p.hour) || 12)),
      platform: allowed.includes(p.platform) ? p.platform : platforms[0],
      category: String(p.category || "General").slice(0, 60),
      caption: String(p.caption || "").slice(0, 600),
      hashtags: String(p.hashtags || "").slice(0, 400),
      cta: String(p.cta || "").slice(0, 80),
      image_prompt: String(p.image_prompt || "").slice(0, 600),
      video_idea: String(p.video_idea || "").slice(0, 400),
    }));

    // Create campaign
    const { data: camp, error: campErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        client_id: c.client_id,
        name: `AI Strategy — ${c.business_name}`,
        type: "social_media",
        status: "active",
        goal: c.business_goal ?? null,
        start_date: startIso,
        results_notes: `Generated by AI Strategy Consultant (${data.mode}).`,
      })
      .select("id")
      .single();
    if (campErr) throw new Error(campErr.message);

    // Insert posts into social_posts (draft / pending_approval)
    const status = requireApproval ? "pending_approval" : "draft";
    const rows = posts.map((p) => {
      const scheduled = new Date(`${p.date}T${String(p.hour).padStart(2, "0")}:00:00`);
      return {
        user_id: userId,
        client_id: c.client_id,
        campaign_id: camp.id,
        platform: p.platform,
        caption: p.caption,
        hashtags: p.hashtags,
        cta: p.cta,
        scheduled_at: scheduled.toISOString(),
        status,
        notes: `Category: ${p.category}\nVideo idea: ${p.video_idea}\nImage prompt: ${p.image_prompt}`,
      };
    });
    const { error: postsErr } = await supabase.from("social_posts").insert(rows);
    if (postsErr) throw new Error(postsErr.message);

    // Mirror into generated_strategy_content for the strategy module's record.
    const generatedRows = posts.map((p) => {
      const scheduled = new Date(`${p.date}T${String(p.hour).padStart(2, "0")}:00:00`);
      return {
        consultation_id: c.id,
        client_id: c.client_id,
        campaign_id: camp.id,
        content_type: p.category,
        platform: p.platform,
        title: p.category,
        caption: p.caption,
        hashtags: p.hashtags,
        cta: p.cta,
        image_prompt: p.image_prompt,
        video_script: p.video_idea,
        scheduled_date: scheduled.toISOString(),
        approval_status: (requireApproval ? "pending" : "approved") as "pending" | "approved",
      };
    });
    await supabase.from("generated_strategy_content").insert(generatedRows);

    await supabase
      .from("strategy_consultations")
      .update({ status: "executed" })
      .eq("id", c.id);

    return { campaignId: camp.id, postsCreated: rows.length };
  });

// Human strategist request
const HumanReqInput = z.object({
  consultationId: z.string().uuid(),
  type: z.enum(["free", "paid"]),
  notes: z.string().max(2000).default(""),
  preferredTime: z.string().max(200).default(""),
});

export const requestHumanStrategist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HumanReqInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.type === "free") {
      const { data: existing } = await supabase
        .from("human_strategy_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("free_consultation_used", true)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error(
          "You have already used your free one-time human strategist consultation. Please book a paid consultation instead."
        );
      }
    }

    const { data: c } = await supabase
      .from("strategy_consultations")
      .select("client_id, business_name")
      .eq("id", data.consultationId)
      .single();

    const { data: req, error } = await supabase
      .from("human_strategy_requests")
      .insert({
        user_id: userId,
        client_id: c?.client_id ?? null,
        consultation_id: data.consultationId,
        free_consultation_used: data.type === "free",
        payment_required: data.type === "paid",
        price: data.type === "paid" ? 150 : null,
        request_status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Mark consultation as escalated to human.
    await supabase
      .from("strategy_consultations")
      .update({ consultation_type: "human_requested" })
      .eq("id", data.consultationId);

    // Mirror to tasks for the agency team
    await supabase.from("tasks").insert({
      user_id: userId,
      client_id: c?.client_id ?? null,
      title: `Human strategist requested (${data.type}) — ${c?.business_name ?? "client"}`,
      notes: `Consultation: ${data.consultationId}\nPreferred time: ${data.preferredTime || "n/a"}\nNotes: ${data.notes || "n/a"}`,
      status: "todo",
      priority: "high",
    });

    return { id: req.id };
  });

export const getFreeConsultationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("human_strategy_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("free_consultation_used", true)
      .limit(1);
    return { freeUsed: !!(data && data.length > 0) };
  });
