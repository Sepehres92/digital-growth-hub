import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  contentType: z.string().min(1).max(50),
  businessType: z.string().max(200).optional().default(""),
  audience: z.string().max(200).optional().default(""),
  offer: z.string().max(500).optional().default(""),
  tone: z.string().max(50).optional().default("Professional"),
  platform: z.string().max(50).optional().default(""),
  goal: z.string().max(200).optional().default(""),
  keywords: z.string().max(300).optional().default(""),
});

const TYPE_LABELS: Record<string, string> = {
  facebook_ad: "Facebook ad",
  google_ad: "Google ad (headlines + descriptions)",
  instagram_caption: "Instagram caption",
  seo_blog_outline: "SEO blog post outline",
  email_marketing: "Marketing email",
  landing_page: "Landing page copy (hero, subhead, bullets, CTA)",
  cta_button: "Call-to-action button labels",
  hashtags: "Relevant hashtags",
};

export const generateCopy = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const label = TYPE_LABELS[data.contentType] ?? data.contentType;
    const system = `You are an expert direct-response copywriter. Generate marketing copy in 4 distinct variations: SHORT, LONG, PROFESSIONAL, and FUNNY. Format your response EXACTLY like this with these headers:

### SHORT
<short version here>

### LONG
<long version here>

### PROFESSIONAL
<professional version here>

### FUNNY
<funny version here>

Do not add any preamble or closing text.`;

    const user = `Generate a ${label}.

Business type: ${data.businessType || "N/A"}
Target audience: ${data.audience || "N/A"}
Offer: ${data.offer || "N/A"}
Tone of voice: ${data.tone}
Platform: ${data.platform || "N/A"}
Goal: ${data.goal || "N/A"}
Keywords: ${data.keywords || "N/A"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error: ${res.status} ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    const variations: Record<string, string> = { short: "", long: "", professional: "", funny: "" };
    const re = /###\s*(SHORT|LONG|PROFESSIONAL|FUNNY)\s*\n([\s\S]*?)(?=\n###\s|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      variations[m[1].toLowerCase()] = m[2].trim();
    }
    if (!variations.short && !variations.long) {
      variations.long = text.trim();
    }
    return { variations, raw: text };
  });
