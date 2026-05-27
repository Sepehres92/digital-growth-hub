import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(system: string, user: string, asJson = true): Promise<string> {
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
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T {
  try { return JSON.parse(raw) as T; } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI returned malformed JSON");
    return JSON.parse(m[0]) as T;
  }
}

// ============ INTAKE ============
const SeoIntake = z.object({
  module: z.literal("seo"),
  clientId: z.string().uuid().optional().nullable(),
  businessName: z.string().min(1).max(200),
  websiteUrl: z.string().max(400).default(""),
  location: z.string().max(200).default(""),
  services: z.string().max(800).default(""),
  targetCustomer: z.string().max(400).default(""),
  targetKeywords: z.string().max(800).default(""),
  competitors: z.string().max(800).default(""),
  monthlyBudget: z.number().min(0).default(0),
  primaryGoal: z.string().max(120).default("leads"),
  seoScope: z.enum(["local", "national", "ecommerce"]).default("local"),
});

const PpcIntake = z.object({
  module: z.literal("ppc"),
  clientId: z.string().uuid().optional().nullable(),
  businessName: z.string().min(1).max(200),
  websiteUrl: z.string().max(400).default(""),
  location: z.string().max(200).default(""),
  services: z.string().max(800).default(""),
  monthlyBudget: z.number().min(0).default(0),
  idealCostPerLead: z.number().min(0).optional(),
  platforms: z.array(z.enum(["google_ads", "meta_ads", "youtube_ads", "tiktok_ads"])).min(1),
  existingLandingPages: z.string().max(800).default(""),
  conversionGoal: z.enum(["calls", "forms", "purchases", "bookings"]).default("forms"),
  offers: z.string().max(800).default(""),
  primaryGoal: z.string().max(120).default("leads"),
});

const Intake = z.discriminatedUnion("module", [SeoIntake, PpcIntake]);

export const saveSeoPpcIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Intake.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const base = {
      user_id: userId,
      client_id: data.clientId ?? null,
      module: data.module,
      business_name: data.businessName,
      website_url: data.websiteUrl,
      location: data.location,
      services: data.services,
      monthly_budget: data.monthlyBudget,
      primary_goal: data.primaryGoal,
      status: "intake",
    };
    const row =
      data.module === "seo"
        ? {
            ...base,
            target_customer: data.targetCustomer,
            target_keywords: data.targetKeywords,
            competitors: data.competitors,
            seo_scope: data.seoScope,
          }
        : {
            ...base,
            platforms: data.platforms,
            ideal_cost_per_lead: data.idealCostPerLead ?? null,
            existing_landing_pages: data.existingLandingPages,
            conversion_goal: data.conversionGoal,
            offers: data.offers,
          };
    const { data: inserted, error } = await supabase
      .from("seo_ppc_consultations")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

// ============ RESEARCH ============
const ResearchInput = z.object({ consultationId: z.string().uuid() });

