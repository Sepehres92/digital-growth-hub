import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  folderType: z.enum([
    "social_media",
    "seo",
    "ppc",
    "combined",
    "human_assisted",
    "ai_generated",
    "ai_human_review",
  ]),
  sourceType: z.enum(["ai", "human", "ai_human_review"]),
  goal: z.string().max(2000).optional(),
  strategySummary: z.string().max(5000).optional(),
  campaignId: z.string().uuid().nullable().optional(),
});

/**
 * Create a campaign folder. The DB trigger auto-creates one when a campaign
 * row is inserted; use this function to create a standalone folder (e.g.
 * for a human-assisted request before the campaign exists).
 */
export const createCampaignFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const status =
      data.sourceType === "human"
        ? "human_review_required"
        : data.sourceType === "ai_human_review"
        ? "pending_human_review"
        : "draft";

    const { data: folder, error } = await supabase
      .from("campaign_folders")
      .insert({
        user_id: userId,
        client_id: data.clientId ?? null,
        name: data.name,
        folder_type: data.folderType,
        source_type: data.sourceType,
        status,
        goal: data.goal ?? null,
        strategy_summary: data.strategySummary ?? null,
        campaign_id: data.campaignId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { folder };
  });

export const listCampaignFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ clientId: z.string().uuid().optional() })
      .parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("campaign_folders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.clientId) q = q.eq("client_id", data.clientId);
    const { data: folders, error } = await q;
    if (error) throw new Error(error.message);
    return { folders: folders ?? [] };
  });

export const getCampaignFolder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ folderId: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const id = data.folderId;
    const [folder, tasks, meetings, posts, social, strategy, images, videos, copies] =
      await Promise.all([
        supabase.from("campaign_folders").select("*").eq("id", id).maybeSingle(),
        supabase.from("tasks").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
        supabase.from("meetings").select("*").eq("campaign_folder_id", id).order("meeting_date", { ascending: false }),
        supabase.from("content_posts").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
        supabase.from("social_posts").select("*").eq("campaign_folder_id", id).order("scheduled_at", { ascending: false }),
        supabase.from("generated_strategy_content").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
        supabase.from("generated_images").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
        supabase.from("video_projects").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
        supabase.from("ai_copies").select("*").eq("campaign_folder_id", id).order("created_at", { ascending: false }),
      ]);

    if (folder.error) throw new Error(folder.error.message);

    return {
      folder: folder.data,
      tasks: tasks.data ?? [],
      meetings: meetings.data ?? [],
      contentPosts: posts.data ?? [],
      socialPosts: social.data ?? [],
      strategyContent: strategy.data ?? [],
      images: images.data ?? [],
      videos: videos.data ?? [],
      copies: copies.data ?? [],
    };
  });

const UpdateStatusSchema = z.object({
  folderId: z.string().uuid(),
  status: z.enum([
    "draft",
    "ai_generating",
    "pending_client_approval",
    "pending_human_review",
    "human_review_required",
    "approved",
    "scheduled",
    "active",
    "completed",
    "paused",
    "rejected",
  ]),
  clientNotes: z.string().max(5000).optional(),
});

export const updateCampaignFolderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: { status: typeof data.status; client_notes?: string } = {
      status: data.status,
    };
    if (data.clientNotes !== undefined) patch.client_notes = data.clientNotes;
    const { data: folder, error } = await supabase
      .from("campaign_folders")
      .update(patch)
      .eq("id", data.folderId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { folder };
  });

const WizardSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  campaignKind: z.enum(["social_media", "seo", "ppc", "seo_ppc", "full"]),
  sourceType: z.enum(["ai", "human", "ai_human_review"]),
  goal: z.string().max(2000).optional(),
  targetAudience: z.string().max(2000).optional(),
  monthlyBudget: z.number().min(0).max(10_000_000).optional(),
  tone: z.string().max(200).optional(),
  platforms: z.array(z.string().max(50)).max(20).optional(),
  keywords: z.string().max(2000).optional(),
  strategySummary: z.string().max(10_000).optional(),
});

