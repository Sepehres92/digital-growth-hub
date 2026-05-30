import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listUpcomingContentTool = defineTool({
  name: "list_upcoming_content",
  description: "List upcoming items from the content calendar for the configured user.",
  parameters: z.object({
    days: z.number().int().min(1).max(90).default(14).optional(),
  }),
  execute: async ({ days }) => {
    const userId = process.env.MCP_TARGET_USER_ID;
    if (!userId) throw new Error("MCP_TARGET_USER_ID not configured");
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + (days ?? 14));
    const { data, error } = await supabaseAdmin
      .from("content_calendar")
      .select("*")
      .eq("user_id", userId)
      .lte("scheduled_at", horizon.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? [], null, 2);
  },
});
