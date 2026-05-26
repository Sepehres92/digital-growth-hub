import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  RightsAckSchema,
  PublishAckSchema,
  type AuditAction,
  type AuditResourceType,
} from "@/lib/video-safety";

async function logAudit(
  supabase: any,
  userId: string,
  args: {
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string | null;
    videoProjectId?: string | null;
    details?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from("video_audit_log").insert({
      user_id: userId,
      action: args.action,
      resource_type: args.resourceType,
      resource_id: args.resourceId ?? null,
      video_project_id: args.videoProjectId ?? null,
      details: args.details ?? {},
    });
  } catch {
    // Never fail the primary action because of audit logging.
  }
}

async function recordAck(
  supabase: any,
  userId: string,
  args: {
    resourceType: AuditResourceType | "publish";
    resourceRef: string;
    ack: z.infer<typeof RightsAckSchema>;
  },
) {
  await supabase.from("content_rights_acknowledgements").insert({
    user_id: userId,
    resource_type: args.resourceType,
    resource_ref: args.resourceRef,
    owns_rights: args.ack.ownsRights,
    music_licensed: args.ack.musicLicensed,
    no_celebrity_likeness: args.ack.noCelebrityLikeness,
    no_fake_endorsement: args.ack.noFakeEndorsement,
    no_misleading_claims: args.ack.noMisleadingClaims,
    human_reviewed: args.ack.humanReviewed,
    notes: args.ack.notes,
  });
}


const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";
const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
const OPENAI_BASE = "https://api.openai.com/v1";

async function callAIJson<T = unknown>(system: string, user: string): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}

// ============ 1. generate-video-script ============

const ScriptInput = z.object({
  clientId: z.string().uuid().nullable().optional(),
  offer: z.string().max(2000).default(""),
  platform: z.string().max(40).default("TikTok"),
  tone: z.string().max(40).default("Energetic"),
  goal: z.string().max(200).default("Drive sales"),
  duration: z.number().int().min(5).max(180).default(30),
});

export const generateVideoScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScriptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let brand = "";
    if (data.clientId) {
      const { data: c } = await supabase
        .from("clients")
        .select("business_name,industry,services,brand_voice,target_audience")
        .eq("id", data.clientId)
        .maybeSingle();
      if (c) {
        brand = `\nClient: ${c.business_name ?? ""} | ${c.industry ?? ""} | Services: ${c.services ?? ""} | Voice: ${c.brand_voice ?? ""} | Audience: ${c.target_audience ?? ""}`;
      }
    }
    const sys =
      "You are a short-form video strategist. Return JSON with keys: hook (string), script (string with [HOOK]/[BODY]/[CTA] sections), cta (string), scenes (array of {scene_number,visual,onscreen_text,vo} objects, 3-6 items), caption (string under 220 chars), hashtags (array of 8-15 strings starting with #).";
    const user = `Platform: ${data.platform}\nGoal: ${data.goal}\nOffer: ${data.offer}\nTone: ${data.tone}\nDuration: ${data.duration}s${brand}`;
    return callAIJson<{
      hook: string;
      script: string;
      cta: string;
      scenes: Array<{ scene_number: number; visual: string; onscreen_text: string; vo: string }>;
      caption: string;
      hashtags: string[];
    }>(sys, user);
  });

// ============ 2. generate-video-from-prompt (Runway) ============

const PromptInput = z.object({
  videoProjectId: z.string().uuid(),
  prompt: z.string().min(3).max(2000),
  style: z.string().max(60).default("cinematic"),
  duration: z.union([z.literal(5), z.literal(10)]).default(5),
  format: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  promptImageUrl: z.string().url().optional(),
});

function ratioForFormat(f: "9:16" | "16:9" | "1:1") {
  if (f === "16:9") return "1280:720";
  if (f === "1:1") return "960:960";
  return "720:1280";
}

export const generateVideoFromPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PromptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) throw new Error("RUNWAYML_API_SECRET not configured");

    const useImage = !!data.promptImageUrl;
    const endpoint = useImage ? "/image_to_video" : "/text_to_video";
    const body: Record<string, unknown> = {
      model: useImage ? "gen3a_turbo" : "gen3a_turbo",
      promptText: `${data.prompt}. Style: ${data.style}.`,
      duration: data.duration,
      ratio: ratioForFormat(data.format),
    };
    if (useImage) body.promptImage = data.promptImageUrl;

    const res = await fetchWithRetry(`${RUNWAY_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": RUNWAY_VERSION,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Runway error ${res.status}: ${text.slice(0, 300)}`);
    }
    const task = (await res.json()) as { id: string };

    const { data: render, error } = await supabase
      .from("video_renders")
      .insert({
        user_id: userId,
        video_project_id: data.videoProjectId,
        render_url: `runway://${task.id}`,
        render_status: "processing",
        export_format: "mp4",
        platform: data.format,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { renderId: render.id, taskId: task.id, status: "processing" as const };
  });

