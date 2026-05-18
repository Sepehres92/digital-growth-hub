const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SEARCH_CONSOLE_API_KEY = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_SEARCH_CONSOLE_API_KEY)
    throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_SEARCH_CONSOLE_API_KEY,
    "Content-Type": "application/json",
  };
}

export type GscSite = {
  siteUrl: string;
  permissionLevel: string;
};

export async function listSites(): Promise<GscSite[]> {
  const res = await fetch(`${GATEWAY}/webmasters/v3/sites`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GSC sites failed [${res.status}]: ${JSON.stringify(data)}`);
  return (data.siteEntry ?? []).map((s: any) => ({
    siteUrl: s.siteUrl,
    permissionLevel: s.permissionLevel,
  }));
}

export type QueryRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscReport = {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  queries: QueryRow[];
  pages: QueryRow[];
  byDate: QueryRow[];
};

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function queryDim(siteUrl: string, dims: string[], days: number, rowLimit = 25) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const res = await fetch(
    `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        dimensions: dims,
        rowLimit,
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`GSC query failed [${res.status}]: ${JSON.stringify(data)}`);
  return (data.rows ?? []) as QueryRow[];
}

export async function fetchReport(siteUrl: string, days: number): Promise<GscReport> {
  const [queries, pages, byDate, totalsRows] = await Promise.all([
    queryDim(siteUrl, ["query"], days, 50),
    queryDim(siteUrl, ["page"], days, 25),
    queryDim(siteUrl, ["date"], days, 400),
    queryDim(siteUrl, [], days, 1),
  ]);
  const t = totalsRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0, keys: [] };
  return {
    totals: {
      clicks: t.clicks ?? 0,
      impressions: t.impressions ?? 0,
      ctr: t.ctr ?? 0,
      position: t.position ?? 0,
    },
    queries,
    pages,
    byDate,
  };
}
