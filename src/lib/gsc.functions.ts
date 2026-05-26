import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listSites, fetchReport } from "./gsc.server";

export const getGscSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { sites: await listSites() };
  });

export const getGscReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        siteUrl: z.string().min(4).max(500),
        days: z.number().int().min(1).max(90).default(28),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return await fetchReport(data.siteUrl, data.days);
  });
