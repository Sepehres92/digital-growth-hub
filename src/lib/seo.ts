/**
 * Central SEO metadata helper.
 *
 * Every public route builds its head() from `pageHead()` so canonical and
 * og:url are always absolute URLs on the production host, and every page
 * ships a complete, route-appropriate social card.
 */

export const SITE_URL = "https://impact-reach-tool.lovable.app";
export const SITE_NAME = "Digital Agency OS";

/** Real file shipped in /public — resolves to an absolute https URL. */
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageHeadInput = {
  /** Route path, e.g. "/contact". Use "/" for the landing page. */
  path: string;
  title: string;
  description: string;
  /** Defaults to the shared social card. */
  image?: string;
  /** "website" (default) or "article". */
  type?: "website" | "article";
  /** Keep the page out of search results (404s, auth screens). */
  noindex?: boolean;
};

export function pageHead({
  path,
  title,
  description,
  image = OG_IMAGE,
  type = "website",
  noindex = false,
}: PageHeadInput) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
