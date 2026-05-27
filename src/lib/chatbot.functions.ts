import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  clientId: z.string().uuid().nullable().optional(),
  contextPage: z.string().max(120).optional(),
  attachments: z
    .array(z.object({ url: z.string().url(), name: z.string().max(200), type: z.string().max(80) }))
    .max(5)
    .optional(),
});

// Tables/fields the chatbot is NEVER allowed to read, regardless of settings.
// Kept as a documented constant so reviewers can audit the boundary at a glance.
const FORBIDDEN_SOURCES = [
  "chat_messages", "chat_channels", "chat_channel_members", "chat_audit_log", // internal team chat
  "audit_logs", // security logs
  "user_roles", // admin/role data
  "social_accounts", // tokens/api keys
  "chatbot_settings", // admin settings
  "profiles", // agency staff profiles
] as const;

// Public-facing post statuses the client is allowed to see.
const PUBLIC_POST_STATUSES = ["approved", "scheduled", "published"];

async function callAI(systemPrompt: string, history: Array<{ role: string; content: string }>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });
  if (r.status === 429) throw new Error("Rate limited, try again shortly");
  if (r.status === 402) throw new Error("AI credits exhausted");
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  const j = await r.json();
  return String(j.choices?.[0]?.message?.content ?? "").trim();
}

// Strip private/internal-only fields from a client record before sending to AI.
function publicClientProfile(c: any) {
  if (!c) return null;
  return {
    business_name: c.business_name,
    industry: c.industry,
    website: c.website,
    services: c.services,
    target_audience: c.target_audience,
    brand_voice: c.brand_voice,
    brand_colors: c.brand_colors,
    preferred_tone: c.preferred_tone,
    keywords: c.keywords,
    status: c.status,
  };
}

// Extract "public" notes lines from a free-form notes field.
// Convention: lines starting with [public] are shareable; everything else is internal.
function extractPublicNotes(notes?: string | null) {
  if (!notes) return "";
  return notes
    .split(/\r?\n/)
    .filter((line) => /^\s*\[public\]/i.test(line))
    .map((line) => line.replace(/^\s*\[public\]\s*/i, "- "))
    .join("\n");
}

