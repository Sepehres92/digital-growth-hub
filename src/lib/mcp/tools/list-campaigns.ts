import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listCampaignsTool = defineTool({
  name: "list_campaigns",
  description: "List campaigns (optionally filtered by client_id) for the configured user.",
  parameters: z.object({
    client_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  }),
  execute: async ({ client_id, limit }) => {
    const userId = process.env.MCP_TARGET_USER_ID;
    if (!userId) throw new Error("MCP_TARGET_USER_ID not configured");
    let q = supabaseAdmin
      .from("campaigns")
      .select("id, name, type, status, goal, monthly_budget, start_date, end_date, client_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? [], null, 2);
  },
});
