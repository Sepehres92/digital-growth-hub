import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

    const tables: Record<string, any[]> = {};
    const failures: { source: string; error: string }[] = [];

    for (const [table, ownerColumn] of OWNED_TABLES) {
      const { data, error } = await (supabase as any).from(table)
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

    let storageObjects: any[] = [];
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

    // Demo/sample rows stay in the export for completeness, but are flagged so
    // they are never mistaken for real business data.
    const demoSummary: Record<string, number> = {};
    for (const table of ["clients", "campaigns", "campaign_folders", "content_posts", "social_posts"]) {
      const rows = (tables[table] ?? []) as { is_demo?: boolean }[];
      demoSummary[table] = rows.filter((r) => r?.is_demo === true).length;
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
      demo_records: demoSummary,
      tables,
      storage_objects: storageObjects,
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    await logAudit({ userId, action: "account.delete" });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Collect the storage objects this user owns BEFORE their rows disappear.
    const { data: storage, error: storageListError } = await (supabase.rpc as any)(
      "export_my_storage_objects",
    );
    if (storageListError) {
      throw new Error(
        `Deletion stopped before anything was removed — we could not list your stored files (${storageListError.message}). Nothing was deleted; please try again.`,
      );
    }
    const objects = (storage ?? []) as { bucket_id: string; name: string }[];

    // 2. Remove every database row across all user-owned tables, in dependency order.
    const { data: deleted, error: purgeError } = await (supabaseAdmin.rpc as any)(
      "purge_user_data",
      { _user_id: userId },
    );
    if (purgeError) {
      throw new Error(
        `Deletion failed part-way through (${purgeError.message}). Your account has NOT been removed — contact us so we can finish it.`,
      );
    }

    // 3. Remove the files.
    const byBucket = new Map<string, string[]>();
    for (const o of objects) {
      if (!o?.bucket_id || !o?.name) continue;
      byBucket.set(o.bucket_id, [...(byBucket.get(o.bucket_id) ?? []), o.name]);
    }
    const storageFailures: string[] = [];
    for (const [bucket, paths] of byBucket) {
      const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
      if (error) storageFailures.push(`${bucket} (${error.message})`);
    }
    if (storageFailures.length > 0) {
      throw new Error(
        `Your records were deleted but some stored files could not be removed: ${storageFailures.join("; ")}. Your account has NOT been closed — contact us so we can finish it.`,
      );
    }

    // 4. Verify nothing is left behind before closing the account.
    const { data: remaining, error: verifyError } = await (supabaseAdmin.rpc as any)(
      "count_user_records",
      { _user_id: userId },
    );
    if (verifyError) {
      throw new Error(
        `We could not confirm that everything was deleted (${verifyError.message}). Your account has NOT been closed — contact us so we can verify it.`,
      );
    }
    const leftovers = Object.entries((remaining ?? {}) as Record<string, number>);
    if (leftovers.length > 0) {
      throw new Error(
        `Deletion is incomplete — data still remains in: ${leftovers
          .map(([t, n]) => `${t} (${n})`)
          .join(", ")}. Your account has NOT been closed.`,
      );
    }

    // 5. Finally close the login itself.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(
        `All of your data was deleted, but the login could not be closed (${error.message}). Contact us so we can finish it.`,
      );
    }

    return {
      ok: true,
      deleted_rows: (deleted ?? {}) as Record<string, number>,
      deleted_files: objects.length,
      verified_empty: true,
    };
  });
