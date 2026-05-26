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

const AgendaInput = z.object({
  title: z.string().min(1).max(300),
  goal: z.string().max(600).default(""),
  context: z.string().max(1000).default(""),
});

export const generateAgenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AgendaInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are a meeting facilitator. Output ONLY valid JSON: {"items":[{"topic":string,"owner":string,"time_estimate":number,"priority":"high|medium|low","notes":string}]}. Provide 4-7 agenda items, time_estimate in minutes.`;
    const user = `Meeting: ${data.title}\nGoal: ${data.goal}\nContext: ${data.context}`;
    const raw = await callAI(sys, user, true);
    let parsed: { items: Array<{ topic: string; owner?: string; time_estimate?: number; priority?: string; notes?: string }> };
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned malformed agenda");
      parsed = JSON.parse(m[0]);
    }
    const items = (parsed.items || []).slice(0, 12).map((i) => ({
      topic: String(i.topic || "").slice(0, 200),
      owner: String(i.owner || "").slice(0, 80),
      time_estimate: Math.min(180, Math.max(0, Number(i.time_estimate) || 10)),
      priority: ["high", "medium", "low"].includes(String(i.priority)) ? String(i.priority) : "medium",
      notes: String(i.notes || "").slice(0, 400),
    }));
    return { items };
  });

const NotesInput = z.object({
  notes: z.string().min(5).max(20000),
  kind: z.enum(["summary", "action_items", "followup_email", "task_list"]),
  title: z.string().max(300).default(""),
});

export const processMeetingNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotesInput.parse(d))
  .handler(async ({ data }) => {
    const prompts: Record<string, { sys: string; user: string; json?: boolean }> = {
      summary: {
        sys: "You summarize meeting notes into a concise executive summary (5-8 bullet points). Output plain text.",
        user: `Meeting: ${data.title}\nNotes:\n${data.notes}`,
      },
      action_items: {
        sys: `Extract action items from the meeting notes. Output ONLY JSON: {"items":[{"description":string,"assigned_to":string,"due_date":"YYYY-MM-DD or empty"}]}.`,
        user: `Notes:\n${data.notes}`,
        json: true,
      },
      followup_email: {
        sys: "Write a professional follow-up email summarizing the meeting, key decisions, and next steps. Output plain text email body only.",
        user: `Meeting: ${data.title}\nNotes:\n${data.notes}`,
      },
      task_list: {
        sys: `Convert meeting notes into a task list. Output ONLY JSON: {"tasks":[{"title":string,"priority":"high|medium|low","assigned_to":string}]}.`,
        user: `Notes:\n${data.notes}`,
        json: true,
      },
    };
    const p = prompts[data.kind];
    const text = await callAI(p.sys, p.user, p.json);
    return { text };
  });
