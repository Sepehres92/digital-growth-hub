import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getMcpTargetUserId } from "@/lib/mcp/target-user";


export const getBusinessProfileTool = defineTool({
  name: "get_business_profile",
  description:
    "Return the saved marketing/business profile (industry, audience, brand voice, platforms, SEO/PPC settings) for the configured user.",
  parameters: z.object({}),
  execute: async () => {
    const userId = process.env.MCP_TARGET_USER_ID;
    if (!userId) throw new Error("MCP_TARGET_USER_ID not configured");
    const { data, error } = await supabaseAdmin
      .from("onboarding_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return JSON.stringify(data ?? {}, null, 2);
  },
});
