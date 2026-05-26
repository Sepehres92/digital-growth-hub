import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  detectSocialLinks,
  analyzeProfile,
  tiktokSelf,
  tiktokVideos,
  twitchAnalyze,
} from "./social.server";

const urlSchema = z.object({ url: z.string().url().min(1).max(2048) });

export const detectSocialFromSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => urlSchema.parse(d))
  .handler(async ({ data }) => detectSocialLinks(data.url));

export const analyzeSocialProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => urlSchema.parse(d))
  .handler(async ({ data }) => analyzeProfile(data.url));

export const getTikTokSelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [user, videos] = await Promise.all([
      tiktokSelf().catch((e: Error) => ({ error: e.message })),
      tiktokVideos(10).catch((e: Error) => ({ error: e.message })),
    ]);
    return { user, videos };
  });

export const getTwitchUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ login: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_]+$/) }).parse(d),
  )
  .handler(async ({ data }) => twitchAnalyze(data.login));
