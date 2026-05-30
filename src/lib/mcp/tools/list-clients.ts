import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getMcpTargetUserId } from "@/lib/mcp/target-user";


export const listClientsTool = defineTool({
  name: "list_clients",
  description: "List clients belonging to the configured user.",
  parameters: z.object({
    limit: z.number().int().min(1).max(100).default(25).optional(),
  }),
  execute: async ({ limit }) => {
    const userId = process.env.MCP_TARGET_USER_ID;
    if (!userId) throw new Error("MCP_TARGET_USER_ID not configured");
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, industry, website, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? [], null, 2);
  },
});
