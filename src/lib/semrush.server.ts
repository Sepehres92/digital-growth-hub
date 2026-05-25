const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!SEMRUSH_API_KEY) throw new Error("SEMRUSH_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": SEMRUSH_API_KEY,
  };
}

export type SemrushTable = {
  columnNames: string[];
  rows: Record<string, string | number>[];
};

async function call(path: string, params: Record<string, string | number | undefined>): Promise<SemrushTable> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const url = `${GATEWAY}${path}?${q.toString()}`;
  const res = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Semrush non-JSON response [${res.status}]: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json?.error) {
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(`Semrush ${path} failed: ${msg}`);
  }
  const data = json?.data ?? { columnNames: [], rows: [] };
  return {
    columnNames: data.columnNames ?? [],
    rows: data.rows ?? [],
  };
}

const cleanDomain = (d: string) => d.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();

export async function domainOverview(domain: string, database = "us") {
  return call("/domains/domain_ranks", {
    domain: cleanDomain(domain),
    database,
    export_columns: "Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
  });
}

export async function domainOrganicKeywords(domain: string, database = "us", limit = 25) {
  return call("/domains/domain_organic", {
    domain: cleanDomain(domain),
    database,
    display_limit: limit,
    export_columns: "Ph,Po,Pp,Nq,Cp,Co,Tr,Tc,Nr,Td",
  });
}

export async function backlinksOverview(target: string) {
  return call("/backlinks/backlinks_overview", {
    target: cleanDomain(target),
    target_type: "root_domain",
    export_columns: "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num,forms_num,frames_num",
  });
}

export async function backlinksRefDomains(target: string, limit = 25) {
  return call("/backlinks/backlinks_refdomains", {
    target: cleanDomain(target),
    target_type: "root_domain",
    display_limit: limit,
    export_columns: "domain_ascore,domain,backlinks_num,ip,country,first_seen,last_seen",
  });
}

export async function backlinksAnchors(target: string, limit = 25) {
  return call("/backlinks/backlinks_anchors", {
    target: cleanDomain(target),
    target_type: "root_domain",
    display_limit: limit,
    export_columns: "anchor,domains_num,backlinks_num,first_seen,last_seen",
  });
}

export async function competitors(domain: string, database = "us", limit = 15) {
  return call("/domains/domain_domains", {
    domain: cleanDomain(domain),
    database,
    display_limit: limit,
    export_columns: "Dn,Cr,Np,Or,Ot,Oc,Ad",
  });
}
