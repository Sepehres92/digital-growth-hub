import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STYLE_HINTS: Record<string, string> = {
  photorealistic: "ultra photorealistic, 50mm lens, natural lighting, sharp detail",
  cinematic: "cinematic lighting, anamorphic, shallow depth of field, color graded, film grain",
  product_ad: "premium product photography, studio softbox lighting, clean seamless backdrop, commercial advertising",
  social_media_ad: "vibrant social media ad creative, bold colors, eye-catching composition, scroll-stopping",
  cartoon: "stylized cartoon illustration, clean linework, vibrant flat colors",
  luxury_brand: "luxury brand aesthetic, refined minimalism, gold accents, editorial sophistication",
  construction_industry: "construction industry context, hard hats and high-vis vests, heavy machinery, jobsite realism",
  real_estate: "high-end real estate photography, wide-angle interior, warm staging, golden hour exterior",
};

const SIZE_LABEL: Record<string, string> = {
  square: "square 1:1 composition",
  portrait: "tall portrait 3:4 composition",
  landscape: "wide landscape 16:9 composition",
};

const Input = z.object({
  mode: z.enum(["generate", "edit"]),
  prompt: z.string().min(2).max(2000),
  style: z.string().max(50).optional().default(""),
  size: z.enum(["square", "portrait", "landscape"]).optional().default("square"),
  sourceDataUrl: z.string().max(20_000_000).optional(), // base64 data URL for edit mode
  sourceMimeType: z.string().max(80).optional(),
  clientId: z.string().uuid().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
});

async function callGateway(body: unknown, apiKey: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function extractImageDataUrl(json: any): string | null {
  const msg = json?.choices?.[0]?.message;
  if (!msg) return null;
  if (Array.isArray(msg.images) && msg.images[0]?.image_url?.url) return msg.images[0].image_url.url;
  if (Array.isArray(msg.content)) {
    for (const p of msg.content) {
      if (p?.type === "image_url" && p?.image_url?.url) return p.image_url.url;
      if (p?.type === "output_image" && p?.image_url) return p.image_url;
    }
  }
  if (typeof msg.content === "string") {
    const m = msg.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    if (m) return m[0];
  }
  return null;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL");
  const mime = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

export const generateOrEditImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const { supabase, userId } = context;

    const styleHint = data.style ? (STYLE_HINTS[data.style] ?? data.style) : "";
    const sizeHint = SIZE_LABEL[data.size] ?? "";

    let body: any;
    if (data.mode === "generate") {
      const fullPrompt = [data.prompt, styleHint, sizeHint].filter(Boolean).join(". ");
      body = {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      };
    } else {
      if (!data.sourceDataUrl) throw new Error("Source image required for edit mode");
      const instruction = [data.prompt, styleHint].filter(Boolean).join(". ");
      body = {
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: data.sourceDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      };
    }

    const json = await callGateway(body, apiKey);
    const dataUrl = extractImageDataUrl(json);
    if (!dataUrl) throw new Error("AI did not return an image. Try a different prompt.");

    const { bytes, mime } = dataUrlToBytes(dataUrl);
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("ai-images")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: pub } = supabase.storage.from("ai-images").getPublicUrl(path);
    const imageUrl = pub.publicUrl;

    const { data: row, error: insErr } = await supabase
      .from("ai_images")
      .insert({
        user_id: userId,
        client_id: data.clientId || null,
        campaign_id: data.campaignId || null,
        mode: data.mode,
        prompt: data.prompt,
        style: data.style || null,
        size: data.size,
        image_url: imageUrl,
        storage_path: path,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    return { image: row };
  });
