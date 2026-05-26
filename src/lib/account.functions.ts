import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logAudit } from "./audit.server";

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
    };

    const userOwned = [
      "clients",
      "campaigns",
      "tasks",
      "leads",
      "ai_copies",
      "ai_images",
      "generated_images",
      "client_images",
      "creative_projects",
      "audit_logs",
    ] as const;

    for (const t of userOwned) {
      const { data, error } = await (supabase.from(t) as any)
        .select("*")
        .eq("user_id", userId);
      out[t] = error ? { error: error.message } : data;
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId);
    out.profiles = pErr ? { error: pErr.message } : profile;

    await logAudit({ userId, action: "data.export" });

    return out as unknown as Record<string, unknown>;
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    await logAudit({ userId, action: "account.delete" });

    const userOwned = [
      "ai_copies",
      "ai_images",
      "generated_images",
      "client_images",
      "creative_projects",
      "tasks",
      "leads",
      "campaigns",
      "clients",
    ] as const;

    for (const t of userOwned) {
      await (supabaseAdmin.from(t) as any).delete().eq("user_id", userId);
    }
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