export const clientChatbotChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load settings (per-client overrides fall back to default)
    const settingsQ = supabase
      .from("chatbot_settings")
      .select("*")
      .eq("user_id", userId);
    const { data: settingsRow } = await (data.clientId
      ? settingsQ.eq("client_id", data.clientId)
      : settingsQ.is("client_id", null)
    ).maybeSingle();
    if (settingsRow && settingsRow.enabled === false) {
      throw new Error("Chatbot is disabled for this client");
    }
    const tone = settingsRow?.tone || "friendly";
    const scopes = (settingsRow?.allow_scopes as Record<string, boolean>) || {
      campaigns: true, calendar: true, posts: true, leads: true, meetings: true, files: true, reports: true,
    };
    const customInstructions = settingsRow?.custom_instructions || "";

    // Load client + scoped data (RLS already restricts to this agency user)
    let client: any = null;
    if (data.clientId) {
      const { data: c } = await supabase.from("clients").select("*").eq("id", data.clientId).maybeSingle();
      client = c;
    }

    const ctxParts: string[] = [];
    if (client) {
      const safe = publicClientProfile(client);
      ctxParts.push("Client profile (public):\n" + JSON.stringify(safe, null, 2));
      const pub = extractPublicNotes(client.notes);
      if (pub) ctxParts.push("Public client notes:\n" + pub);
    }

    const cId = data.clientId;

    if (scopes.campaigns) {
      const q = supabase.from("campaigns").select("name,type,status,goal,start_date,end_date,monthly_budget,results_notes").eq("user_id", userId).order("start_date", { ascending: false }).limit(10);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Campaigns:\n" + rows.map((r: any) => `- ${r.name} [${r.type}/${r.status}] goal=${r.goal ?? "-"} budget=${r.monthly_budget ?? 0} ${r.start_date ?? ""}→${r.end_date ?? ""}`).join("\n"));
    }
    if (scopes.posts) {
      // Only approved / scheduled / published — never drafts or internal review states.
      const q = supabase
        .from("content_posts")
        .select("platform,title,caption,status,scheduled_for,published_at,ai_generated")
        .eq("user_id", userId)
        .in("status", PUBLIC_POST_STATUSES)
        .order("scheduled_for", { ascending: false })
        .limit(20);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Approved / scheduled / published posts:\n" + rows.map((r: any) => `- [${r.status}] ${r.platform} • ${r.title || (r.caption || "").slice(0, 80)} • scheduled=${r.scheduled_for ?? "—"} published=${r.published_at ?? "—"}`).join("\n"));
    }
    if (scopes.calendar) {
      const q = supabase.from("content_calendar").select("calendar_date,platform,status").eq("user_id", userId).order("calendar_date", { ascending: true }).limit(20);
      const { data: rows } = await q;
      if (rows?.length) ctxParts.push("Content calendar:\n" + rows.map((r: any) => `- ${r.calendar_date} ${r.platform} [${r.status}]`).join("\n"));
    }
    if (scopes.leads && !cId) {
      const { data: rows } = await supabase.from("leads").select("name,status,value,source").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (rows?.length) ctxParts.push("Recent leads:\n" + rows.map((r: any) => `- ${r.name} [${r.status}] $${r.value ?? 0} from ${r.source ?? "—"}`).join("\n"));
    }
    if (scopes.meetings) {
      const q = supabase.from("meetings").select("id,title,meeting_date,start_time,status,description").eq("user_id", userId).order("meeting_date", { ascending: false }).limit(8);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) {
        ctxParts.push("Meetings:\n" + rows.map((r: any) => `- ${r.meeting_date} ${r.start_time ?? ""} [${r.status}] ${r.title}`).join("\n"));
        // Meeting summaries — pull the decisions/discussion sections only (no internal notes field)
        const ids = rows.map((r: any) => r.id);
        const { data: notes } = await supabase
          .from("meeting_notes")
          .select("meeting_id,decisions,discussion")
          .in("meeting_id", ids);
        if (notes?.length) {
          ctxParts.push(
            "Meeting summaries:\n" +
              notes
                .map((n: any) => {
                  const m = rows.find((r: any) => r.id === n.meeting_id);
                  const head = m ? `${m.meeting_date} — ${m.title}` : n.meeting_id;
                  const parts = [
                    n.discussion ? `Discussion: ${n.discussion}` : "",
                    n.decisions ? `Decisions: ${n.decisions}` : "",
                  ].filter(Boolean).join(" | ");
                  return `- ${head}: ${parts || "(no summary)"}`;
                })
                .join("\n"),
          );
        }
      }
    }
    if (scopes.files) {
      // Shared client files (uploaded for/by client) — never internal team chat attachments.
      const imgQ = supabase.from("client_images").select("file_name,file_type,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8);
      const { data: imgs } = cId ? await imgQ.eq("client_id", cId) : await imgQ;
      if (imgs?.length) ctxParts.push("Shared files:\n" + imgs.map((r: any) => `- ${r.file_name} (${r.file_type ?? "?"})`).join("\n"));
      const maQ = supabase.from("media_assets").select("name,file_type,tags,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8);
      const { data: ma } = cId ? await maQ.eq("client_id", cId) : await maQ;
      if (ma?.length) ctxParts.push("Shared media assets:\n" + ma.map((r: any) => `- ${r.name} (${r.file_type}) ${r.tags ? `#${r.tags}` : ""}`).join("\n"));
    }
    if (scopes.reports) {
      // "Reports" surface = campaign results summaries (client-visible KPI notes)
      const q = supabase
        .from("campaigns")
        .select("name,status,results_notes,end_date")
        .eq("user_id", userId)
        .not("results_notes", "is", null)
        .order("end_date", { ascending: false })
        .limit(8);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Reports / campaign results:\n" + rows.map((r: any) => `- ${r.name} [${r.status}] ${r.end_date ?? ""}: ${r.results_notes}`).join("\n"));
    }

    // Knowledge base (published only — drafts excluded)
    const { data: kb } = await supabase
      .from("chatbot_kb_articles")
      .select("title,category,body")
      .eq("user_id", userId)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (kb?.length) {
      ctxParts.push("Knowledge base articles:\n" + kb.map((a: any) => `### ${a.title} [${a.category}]\n${a.body}`).join("\n\n"));
    }

    // Load recent chat history + existing lightweight session memory
    const [{ data: history }, { data: convoRow }] = await Promise.all([
      supabase
        .from("chatbot_messages")
        .select("role,content,created_at")
        .eq("conversation_id", data.conversationId)
        .order("created_at", { ascending: true })
        .limit(40),
      supabase
        .from("chatbot_conversations")
        .select("session_memory")
        .eq("id", data.conversationId)
        .maybeSingle(),
    ]);

    const sessionMemory: Record<string, unknown> =
      (convoRow?.session_memory as Record<string, unknown>) || {};

    // Save user message
    const { error: insErr } = await supabase.from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      role: "user",
      content: data.message,
      attachments: data.attachments ?? [],
    });
    if (insErr) throw new Error(insErr.message);

    const memoryBlock = Object.keys(sessionMemory).length
      ? `=== SESSION MEMORY (preferences remembered for this conversation only) ===\n${JSON.stringify(sessionMemory, null, 2)}`
      : "";

    const system = [
      `You are a helpful AI assistant inside a digital marketing agency's client portal. Tone: ${tone}.`,
      "You answer questions about the client using ONLY the data in the CONTEXT block below.",
      "Allowed topics: client profile, campaigns, content calendar, approved/scheduled/published posts, meeting summaries, public client notes, shared files, reports, knowledge base.",
      `FORBIDDEN — never reveal, reference, or speculate about: internal team chat, private team notes, draft posts, admin settings, billing internals, API keys / tokens / secrets, other clients' data, security/audit logs, user roles. (Source tables blocked: ${FORBIDDEN_SOURCES.join(", ")}.)`,
      "If a user asks for forbidden information, politely decline and offer to escalate to their account manager via a support ticket.",
      "If the answer isn't in the context, say you don't have that information and offer to escalate.",
      "Explain marketing concepts simply when asked. Be concise. Use bullet points and markdown when helpful.",
      'Always end answers that involve marketing decisions, billing, legal, or account changes with: "Note: please confirm with your account manager before acting."',
      "",
      "SESSION MEMORY RULES:",
      "- Use SESSION MEMORY to recall the user's stated preferences (preferred name, tone, language, topics of interest, reporting cadence, shorthand they use).",
      "- At the very end of EVERY reply, append a single line in this exact format and nothing after it:",
      "  <memory>{\"preferred_name\":\"...\",\"tone\":\"...\",\"language\":\"...\",\"interests\":[\"...\"],\"notes\":\"...\"}</memory>",
      "- Include ONLY fields you are confident about; omit unknown ones. Keep the JSON under 500 characters.",
      "- Memory MUST contain only user-stated preferences. Never put private client data, campaign numbers, secrets, or info from forbidden sources in memory.",
      "- The <memory> line is stripped before the user sees the message, so do not reference it in your prose.",
      customInstructions ? `Custom instructions: ${customInstructions}` : "",
      "",
      memoryBlock,
      "=== CONTEXT ===",
      ctxParts.join("\n\n") || "(no context loaded)",
    ].filter(Boolean).join("\n");

    const convo = [
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    let rawReply = "";
    try {
      rawReply = await callAI(system, convo);
    } catch (e: any) {
      rawReply = `I couldn't reach the AI right now (${e?.message || "unknown error"}). You can create a support ticket and the team will follow up.`;
    }

    // Extract <memory>{...}</memory> tail, merge into session_memory, strip from reply
    let updatedMemory = sessionMemory;
    const memMatch = rawReply.match(/<memory>([\s\S]*?)<\/memory>\s*$/i);
    if (memMatch) {
      try {
        const parsed = JSON.parse(memMatch[1].trim());
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const merged: Record<string, unknown> = { ...sessionMemory };
          for (const [k, v] of Object.entries(parsed)) {
            if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
            merged[k] = v;
          }
          // Cap size to keep memory lightweight
          const serialized = JSON.stringify(merged);
          if (serialized.length <= 2000) updatedMemory = merged;
        }
      } catch {
        // ignore malformed memory tag
      }
    }
    const reply = rawReply.replace(/\s*<memory>[\s\S]*?<\/memory>\s*$/i, "").trim();

    await supabase.from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
      attachments: [],
    });
    await supabase
      .from("chatbot_conversations")
      .update({
        updated_at: new Date().toISOString(),
        context_page: data.contextPage ?? null,
        session_memory: updatedMemory,
      })
      .eq("id", data.conversationId);

    return { reply };
  });
