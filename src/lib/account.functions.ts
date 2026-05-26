import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logAudit } from "./audit.server";

const USER_TABLES = [
  "clients",
  "campaigns",
  "tasks",
  "leads",
  "ai_copies",
  "ai_images",
  "generated_images",
  "client_images",
  "creative_projects",
  "profiles",
  "audit_logs",
] as const;

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const result: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
    };

    for (const table of USER_TABLES) {
      const userCol = table === "profiles" ? "id" : "user_id";
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(userCol, userId);
      if (error) {
        result[table] = { error: error.message };
      } else {
        result[table] = data;
      }
    }

    await logAudit({
      userId,
      action: "data.export",
      metadata: { tables: USER_TABLES.length },
    });

    return result;
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Audit BEFORE deletion so the row references a still-existing user.
    await logAudit({
      userId,
      action: "account.delete",
    });

    // Best-effort cleanup. RLS doesn't apply to supabaseAdmin.
    // Most tables also cascade via auth.users FK / ON DELETE CASCADE in storage.
    for (const table of [
      "ai_copies",
      "ai_images",
      "generated_images",
      "client_images",
      "creative_projects",
      "tasks",
      "leads",
      "campaigns",
      "clients",
      "profiles",
    ] as const) {
      const userCol = table === "profiles" ? "id" : "user_id";
      await supabaseAdmin.from(table).delete().eq(userCol, userId);
    }

    // Delete the auth user. This invalidates all sessions.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
