import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuditAction =
  | "ai.generate.text"
  | "ai.generate.image"
  | "ai.edit.image"
  | "file.upload"
  | "data.export"
  | "account.delete"
  | "role.change";

export async function logAudit(params: {
  userId: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? null,
      ip_address: params.ip ?? null,
    });
  } catch (err) {
    // Never let audit failures break the main action.
    console.error("[audit] insert failed", err);
  }
}
