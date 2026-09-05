import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CONSENT_POLICY_VERSION = "2026-06-01";

const schema = z.object({
  policyVersion: z.string().min(1).max(40),
  source: z.enum(["email_signup", "google_oauth", "manual_reaccept"]),
});

/**
 * Records that the signed-in user accepted the Terms and Privacy Policy.
 * Idempotent: repeated calls for the same (user, version, source) are ignored.
 */
export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_consents").insert({
      user_id: context.userId,
      policy_version: data.policyVersion,
      terms_accepted: true,
      privacy_accepted: true,
      consent_source: data.source,
    });

    // 23505 = already recorded for this version/source.
    if (error && error.code !== "23505") throw new Error(error.message);
    return { recorded: true };
  });
