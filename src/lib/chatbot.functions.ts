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

export const clientChatbotChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load settings (per-client overrides fall back to default)
    const { data: settingsRow } = await supabase
      .from("chatbot_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("client_id", data.clientId ?? null)
      .maybeSingle();
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
      ctxParts.push(
        `Client: ${client.business_name}` +
          (client.industry ? ` (industry: ${client.industry})` : "") +
          (client.target_audience ? `\nAudience: ${client.target_audience}` : "") +
          (client.brand_voice ? `\nBrand voice: ${client.brand_voice}` : "") +
          (client.preferred_tone ? `\nPreferred tone: ${client.preferred_tone}` : ""),
      );
    }

    const cId = data.clientId;

    if (scopes.campaigns) {
      const q = supabase.from("campaigns").select("name,type,status,goal,start_date,end_date,monthly_budget,results_notes").eq("user_id", userId).order("start_date", { ascending: false }).limit(10);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Campaigns:\n" + rows.map((r: any) => `- ${r.name} [${r.type}/${r.status}] goal=${r.goal ?? "-"} budget=${r.monthly_budget ?? 0} ${r.start_date ?? ""}→${r.end_date ?? ""}`).join("\n"));
    }
    if (scopes.posts) {
      const q = supabase.from("content_posts").select("platform,title,caption,status,scheduled_for,ai_generated").eq("user_id", userId).order("scheduled_for", { ascending: false }).limit(15);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Recent/upcoming posts:\n" + rows.map((r: any) => `- [${r.status}] ${r.platform} • ${r.title || (r.caption || "").slice(0, 60)} • ${r.scheduled_for ?? ""}`).join("\n"));
    }
    if (scopes.calendar) {
      const q = supabase.from("content_calendar").select("calendar_date,platform,status").eq("user_id", userId).order("calendar_date", { ascending: true }).limit(15);
      const { data: rows } = await q;
      if (rows?.length) ctxParts.push("Content calendar:\n" + rows.map((r: any) => `- ${r.calendar_date} ${r.platform} [${r.status}]`).join("\n"));
    }
    if (scopes.leads && !cId) {
      const { data: rows } = await supabase.from("leads").select("name,status,value,source").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (rows?.length) ctxParts.push("Recent leads:\n" + rows.map((r: any) => `- ${r.name} [${r.status}] $${r.value ?? 0} from ${r.source ?? "—"}`).join("\n"));
    }
    if (scopes.meetings) {
      const q = supabase.from("meetings").select("title,meeting_date,start_time,status,description").eq("user_id", userId).order("meeting_date", { ascending: false }).limit(8);
      const { data: rows } = cId ? await q.eq("client_id", cId) : await q;
      if (rows?.length) ctxParts.push("Meetings:\n" + rows.map((r: any) => `- ${r.meeting_date} ${r.start_time ?? ""} [${r.status}] ${r.title}`).join("\n"));
    }
    if (scopes.files && cId) {
      const { data: rows } = await supabase.from("client_images").select("file_name,file_type,created_at").eq("user_id", userId).eq("client_id", cId).order("created_at", { ascending: false }).limit(8);
      if (rows?.length) ctxParts.push("Uploaded files:\n" + rows.map((r: any) => `- ${r.file_name} (${r.file_type ?? "?"})`).join("\n"));
    }

    // Knowledge base
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

    // Load recent chat history
    const { data: history } = await supabase
      .from("chatbot_messages")
      .select("role,content,created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    // Save user message
    const { error: insErr } = await supabase.from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      role: "user",
      content: data.message,
      attachments: data.attachments ?? [],
    });
    if (insErr) throw new Error(insErr.message);

    const system = [
      `You are a helpful AI assistant inside a digital marketing agency's client portal. Tone: ${tone}.`,
      "You answer questions about the client's campaigns, content calendar, scheduled posts, leads, meetings, files, and reports.",
      "Only use the data provided below. If you don't have the information, say so and offer to escalate to the agency team.",
      "Never reveal internal team notes, other clients' data, billing internals, or admin-only information.",
      "Explain marketing concepts simply when asked. Be concise. Use bullet points and markdown when helpful.",
      'Always end answers that involve marketing decisions, billing, legal, or account changes with: "Note: please confirm with your account manager before acting."',
      customInstructions ? `Custom instructions: ${customInstructions}` : "",
      "",
      "=== CONTEXT ===",
      ctxParts.join("\n\n") || "(no context loaded)",
    ].filter(Boolean).join("\n");

    const convo = [
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    let reply = "";
    try {
      reply = await callAI(system, convo);
    } catch (e: any) {
      reply = `I couldn't reach the AI right now (${e?.message || "unknown error"}). You can create a support ticket and the team will follow up.`;
    }

    await supabase.from("chatbot_messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      role: "assistant",
      content: reply,
      attachments: [],
    });
    await supabase.from("chatbot_conversations").update({ updated_at: new Date().toISOString(), context_page: data.contextPage ?? null }).eq("id", data.conversationId);

    return { reply };
  });
