import sanitizeHtml from "sanitize-html";

/**
 * Shared, maintained allowlist used BOTH when persisting rich text and when
 * rendering it. Never hand-roll regex sanitizing.
 */
export const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "div", "span", "b", "strong", "i", "em", "u", "s", "strike",
    "ul", "ol", "li", "blockquote", "code", "pre",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "a", "img", "hr", "font",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    font: ["face", "size", "color"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  allowedStyles: {
    "*": {
      color: [/^[\w#(),.%\s-]+$/],
      "background-color": [/^[\w#(),.%\s-]+$/],
      "font-family": [/^[\w\s,'"-]+$/],
      "font-size": [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
      "font-weight": [/^(?:normal|bold|[1-9]00)$/],
      "font-style": [/^(?:normal|italic)$/],
      "text-align": [/^(?:left|right|center|justify)$/],
      "text-decoration": [/^[\w\s-]+$/],
      "max-width": [/^\d+(?:\.\d+)?(?:px|%)$/],
      "border-radius": [/^\d+(?:\.\d+)?(?:px|%)$/],
      margin: [/^[\d.\spx%]+$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener noreferrer", target: "_blank" }),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html ?? "", RICH_TEXT_OPTIONS);
}
