import { isValidUUID } from "@/lib/utils";

/**
 * Resolve and validate the MCP target user ID from env.
 * Throws a precise error if missing or not a valid UUID — prevents
 * "invalid input syntax for type uuid" leaking out of Postgres.
 */
export function getMcpTargetUserId(): string {
  const raw = process.env.MCP_TARGET_USER_ID;
  console.log("UUID DEBUG mcp.target_user_id", { raw });
  if (!raw) {
    throw new Error("MCP_TARGET_USER_ID is not configured");
  }
  if (!isValidUUID(raw)) {
    throw new Error(
      `MCP_TARGET_USER_ID is not a valid UUID (got "${raw}"). ` +
        `Fix it in Lovable Cloud → Secrets and republish.`,
    );
  }
  return raw;
}
