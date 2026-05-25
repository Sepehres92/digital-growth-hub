import Firecrawl from "@mendable/firecrawl-js";

export type Platform =
  | "twitter"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "linkedin"
  | "twitch"
  | "github"
  | "pinterest"
  | "threads"
  | "reddit"
  | "discord"
  | "telegram"
  | "medium"
  | "substack";

const PLATFORM_PATTERNS: { platform: Platform; test: RegExp }[] = [
  { platform: "twitter", test: /(?:twitter\.com|x\.com)\/[^/?#]+/i },
  { platform: "instagram", test: /instagram\.com\/[^/?#]+/i },
  { platform: "tiktok", test: /tiktok\.com\/@[^/?#]+/i },
  { platform: "youtube", test: /(?:youtube\.com\/(?:@|channel\/|c\/|user\/)|youtu\.be\/)[^/?#]+/i },
  { platform: "facebook", test: /facebook\.com\/[^/?#]+/i },
  { platform: "linkedin", test: /linkedin\.com\/(?:in|company|school)\/[^/?#]+/i },
  { platform: "twitch", test: /twitch\.tv\/[^/?#]+/i },
  { platform: "github", test: /github\.com\/[^/?#]+/i },
  { platform: "pinterest", test: /pinterest\.[a-z.]+\/[^/?#]+/i },
  { platform: "threads", test: /threads\.net\/@[^/?#]+/i },
  { platform: "reddit", test: /reddit\.com\/(?:r|user)\/[^/?#]+/i },
  { platform: "discord", test: /discord\.(?:gg|com\/invite)\/[^/?#]+/i },
  { platform: "telegram", test: /t\.me\/[^/?#]+/i },
  { platform: "medium", test: /medium\.com\/@?[^/?#]+/i },
  { platform: "substack", test: /[a-z0-9-]+\.substack\.com/i },
];

export interface SocialLink {
  platform: Platform;
  url: string;
  handle: string;
}

function extractHandle(platform: Platform, url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (platform === "tiktok" || platform === "threads") return parts[0] ?? "";
    if (platform === "linkedin") return parts.slice(0, 2).join("/");
    if (platform === "youtube") return parts[0] ?? u.hostname;
    if (platform === "substack") return u.hostname.replace(".substack.com", "");
    return parts[0] ?? u.hostname;
  } catch {
    return url;
  }
}

function classifyLink(href: string): SocialLink | null {
  for (const { platform, test } of PLATFORM_PATTERNS) {
    if (test.test(href)) {
      const handle = extractHandle(platform, href).replace(/^@/, "");
      if (!handle || ["share", "sharer", "intent", "home", "explore"].includes(handle.toLowerCase()))
        return null;
      return { platform, url: href, handle };
    }
  }
  return null;
}

function getFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
  return new Firecrawl({ apiKey });
}

export async function detectSocialLinks(rawUrl: string): Promise<{
  source: string;
  title: string | null;
  links: SocialLink[];
}> {
  const firecrawl = getFirecrawl();
  const result: any = await firecrawl.scrape(rawUrl, {
    formats: ["links"],
    onlyMainContent: false,
  });
  const links: string[] = result.links ?? result.data?.links ?? [];
  const metadata = result.metadata ?? result.data?.metadata ?? {};

  const seen = new Set<string>();
  const social: SocialLink[] = [];
  for (const href of links) {
    const classified = classifyLink(href);
    if (!classified) continue;
    const key = `${classified.platform}:${classified.handle.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    social.push(classified);
  }

  return {
    source: metadata.sourceURL ?? rawUrl,
    title: metadata.title ?? null,
    links: social,
  };
}

export interface ProfileAnalysis {
  url: string;
  platform: Platform | "unknown";
  handle: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  ogImage: string | null;
  followers: string | null;
  following: string | null;
  posts: string | null;
  bio: string | null;
  recentTitles: string[];
}

const NUM_PATTERNS = [
  /([\d.,]+\s*[KMB]?)\s*(?:followers|subscribers|fans|likes)/i,
];

function findNumber(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

export async function analyzeProfile(rawUrl: string): Promise<ProfileAnalysis> {
  const firecrawl = getFirecrawl();
  const result: any = await firecrawl.scrape(rawUrl, {
    formats: ["markdown", "summary"],
    onlyMainContent: false,
    waitFor: 1500,
  });

  const markdown: string = result.markdown ?? result.data?.markdown ?? "";
  const summary: string = result.summary ?? result.data?.summary ?? "";
  const metadata = result.metadata ?? result.data?.metadata ?? {};
  const classified = classifyLink(rawUrl);

  const followers = findNumber(markdown, NUM_PATTERNS);
  const following = (markdown.match(/([\d.,]+\s*[KMB]?)\s*following/i) || [])[1] ?? null;
  const posts = (markdown.match(/([\d.,]+\s*[KMB]?)\s*(?:posts|videos|tweets|repos|streams)/i) ||
    [])[1] ?? null;

  // First few non-empty markdown headings as recent content titles
  const recentTitles = Array.from(markdown.matchAll(/^#{1,3}\s+(.+)$/gm))
    .map((m) => m[1].trim())
    .filter((t) => t.length > 0 && t.length < 200)
    .slice(0, 8);

  return {
    url: rawUrl,
    platform: classified?.platform ?? "unknown",
    handle: classified?.handle ?? "",
    title: metadata.title ?? null,
    description: metadata.description ?? null,
    summary: summary || null,
    ogImage: metadata.ogImage ?? null,
    followers,
    following,
    posts,
    bio: metadata.description ?? null,
    recentTitles,
  };
}

// ===== TikTok =====
const TIKTOK_GATEWAY = "https://connector-gateway.lovable.dev/tiktok";

export async function tiktokSelf() {
  const lovable = process.env.LOVABLE_API_KEY;
  const apiKey = process.env.TIKTOK_API_KEY;
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  if (!apiKey) throw new Error("TIKTOK_API_KEY is not configured");
  const fields =
    "open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count";
  const res = await fetch(`${TIKTOK_GATEWAY}/user/info/?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": apiKey,
    },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`TikTok API failed [${res.status}]: ${JSON.stringify(json)}`);
  return json?.data?.user ?? json;
}

export async function tiktokVideos(maxCount = 10) {
  const lovable = process.env.LOVABLE_API_KEY;
  const apiKey = process.env.TIKTOK_API_KEY;
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  if (!apiKey) throw new Error("TIKTOK_API_KEY is not configured");
  const fields =
    "id,title,video_description,duration,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time";
  const res = await fetch(`${TIKTOK_GATEWAY}/video/list/?fields=${fields}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ max_count: maxCount }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`TikTok video/list failed [${res.status}]: ${JSON.stringify(json)}`);
  return json?.data ?? json;
}

// ===== Twitch =====
const TWITCH_GATEWAY = "https://connector-gateway.lovable.dev/twitch";

async function twitchGet(path: string) {
  const lovable = process.env.LOVABLE_API_KEY;
  const apiKey = process.env.TWITCH_API_KEY;
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  if (!apiKey) throw new Error("TWITCH_API_KEY is not configured");
  const res = await fetch(`${TWITCH_GATEWAY}/${path}`, {
    headers: {
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": apiKey,
    },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(`Twitch ${path} failed [${res.status}]: ${JSON.stringify(json)}`);
  return json;
}

export async function twitchAnalyze(login: string) {
  const users = await twitchGet(`users?login=${encodeURIComponent(login)}`);
  const user = users?.data?.[0];
  if (!user) return { user: null, stream: null, channel: null };
  const [streams, channel] = await Promise.all([
    twitchGet(`streams?user_login=${encodeURIComponent(login)}`),
    twitchGet(`channels?broadcaster_id=${user.id}`),
  ]);
  return {
    user,
    stream: streams?.data?.[0] ?? null,
    channel: channel?.data?.[0] ?? null,
  };
}
