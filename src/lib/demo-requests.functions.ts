import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const demoInput = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  company: z.string().trim().min(1, "Please enter your company.").max(160),
  email: z.string().trim().email("Please enter a valid work email.").max(200),
  message: z.string().trim().max(2000).optional().default(""),
  // Honeypot — real users never fill this.
  website: z.string().max(0).optional().default(""),
});

async function hashValue(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export const submitDemoRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => demoInput.parse(data))
  .handler(async ({ data }) => {
    if (data.website) {
      // Silently accepted-looking, but never stored.
      throw new Error("Your request could not be submitted. Please try again.");
    }

    const request = getRequest();
    const ip =
      request?.headers.get("cf-connecting-ip") ??
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const userAgent = request?.headers.get("user-agent")?.slice(0, 300) ?? null;
    const submitterHash = await hashValue(`${ip}|${data.email.toLowerCase()}`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("submitter_hash", submitterHash)
      .gte("created_at", since);

    if (countError) throw new Error("We could not process your request. Please try again shortly.");
    if ((count ?? 0) >= 3) {
      throw new Error("You've already sent a few requests. We'll be in touch soon — please try again later.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("demo_requests")
      .insert({
        name: data.name,
        email: data.email.toLowerCase(),
        company: data.company,
        message: data.message || null,
        source: "book-demo",
        submitter_hash: submitterHash,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error || !row) {
      throw new Error("We couldn't save your request. Please try again or email us directly.");
    }

    return { id: row.id };
  });
