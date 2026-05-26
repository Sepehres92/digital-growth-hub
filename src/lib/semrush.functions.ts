import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  domainOverview,
  domainOrganicKeywords,
  backlinksOverview,
  backlinksRefDomains,
  backlinksAnchors,
  competitors,
} from "./semrush.server";

const DomainInput = z.object({
  domain: z.string().trim().min(3).max(255),
  database: z.string().trim().min(2).max(10).default("us"),
});

const CompareInput = z.object({
  domains: z.array(z.string().trim().min(3).max(255)).min(2).max(5),
  database: z.string().trim().min(2).max(10).default("us"),
});

export const getSemrushKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => DomainInput.parse(i))
  .handler(async ({ data }) => {
    const [overview, keywords] = await Promise.all([
      domainOverview(data.domain, data.database),
      domainOrganicKeywords(data.domain, data.database, 50),
    ]);
    return { overview, keywords };
  });

export const getSemrushBacklinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => DomainInput.parse(i))
  .handler(async ({ data }) => {
    const [overview, refDomains, anchors] = await Promise.all([
      backlinksOverview(data.domain),
      backlinksRefDomains(data.domain, 25),
      backlinksAnchors(data.domain, 25),
    ]);
    return { overview, refDomains, anchors };
  });

export const getSemrushCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => DomainInput.parse(i))
  .handler(async ({ data }) => {
    return { competitors: await competitors(data.domain, data.database, 20) };
  });

export const compareSemrushDomains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CompareInput.parse(i))
  .handler(async ({ data }) => {
    const results = await Promise.all(
      data.domains.map(async (d) => ({
        domain: d,
        overview: await domainOverview(d, data.database),
      })),
    );
    return { results };
  });