// ============ Poll render status (used by UI to track progress) ============

const PollInput = z.object({ renderId: z.string().uuid() });

export const checkRenderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PollInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) throw new Error("RUNWAYML_API_SECRET not configured");

    const { data: render, error } = await supabase
      .from("video_renders")
      .select("*")
      .eq("id", data.renderId)
      .eq("user_id", userId)
      .single();
    if (error || !render) throw new Error("Render not found");
    if (render.render_status === "completed" || render.render_status === "failed") {
      return { status: render.render_status, url: render.render_url, progress: 100 };
    }
    const taskId = render.render_url.startsWith("runway://")
      ? render.render_url.slice("runway://".length)
      : null;
    if (!taskId) return { status: render.render_status, url: render.render_url, progress: 50 };

    const res = await fetchWithRetry(`${RUNWAY_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "X-Runway-Version": RUNWAY_VERSION },
    });
    if (!res.ok) throw new Error(`Runway poll failed: ${res.status}`);
    const task = (await res.json()) as {
      status: string;
      output?: string[];
      progress?: number;
      failure?: string;
    };

    if (task.status === "SUCCEEDED" && task.output?.[0]) {
      const remoteUrl = task.output[0];
      // Download and upload to private storage
      let storedUrl = remoteUrl;
      try {
        const vid = await fetch(remoteUrl);
        if (vid.ok) {
          const bytes = new Uint8Array(await vid.arrayBuffer());
          const path = `${userId}/${render.video_project_id}/${render.id}.mp4`;
          const up = await supabase.storage.from("video-assets").upload(path, bytes, {
            contentType: "video/mp4",
            upsert: true,
          });
          if (!up.error) {
            const { data: signed } = await supabase.storage
              .from("video-assets")
              .createSignedUrl(path, 60 * 60 * 24 * 7);
            if (signed?.signedUrl) storedUrl = signed.signedUrl;
          }
        }
      } catch {
        // fallback to remote URL
      }
      await supabase
        .from("video_renders")
        .update({ render_status: "completed", render_url: storedUrl })
        .eq("id", render.id);
      return { status: "completed" as const, url: storedUrl, progress: 100 };
    }
    if (task.status === "FAILED") {
      await supabase
        .from("video_renders")
        .update({ render_status: "failed", render_url: task.failure ?? "failed" })
        .eq("id", render.id);
      return { status: "failed" as const, url: "", progress: 0, error: task.failure };
    }
    return {
      status: "processing" as const,
      url: "",
      progress: typeof task.progress === "number" ? Math.round(task.progress * 100) : 25,
    };
  });

// ============ 3. render-video-template ============

const RenderTemplateInput = z.object({
  videoProjectId: z.string().uuid(),
  template: z.string().max(60).default("standard"),
  format: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: z.string().url(),
        duration: z.number().min(0.5).max(30).default(3),
      }),
    )
    .min(1)
    .max(20),
  textOverlays: z
    .array(
      z.object({
        text: z.string().max(200),
        start: z.number().min(0),
        end: z.number().min(0),
      }),
    )
    .default([]),
  subtitles: z
    .array(
      z.object({
        text: z.string().max(500),
        start: z.number().min(0),
        end: z.number().min(0),
      }),
    )
    .default([]),
  musicUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

export const renderVideoTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RenderTemplateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) throw new Error("RUNWAYML_API_SECRET not configured");

    // Runway Gen-3 is generation-based; template composition uses the first
    // media asset as a seed image plus an instruction describing overlays/music.
    const seed = data.media.find((m) => m.type === "image") ?? data.media[0];
    const overlaySummary = data.textOverlays.map((t) => `"${t.text}"`).join(", ");
    const subtitleSummary = data.subtitles
      .slice(0, 3)
      .map((s) => `"${s.text}"`)
      .join(" | ");
    const prompt = [
      `Template: ${data.template}.`,
      data.logoUrl ? "Brand logo visible bottom-right." : "",
      overlaySummary ? `On-screen text: ${overlaySummary}.` : "",
      subtitleSummary ? `Captions: ${subtitleSummary}` : "",
      data.musicUrl ? "Energetic background music pacing." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const body = {
      model: "gen3a_turbo",
      promptImage: seed.url,
      promptText: prompt || "Cinematic promotional clip",
      duration: 5,
      ratio: ratioForFormat(data.format),
    };

    const res = await fetchWithRetry(`${RUNWAY_BASE}/image_to_video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": RUNWAY_VERSION,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Runway error ${res.status}: ${text.slice(0, 300)}`);
    }
    const task = (await res.json()) as { id: string };

    const { data: render, error } = await supabase
      .from("video_renders")
      .insert({
        user_id: userId,
        video_project_id: data.videoProjectId,
        render_url: `runway://${task.id}`,
        render_status: "processing",
        export_format: "mp4",
        platform: data.format,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { renderId: render.id, taskId: task.id, status: "processing" as const };
  });