export const researchSeoPpcBestPractices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: c, error } = await supabase
      .from("seo_ppc_consultations")
      .select("*")
      .eq("id", data.consultationId)
      .single();
    if (error || !c) throw new Error("Consultation not found");

    const isSeo = c.module === "seo";
    const sys = isSeo
      ? `You are a senior SEO strategist. Apply current Google Search Central best practices, SEMrush/Ahrefs/HubSpot frameworks. Output ONLY valid JSON:
{
  "summary": string,
  "sources_summary": string,
  "why_chosen": string,
  "risk_level": "low"|"medium"|"high",
  "difficulty": "easy"|"moderate"|"hard",
  "timeline": string,
  "required_assets": string[],
  "testing_period": string,
  "keyword_strategy": { "primary": string[], "secondary": string[], "long_tail": string[] },
  "local_seo": string,
  "on_page": string[],
  "technical_seo": string[],
  "content_topics": string[],
  "service_page_recommendations": string[],
  "gbp_recommendations": string[],
  "backlink_strategy": string[],
  "competitor_gaps": string[],
  "action_plan": { "30_day": string[], "60_day": string[], "90_day": string[] },
  "caveats": string[]
}
Rules: never guarantee rankings, never claim Google partnership, note SEO takes 3-6 months. Caveats must include this.`
      : `You are a senior PPC/SEM strategist. Apply current Google Ads, Meta Ads, YouTube Ads best practices. Output ONLY valid JSON:
{
  "summary": string,
  "sources_summary": string,
  "why_chosen": string,
  "risk_level": "low"|"medium"|"high",
  "difficulty": "easy"|"moderate"|"hard",
  "timeline": string,
  "required_assets": string[],
  "testing_period": string,
  "campaign_structure": string,
  "keyword_groups": { "name": string, "keywords": string[] }[],
  "search_strategy": string,
  "display_strategy": string,
  "youtube_strategy": string,
  "retargeting_strategy": string,
  "negative_keywords": string[],
  "landing_page_recommendations": string[],
  "budget_allocation": { "channel": string, "percent": number, "amount": number }[],
  "ad_copy_ideas": { "headline": string, "description": string }[],
  "ab_testing_plan": string[],
  "conversion_tracking_checklist": string[],
  "caveats": string[]
}
Rules: never guarantee ad results or ROI, require conversion tracking before launch, recommend a 2-4 week testing period, no fake claims.`;

    const userPrompt = isSeo
      ? `Business: ${c.business_name}
Website: ${c.website_url || "n/a"}
Service area: ${c.location || "n/a"}
Services: ${c.services || "n/a"}
Target customer: ${c.target_customer || "n/a"}
Target keywords: ${c.target_keywords || "n/a"}
Competitors: ${c.competitors || "n/a"}
Monthly SEO budget: $${c.monthly_budget ?? 0}
Goal: ${c.primary_goal}
Scope: ${c.seo_scope}`
      : `Business: ${c.business_name}
Website: ${c.website_url || "n/a"}
Location target: ${c.location || "n/a"}
Promoting: ${c.services || "n/a"}
Monthly ad budget: $${c.monthly_budget ?? 0}
Ideal CPL: ${c.ideal_cost_per_lead ?? "n/a"}
Platforms: ${(c.platforms as string[] | null)?.join(", ") || "n/a"}
Existing landing pages: ${c.existing_landing_pages || "none"}
Conversion goal: ${c.conversion_goal}
Offers: ${c.offers || "n/a"}
Primary goal: ${c.primary_goal}`;

    const raw = await callAI(sys, userPrompt, true);
    const recommendations = parseJson<Record<string, unknown>>(raw);

    await supabase
      .from("seo_ppc_consultations")
      .update({ recommendations, status: "recommended" })
      .eq("id", c.id);

    return { recommendations };
  });

// ============ EXECUTE ============
const ExecuteInput = z.object({
  consultationId: z.string().uuid(),
  mode: z.enum(["best_practices", "customized"]),
  customizations: z.record(z.string(), z.unknown()).optional(),
  requireApproval: z.boolean().default(true),
});

