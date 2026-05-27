import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StrategyDataSchema = z
  .object({
    name: z.string().min(1).max(200),
    goal: z.string().max(2000).optional(),
    strategy_summary: z.string().max(20_000).optional(),
    monthly_budget: z.number().min(0).max(10_000_000).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .passthrough();

const InputSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  campaign_type: z.enum(["seo", "ppc", "social_media", "website", "branding"]),
  creation_method: z.enum(["ai", "human", "ai_human_review"]),
  strategy_data: StrategyDataSchema,
  notes: z.string().max(5000).optional(),
});

/**
 * Transaction-style: create the campaign FIRST, then the folder, link both.
 * If folder creation fails, roll back the campaign. Returns ids on success.
 */
export const createCampaignWithFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const s = data.strategy_data;

    // 1) Create campaign (BEFORE-INSERT trigger spawns the folder w/ NULL campaign_id;
    //    AFTER-INSERT trigger links the folder back to the new campaign).
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        client_id: data.client_id ?? null,
        name: s.name,
        type: data.campaign_type,
        source_type: data.creation_method,
        goal: s.goal ?? null,
        monthly_budget: s.monthly_budget ?? 0,
        start_date: s.start_date || null,
        end_date: s.end_date || null,
        status: "planned",
        results_notes: data.notes ?? null,
      })
      .select("id, campaign_folder_id")
      .single();

    if (campErr || !campaign?.id) {
      console.error("[createCampaignWithFolder] campaign insert failed", campErr);
      throw new Error(
        `Failed to create campaign: ${campErr?.message ?? "unknown error"}`,
      );
    }

    const campaignId = campaign.id;
    const folderId = campaign.campaign_folder_id;

    if (!folderId) {
      // Roll back the campaign so we don't leave an orphan
      await supabase.from("campaigns").delete().eq("id", campaignId);
      throw new Error("Campaign folder was not created by trigger. Rolled back.");
    }

    // 2) Patch folder with strategy + status + source
    const startStatus =
      data.creation_method === "human"
        ? "human_review_required"
        : data.creation_method === "ai_human_review"
          ? "pending_human_review"
          : "pending_client_approval";

    const folderType =
      data.campaign_type === "seo"
        ? "seo"
        : data.campaign_type === "ppc"
          ? "ppc"
          : data.campaign_type === "social_media"
            ? "social_media"
            : "combined";

    const { data: folder, error: folderErr } = await supabase
      .from("campaign_folders")
      .update({
        name: s.name,
        client_id: data.client_id ?? null,
        campaign_id: campaignId,
        folder_type: folderType,
        source_type: data.creation_method,
        status: startStatus,
        goal: s.goal ?? null,
        strategy_summary: s.strategy_summary ?? null,
        client_notes: data.notes ?? null,
      })
      .eq("id", folderId)
      .select("*")
      .single();

    if (folderErr || !folder) {
      console.error("[createCampaignWithFolder] folder update failed", folderErr);
      // Roll back: delete campaign (folder will null-out via ON DELETE SET NULL,
      // then remove the orphan folder).
      await supabase.from("campaigns").delete().eq("id", campaignId);
      await supabase.from("campaign_folders").delete().eq("id", folderId);
      throw new Error(
        `Failed to set up campaign folder: ${folderErr?.message ?? "unknown error"}. Rolled back.`,
      );
    }

    return {
      campaign_id: campaignId,
      campaign_folder_id: folderId,
      folder,
    };
  });