// ============ 4. generate-subtitles (Whisper) ============

const SubtitlesInput = z.object({
  videoProjectId: z.string().uuid(),
  audioUrl: z.string().url(),
  language: z.string().max(10).optional(),
});

type WhisperWord = { word: string; start: number; end: number };
type WhisperSegment = { text: string; start: number; end: number; words?: WhisperWord[] };
type WhisperResponse = { text?: string; segments?: WhisperSegment[]; language?: string };

export const generateSubtitles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubtitlesInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    // Download source then forward as multipart to Whisper
    const src = await fetchWithRetry(data.audioUrl, {});
    if (!src.ok) throw new Error(`Could not fetch source media: ${src.status}`);
    const blob = await src.blob();
    const filename = data.audioUrl.split("/").pop()?.split("?")[0] || "audio.mp3";

    const fd = new FormData();
    fd.append("file", blob, filename);
    fd.append("model", "whisper-1");
    fd.append("response_format", "verbose_json");
    fd.append("timestamp_granularities[]", "segment");
    if (data.language) fd.append("language", data.language);

    const res = await fetchWithRetry(`${OPENAI_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Whisper error ${res.status}: ${text.slice(0, 300)}`);
    }
    const out = (await res.json()) as WhisperResponse;
    const segments = out.segments ?? [];

    // Replace existing subtitles for this project
    await supabase.from("video_subtitles").delete().eq("video_project_id", data.videoProjectId);

    if (segments.length > 0) {
      const rows = segments.map((s) => ({
        user_id: userId,
        video_project_id: data.videoProjectId,
        subtitle_text: s.text.trim(),
        start_time: s.start,
        end_time: s.end,
      }));
      const { error } = await supabase.from("video_subtitles").insert(rows);
      if (error) throw new Error(error.message);
    }

    return {
      language: out.language ?? data.language ?? null,
      count: segments.length,
      segments: segments.map((s) => ({ text: s.text.trim(), start: s.start, end: s.end })),
    };
  });

// ============ 5. publish-video-post (stub) ============

const PublishInput = z.object({
  videoProjectId: z.string().uuid(),
  renderId: z.string().uuid().optional(),
  platforms: z.array(z.enum(["instagram", "facebook", "tiktok", "youtube", "x"])).min(1),
  caption: z.string().max(2200).default(""),
  scheduledFor: z.string().datetime().optional(),
  calendarEntryId: z.string().uuid().optional(),
});

export const publishVideoPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PublishInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve render URL if provided
    let videoUrl = "";
    if (data.renderId) {
      const { data: r } = await supabase
        .from("video_renders")
        .select("render_url,render_status")
        .eq("id", data.renderId)
        .eq("user_id", userId)
        .maybeSingle();
      if (r) videoUrl = r.render_url;
      if (r && r.render_status !== "completed") {
        throw new Error("Render is not complete yet.");
      }
    }

    // Per-platform stub: log success; real OAuth integrations land later.
    const results = data.platforms.map((p) => ({
      platform: p,
      status: "queued" as const,
      message: `Publishing to ${p} is stubbed. Connect ${p} OAuth to enable live posting.`,
      videoUrl,
    }));

    // Update content_calendar entry status if provided
    if (data.calendarEntryId) {
      await supabase
        .from("content_calendar")
        .update({ status: data.scheduledFor ? "scheduled" : "published" })
        .eq("id", data.calendarEntryId)
        .eq("user_id", userId);
    }

    return {
      ok: true,
      scheduled: !!data.scheduledFor,
      scheduledFor: data.scheduledFor ?? null,
      results,
    };
  });
