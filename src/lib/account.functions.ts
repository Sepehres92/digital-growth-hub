import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logAudit } from "./audit.server";

export const EXPORT_SCHEMA_VERSION = 2;

/** Every table that stores rows belonging to a user, with its ownership column. */
const OWNED_TABLES: ReadonlyArray<readonly [string, string]> = [
  ["ai_copies", "user_id"],
  ["ai_images", "user_id"],
  ["audit_logs", "user_id"],
  ["blog_posts", "user_id"],
  ["campaign_folders", "user_id"],
  ["campaigns", "user_id"],
  ["chat_audit_log", "user_id"],
  ["chat_channel_members", "user_id"],
  ["chat_channels", "created_by"],
  ["chat_messages", "user_id"],
  ["chat_presence", "user_id"],
  ["chat_reactions", "user_id"],
  ["chatbot_conversations", "user_id"],
  ["chatbot_kb_articles", "user_id"],
  ["chatbot_messages", "user_id"],
  ["chatbot_settings", "user_id"],
  ["client_images", "user_id"],
  ["clients", "user_id"],
  ["content_calendar", "user_id"],
  ["content_posts", "user_id"],
  ["content_rights_acknowledgements", "user_id"],
  ["creative_projects", "user_id"],
  ["demo_workspaces", "user_id"],
  ["generated_images", "user_id"],
  ["human_seo_ppc_requests", "user_id"],
  ["human_strategy_requests", "user_id"],
  ["leads", "user_id"],
  ["marketing_intelligence_profiles", "user_id"],
  ["marketing_profiles", "user_id"],
  ["media_assets", "user_id"],
  ["meeting_action_items", "user_id"],
  ["meeting_agenda_items", "user_id"],
  ["meeting_attachments", "user_id"],
  ["meeting_attendees", "user_id"],
  ["meeting_notes", "user_id"],
  ["meetings", "user_id"],
  ["onboarding_answers", "user_id"],
  ["onboarding_profiles", "user_id"],
  ["seo_ppc_admin_settings", "user_id"],
  ["seo_ppc_consultations", "user_id"],
  ["social_accounts", "user_id"],
  ["social_posts", "user_id"],
  ["strategy_admin_settings", "user_id"],
  ["strategy_consultations", "user_id"],
  ["support_tickets", "user_id"],
  ["tasks", "user_id"],
  ["user_roles", "user_id"],
  ["video_assets", "user_id"],
  ["video_audit_log", "user_id"],
  ["video_projects", "user_id"],
  ["video_renders", "user_id"],
  ["video_scenes", "user_id"],
  ["video_storyboards", "user_id"],
  ["video_subtitles", "user_id"],
  ["workspace_mode", "user_id"],
] as const;

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const tables: Record<string, unknown[]> = {};
    const failures: { source: string; error: string }[] = [];

    for (const [table, ownerColumn] of OWNED_TABLES) {
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .eq(ownerColumn, userId);
      if (error) failures.push({ source: `table:${table}`, error: error.message });
      else tables[table] = data ?? [];
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId);
    if (profileError) failures.push({ source: "table:profiles", error: profileError.message });
    else tables["profiles"] = profile ?? [];

    let storageObjects: unknown[] = [];
    const { data: storage, error: storageError } = await (supabase.rpc as any)(
      "export_my_storage_objects",
    );
    if (storageError) failures.push({ source: "storage", error: storageError.message });
    else storageObjects = storage ?? [];

    if (failures.length > 0) {
      throw new Error(
        `Export aborted — we could not read every part of your data, so this file would be incomplete. Failed: ${failures
          .map((f) => `${f.source} (${f.error})`)
          .join("; ")}`,
      );
    }

    await logAudit({ userId, action: "data.export" });

    return {
      schema_version: EXPORT_SCHEMA_VERSION,
      complete: true,
      exported_at: new Date().toISOString(),
      user_id: userId,
      sources: {
        tables: [...OWNED_TABLES.map(([t]) => t), "profiles"],
        storage_buckets: Array.from(
          new Set((storageObjects as { bucket_id?: string }[]).map((o) => o.bucket_id ?? "")),
        ).filter(Boolean),
      },
      tables,
      storage_objects: storageObjects,
    };
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