export const executeSeoPpcStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExecuteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c, error } = await supabase
      .from("seo_ppc_consultations")
      .select("*")
      .eq("id", data.consultationId)
      .single();
    if (error || !c) throw new Error("Consultation not found");
    if (!c.recommendations) throw new Error("Run research first.");

    const isSeo = c.module === "seo";
    const recs = c.recommendations as Record<string, unknown>;
    const startIso = new Date().toISOString().slice(0, 10);

    // Create campaign
    const { data: camp, error: campErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        client_id: c.client_id,
        name: `${isSeo ? "SEO" : "PPC"} Strategy — ${c.business_name}`,
        type: isSeo ? "seo" : "ppc",
        status: "active",
        goal: c.primary_goal,
        monthly_budget: c.monthly_budget ?? 0,
        start_date: startIso,
        results_notes: `Generated by AI ${isSeo ? "SEO" : "PPC"} Consultant (${data.mode}).`,
      })
      .select("id")
      .single();
    if (campErr) throw new Error(campErr.message);

    // Build task list from recommendations
    const tasks: { title: string; notes?: string; priority?: string }[] = [];
    if (isSeo) {
      const plan = (recs.action_plan ?? {}) as Record<string, string[]>;
      (plan["30_day"] ?? []).forEach((t) => tasks.push({ title: `[30-day] ${t}`, priority: "high" }));
      (plan["60_day"] ?? []).forEach((t) => tasks.push({ title: `[60-day] ${t}`, priority: "medium" }));
      (plan["90_day"] ?? []).forEach((t) => tasks.push({ title: `[90-day] ${t}`, priority: "medium" }));
      ((recs.on_page as string[]) ?? []).forEach((t) => tasks.push({ title: `On-page: ${t}`, priority: "medium" }));
      ((recs.technical_seo as string[]) ?? []).forEach((t) => tasks.push({ title: `Technical SEO: ${t}`, priority: "high" }));
      ((recs.gbp_recommendations as string[]) ?? []).forEach((t) => tasks.push({ title: `GBP: ${t}`, priority: "medium" }));
      ((recs.backlink_strategy as string[]) ?? []).forEach((t) => tasks.push({ title: `Backlinks: ${t}`, priority: "low" }));
    } else {
      ((recs.landing_page_recommendations as string[]) ?? []).forEach((t) =>
        tasks.push({ title: `Landing page: ${t}`, priority: "high" }),
      );
      ((recs.conversion_tracking_checklist as string[]) ?? []).forEach((t) =>
        tasks.push({ title: `Tracking: ${t}`, priority: "high" }),
      );
      ((recs.ab_testing_plan as string[]) ?? []).forEach((t) =>
        tasks.push({ title: `A/B test: ${t}`, priority: "medium" }),
      );
      const groups = (recs.keyword_groups as { name: string; keywords: string[] }[]) ?? [];
      groups.forEach((g) =>
        tasks.push({
          title: `Build ad group: ${g.name}`,
          notes: `Keywords: ${(g.keywords ?? []).join(", ")}`,
          priority: "high",
        }),
      );
    }

    if (tasks.length > 0) {
      await supabase.from("tasks").insert(
        tasks.slice(0, 80).map((t) => ({
          user_id: userId,
          client_id: c.client_id,
          campaign_id: camp.id,
          title: t.title.slice(0, 200),
          notes: t.notes ?? null,
          status: "todo",
          priority: (t.priority ?? "medium") as "low" | "medium" | "high",
        })),
      );
    }

    // For SEO: drop content topics into content_calendar via content_posts (drafts)
    if (isSeo) {
      const topics = ((recs.content_topics as string[]) ?? []).slice(0, 12);
      if (topics.length > 0) {
        const postRows = topics.map((title, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i * 3);
          return {
            user_id: userId,
            client_id: c.client_id,
            campaign_id: camp.id,
            platform: "blog",
            title,
            caption: title,
            scheduled_for: d.toISOString(),
            status: data.requireApproval ? "pending_approval" : "draft",
            ai_generated: true,
          };
        });
        const { data: posts } = await supabase
          .from("content_posts")
          .insert(postRows)
          .select("id, scheduled_for, platform");
        if (posts) {
          await supabase.from("content_calendar").insert(
            posts.map((p) => ({
              user_id: userId,
              post_id: p.id,
              calendar_date: String(p.scheduled_for).slice(0, 10),
              platform: p.platform,
              status: data.requireApproval ? "pending_approval" : "scheduled",
            })),
          );
        }
      }
    } else {
      // For PPC: save ad copy ideas into ai_copies for the AI Writer
      const ideas = ((recs.ad_copy_ideas as { headline: string; description: string }[]) ?? []).slice(0, 20);
      if (ideas.length > 0) {
        await supabase.from("ai_copies").insert(
          ideas.map((a) => ({
            user_id: userId,
            content_type: "ppc_ad",
            variation: "search",
            prompt_inputs: { business: c.business_name, campaign_id: camp.id },
            output: `${a.headline}\n${a.description}`,
          })),
        );
      }
    }

    if (data.requireApproval) {
      await supabase.from("tasks").insert({
        user_id: userId,
        client_id: c.client_id,
        campaign_id: camp.id,
        title: `Review ${isSeo ? "SEO" : "PPC"} strategy for ${c.business_name}`,
        notes: `Consultation: ${c.id}\nCampaign: ${camp.id}`,
        status: "todo",
        priority: "high",
      });
    }

    await supabase
      .from("seo_ppc_consultations")
      .update({
        status: "executed",
        campaign_id: camp.id,
        customizations: data.customizations ?? null,
      })
      .eq("id", c.id);

    return { campaignId: camp.id, tasksCreated: tasks.length };
  });

