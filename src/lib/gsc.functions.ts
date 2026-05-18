import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listSites, fetchReport } from "./gsc.server";

export const getGscSites = createServerFn({ method: "GET" }).handler(async () => {
  return { sites: await listSites() };
});

export const getGscReport = createServerFn({ method: "POST" })
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