/**
 * Wizard entry point: creates a campaign (auto-spawns its folder via trigger),
 * then updates the folder with the wizard's strategy summary, source type, and
 * starting status. Returns the folder id so the UI can navigate to it.
 */
export const createCampaignFromWizard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WizardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const campaignType: "seo" | "ppc" | "social_media" | "website" =
      data.campaignKind === "seo"
        ? "seo"
        : data.campaignKind === "ppc"
        ? "ppc"
        : data.campaignKind === "social_media"
        ? "social_media"
        : "website";

    const folderType: "social_media" | "seo" | "ppc" | "combined" =
      data.campaignKind === "social_media"
        ? "social_media"
        : data.campaignKind === "seo"
        ? "seo"
        : data.campaignKind === "ppc"
        ? "ppc"
        : "combined";

    const startStatus =
      data.sourceType === "human"
        ? "human_review_required"
        : data.sourceType === "ai_human_review"
        ? "pending_human_review"
        : "pending_client_approval";

    // Insert campaign — trigger auto-creates folder
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        client_id: data.clientId ?? null,
        name: data.name,
        type: campaignType,
        source_type: data.sourceType,
        goal: data.goal ?? null,
        monthly_budget: data.monthlyBudget ?? 0,
        status: "planned",
      })
      .select("id, campaign_folder_id")
      .single();
    if (campErr) throw new Error(campErr.message);

    const folderId = campaign.campaign_folder_id;
    if (!folderId) throw new Error("Campaign folder was not auto-created");

    // Patch folder with wizard details
    const summary =
      data.strategySummary ??
      buildDefaultSummary({
        kind: data.campaignKind,
        goal: data.goal,
        audience: data.targetAudience,
        tone: data.tone,
        budget: data.monthlyBudget,
        platforms: data.platforms,
        keywords: data.keywords,
        source: data.sourceType,
      });

    const { data: folder, error: folderErr } = await supabase
      .from("campaign_folders")
      .update({
        name: data.name,
        folder_type: folderType,
        source_type: data.sourceType,
        status: startStatus,
        strategy_summary: summary,
        goal: data.goal ?? null,
      })
      .eq("id", folderId)
      .select("*")
      .single();
    if (folderErr) throw new Error(folderErr.message);

    // If human help requested, log a human strategy request (best-effort)
    if (data.sourceType === "human" || data.sourceType === "ai_human_review") {
      await supabase.from("human_strategy_requests").insert({
        user_id: userId,
        client_id: data.clientId ?? null,
        campaign_folder_id: folderId,
        request_status: "pending",
        payment_required: false,
      });
    }

    return { folder, campaignId: campaign.id };
  });

function buildDefaultSummary(input: {
  kind: string;
  goal?: string;
  audience?: string;
  tone?: string;
  budget?: number;
  platforms?: string[];
  keywords?: string;
  source: string;
}): string {
  const lines: string[] = [];
  lines.push(`Campaign type: ${input.kind.replace(/_/g, " ")}`);
  lines.push(`Creation method: ${input.source.replace(/_/g, " ")}`);
  if (input.goal) lines.push(`\nBusiness goal:\n${input.goal}`);
  if (input.audience) lines.push(`\nTarget audience:\n${input.audience}`);
  if (input.tone) lines.push(`\nTone: ${input.tone}`);
  if (input.budget != null) lines.push(`Monthly budget: $${input.budget}`);
  if (input.platforms?.length) lines.push(`Platforms: ${input.platforms.join(", ")}`);
  if (input.keywords) lines.push(`\nKeywords / focus:\n${input.keywords}`);
  lines.push(
    "\nRecommended next steps:\n- Approve to spin up content, tasks, and calendar entries\n- Request changes if anything looks off\n- Or escalate to a human specialist for hands-on help"
  );
  return lines.join("\n");
}