// ============ HUMAN SPECIALIST ============
const HumanReqInput = z.object({
  consultationId: z.string().uuid(),
  type: z.enum(["free", "paid"]),
  notes: z.string().max(2000).default(""),
});

export const requestSeoPpcSpecialist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HumanReqInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: c } = await supabase
      .from("seo_ppc_consultations")
      .select("id, client_id, business_name, module")
      .eq("id", data.consultationId)
      .single();
    if (!c) throw new Error("Consultation not found");

    if (data.type === "free") {
      const { data: existing } = await supabase
        .from("human_strategy_requests")
        .select("id, free_consultation_used, request_status")
        .eq("user_id", userId)
        .is("price", null);
      const conflict = (existing ?? []).some(
        (r) =>
          r.free_consultation_used ||
          ["pending", "assigned", "scheduled"].includes(String(r.request_status)),
      );
      if (conflict) {
        throw new Error(
          "Your free one-time specialist consultation has already been requested or used. Please book a paid session.",
        );
      }
    }

    // Create meeting placeholder
    const { data: meeting } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        client_id: c.client_id,
        title: `${c.module.toUpperCase()} Specialist Consultation — ${c.business_name}`,
        description: data.notes,
        meeting_date: new Date().toISOString().slice(0, 10),
        status: "scheduled",
        goal: `One-time ${data.type} ${c.module.toUpperCase()} specialist consultation`,
      })
      .select("id")
      .single();

    // Insert human request
    const { data: req, error: reqErr } = await supabase
      .from("human_strategy_requests")
      .insert({
        user_id: userId,
        client_id: c.client_id,
        consultation_id: null,
        request_status: "pending",
        payment_required: data.type === "paid",
        price: data.type === "paid" ? 0 : null,
        meeting_id: meeting?.id ?? null,
      })
      .select("id")
      .single();
    if (reqErr) throw new Error(reqErr.message);

    // Admin task
    await supabase.from("tasks").insert({
      user_id: userId,
      client_id: c.client_id,
      title: `Specialist requested (${data.type}) — ${c.business_name} [${c.module.toUpperCase()}]`,
      notes: data.notes || `From SEO/PPC consultant ${c.id}`,
      status: "todo",
      priority: "high",
    });

    // Team chat notification — best-effort
    try {
      const { data: chan } = await supabase
        .from("chat_channels")
        .select("id")
        .eq("created_by", userId)
        .limit(1)
        .maybeSingle();
      if (chan) {
        await supabase.from("chat_messages").insert({
          channel_id: chan.id,
          user_id: userId,
          content: `🚨 ${data.type === "free" ? "Free" : "Paid"} ${c.module.toUpperCase()} specialist consultation requested for ${c.business_name}.`,
          ai_generated: true,
        });
      }
    } catch {
      /* ignore */
    }

    await supabase
      .from("seo_ppc_consultations")
      .update({ human_request_id: req.id })
      .eq("id", c.id);

    return { requestId: req.id, meetingId: meeting?.id ?? null };
  });
