import Firecrawl from "@mendable/firecrawl-js";

export interface SeoAuditResult {
  url: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  language: string | null;
  statusCode: number | null;
  favicon: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesMissingAlt: number;
  hasRobots: boolean;
  robotsContent: string | null;
  checks: { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string }[];
  score: number;
}

export async function runSeoAudit(rawUrl: string): Promise<SeoAuditResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");

  const firecrawl = new Firecrawl({ apiKey });

  const result = await firecrawl.scrape(rawUrl, {
    formats: ["html", "markdown", "links"],
    onlyMainContent: false,
  });

  // Normalize across SDK / REST shapes
  const r = result as Record<string, unknown>;
  const data = (r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : r) as Record<
    string,
    unknown
  >;
  const html = (data.html as string | undefined) ?? "";
  const markdown = (data.markdown as string | undefined) ?? "";
  const links = (data.links as string[] | undefined) ?? [];
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};

  const sourceURL = (metadata.sourceURL as string | undefined) ?? rawUrl;
  const title = (metadata.title as string | undefined) ?? extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description =
    (metadata.description as string | undefined) ??
    extractMeta(html, "description");
  const canonical = extractLink(html, "canonical");
  const ogTitle = (metadata.ogTitle as string | undefined) ?? extractMetaProp(html, "og:title");
  const ogDescription =
    (metadata.ogDescription as string | undefined) ?? extractMetaProp(html, "og:description");
  const ogImage = (metadata.ogImage as string | undefined) ?? extractMetaProp(html, "og:image");
  const twitterCard = extractMeta(html, "twitter:card");
  const language = (metadata.language as string | undefined) ?? extractAttr(html, /<html[^>]*\slang=["']([^"']+)["']/i);
  const statusCode = (metadata.statusCode as number | undefined) ?? null;
  const favicon =
    extractLink(html, "icon") ?? extractLink(html, "shortcut icon") ?? null;
  const robotsContent = extractMeta(html, "robots");

  const h1 = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2 = extractAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h3 = extractAll(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi);

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;

  let internalLinks = 0;
  let externalLinks = 0;
  try {
    const origin = new URL(sourceURL).origin;
    for (const l of links) {
      try {
        const u = new URL(l, sourceURL);
        if (u.origin === origin) internalLinks++;
        else externalLinks++;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imageCount = imgs.length;
  const imagesMissingAlt = imgs.filter((tag) => !/\salt\s*=\s*["'][^"']+["']/i.test(tag)).length;

  const checks: SeoAuditResult["checks"] = [];

  pushCheck(checks, "title", "Title tag", title, {
    pass: (v) => !!v && v.length >= 30 && v.length <= 60,
    warn: (v) => !!v,
    passDetail: (v) => `${v!.length} chars — optimal range`,
    warnDetail: (v) =>
      v!.length < 30 ? `${v!.length} chars — too short (aim 30–60)` : `${v!.length} chars — too long (aim 30–60)`,
    failDetail: "Missing <title> tag",
  });

  pushCheck(checks, "description", "Meta description", description, {
    pass: (v) => !!v && v.length >= 70 && v.length <= 160,
    warn: (v) => !!v,
    passDetail: (v) => `${v!.length} chars — optimal range`,
    warnDetail: (v) =>
      v!.length < 70 ? `${v!.length} chars — too short (aim 70–160)` : `${v!.length} chars — too long (aim 70–160)`,
    failDetail: "Missing meta description",
  });

  checks.push({
    id: "h1",
    label: "H1 heading",
    status: h1.length === 1 ? "pass" : h1.length === 0 ? "fail" : "warn",
    detail:
      h1.length === 1
        ? `Single H1 found: "${truncate(stripTags(h1[0]), 60)}"`
        : h1.length === 0
          ? "No H1 found on the page"
          : `${h1.length} H1 tags — should be exactly one`,
  });

  checks.push({
    id: "canonical",
    label: "Canonical URL",
    status: canonical ? "pass" : "warn",
    detail: canonical ? canonical : "No canonical tag set",
  });

  checks.push({
    id: "og",
    label: "Open Graph tags",
    status: ogTitle && ogDescription ? "pass" : ogTitle || ogDescription ? "warn" : "fail",
    detail:
      ogTitle && ogDescription
        ? "og:title and og:description present"
        : ogTitle || ogDescription
          ? "Some OG tags missing"
          : "No Open Graph metadata",
  });

  checks.push({
    id: "og-image",
    label: "Social share image",
    status: ogImage ? "pass" : "warn",
    detail: ogImage ? "og:image set" : "No og:image — link previews will be plain text",
  });

  checks.push({
    id: "twitter",
    label: "Twitter card",
    status: twitterCard ? "pass" : "warn",
    detail: twitterCard ? `twitter:card = ${twitterCard}` : "No twitter:card tag",
  });

  checks.push({
    id: "lang",
    label: "HTML lang attribute",
    status: language ? "pass" : "warn",
    detail: language ? `lang="${language}"` : "Missing lang attribute on <html>",
  });

  checks.push({
    id: "alt",
    label: "Image alt text",
    status:
      imageCount === 0
        ? "pass"
        : imagesMissingAlt === 0
          ? "pass"
          : imagesMissingAlt / imageCount > 0.3
            ? "fail"
            : "warn",
    detail:
      imageCount === 0
        ? "No images on page"
        : `${imagesMissingAlt} / ${imageCount} images missing alt text`,
  });

  checks.push({
    id: "content",
    label: "Content depth",
    status: wordCount >= 300 ? "pass" : wordCount > 0 ? "warn" : "fail",
    detail: `${wordCount.toLocaleString()} words of body content`,
  });

  checks.push({
    id: "robots",
    label: "Indexability",
    status:
      robotsContent && /noindex/i.test(robotsContent)
        ? "fail"
        : robotsContent
          ? "pass"
          : "pass",
    detail:
      robotsContent && /noindex/i.test(robotsContent)
        ? `Blocked: meta robots = "${robotsContent}"`
        : robotsContent
          ? `meta robots = "${robotsContent}"`
          : "Indexable (no restrictive robots meta)",
  });

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const score = Math.round(((passCount + warnCount * 0.5) / checks.length) * 100);

  return {
    url: sourceURL,
    title: title ?? null,
    description: description ?? null,
    canonical: canonical ?? null,
    ogTitle: ogTitle ?? null,
    ogDescription: ogDescription ?? null,
    ogImage: ogImage ?? null,
    twitterCard: twitterCard ?? null,
    language: language ?? null,
    statusCode,
    favicon,
    h1: h1.map(stripTags),
    h2: h2.map(stripTags).slice(0, 20),
    h3: h3.map(stripTags).slice(0, 20),
    wordCount,
    internalLinks,
    externalLinks,
    imageCount,
    imagesMissingAlt,
    hasRobots: !!robotsContent,
    robotsContent: robotsContent ?? null,
    checks,
    score,
  };
}

function pushCheck(
  arr: SeoAuditResult["checks"],
  id: string,
  label: string,
  value: string | null | undefined,
  spec: {
    pass: (v: string) => boolean;
    warn: (v: string) => boolean;
    passDetail: (v: string) => string;
    warnDetail: (v: string) => string;
    failDetail: string;
  },
) {
  if (!value) {
    arr.push({ id, label, status: "fail", detail: spec.failDetail });
    return;
  }
  if (spec.pass(value)) {
    arr.push({ id, label, status: "pass", detail: spec.passDetail(value) });
  } else if (spec.warn(value)) {
    arr.push({ id, label, status: "warn", detail: spec.warnDetail(value) });
  } else {
    arr.push({ id, label, status: "fail", detail: spec.failDetail });
  }
}

function extractTag(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function extractMeta(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]*\\sname=["']${escapeRe(name)}["'][^>]*\\scontent=["']([^"']*)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]*\\scontent=["']([^"']*)["'][^>]*\\sname=["']${escapeRe(name)}["']`,
    "i",
  );
  const m = html.match(re) || html.match(re2);
  return m ? decodeEntities(m[1]) : undefined;
}

function extractMetaProp(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]*\\sproperty=["']${escapeRe(property)}["'][^>]*\\scontent=["']([^"']*)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]*\\scontent=["']([^"']*)["'][^>]*\\sproperty=["']${escapeRe(property)}["']`,
    "i",
  );
  const m = html.match(re) || html.match(re2);
  return m ? decodeEntities(m[1]) : undefined;
}

function extractLink(html: string, rel: string): string | null {
  const re = new RegExp(
    `<link[^>]*\\srel=["']${escapeRe(rel)}["'][^>]*\\shref=["']([^"']*)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<link[^>]*\\shref=["']([^"']*)["'][^>]*\\srel=["']${escapeRe(rel)}["']`,
    "i",
  );
  const m = html.match(re) || html.match(re2);
  return m ? decodeEntities(m[1]) : null;
}

function extractAttr(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m ? m[1] : undefined;
}

function extractAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(re)) out.push(m[1]);
  return out;
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
