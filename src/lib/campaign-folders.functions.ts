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
