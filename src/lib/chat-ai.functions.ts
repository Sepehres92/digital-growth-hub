import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  channelId: z.string().uuid(),
  action: z.enum(["summarize", "captions", "campaign_ideas", "client_reply", "tasks", "meeting_notes", "calendar"]),
  extra: z.string().max(2000).optional(),
});

async function callAI(systemPrompt: string, userPrompt: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (r.status === 429) throw new Error("Rate limited, try again shortly");
  if (r.status === 402) throw new Error("AI credits exhausted");
  if (!r.ok) throw new Error(`AI error ${r.status}`);
  const j = await r.json();
  return (j.choices?.[0]?.message?.content ?? "").trim();
}

const PROMPTS: Record<z.infer<typeof Input>["action"], string> = {
  summarize: "Summarize the conversation into bullet points covering key decisions, blockers, and next actions.",
  captions: "Generate 3 short social caption options based on the conversation context. Include emojis and hashtags.",
  campaign_ideas: "Propose 3 marketing campaign ideas based on the conversation. Each: name, channel, hook, KPI.",
  client_reply: "Draft a professional client reply addressing the latest message. Friendly, concise, action-oriented.",
  tasks: "Extract action items as a checklist with assignee guesses and due-date hints if mentioned.",
  meeting_notes: "Format as meeting notes: Attendees, Discussion, Decisions, Action Items.",
  calendar: "Suggest 3 content-calendar entries (date, platform, post idea) based on the conversation.",
};

export const chatAiAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: msgs, error } = await supabase
      .from("chat_messages")
      .select("user_id, content, created_at")
      .eq("channel_id", data.channelId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const transcript = (msgs ?? [])
      .reverse()
      .map((m) => `[${new Date(m.created_at).toLocaleTimeString()}] ${m.user_id.slice(0, 6)}: ${m.content}`)
      .join("\n");
    const sys = "You are a helpful AI assistant inside a team chat for a digital agency. Be concise and actionable.";
    const user = `${PROMPTS[data.action]}${data.extra ? `\n\nExtra context: ${data.extra}` : ""}\n\nRecent conversation:\n${transcript || "(no messages yet)"}`;
    const reply = await callAI(sys, user);
    return { reply };
  });
