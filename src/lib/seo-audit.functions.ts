import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runSeoAudit, type SeoAuditResult } from "./seo-audit.server";

const InputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(4)
    .max(2048)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid URL"),
});

export const auditUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; result: SeoAuditResult } | { ok: false; error: string }> => {
    try {
      const result = await runSeoAudit(data.url);
      return { ok: true, result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audit failed";
      console.error("SEO audit failed:", err);
      return { ok: false, error: msg };
    }
  });
