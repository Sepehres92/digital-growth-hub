/**
 * Read-only security regression checks (no records are created or modified).
 *
 *   node tests/security-regression.mjs
 *
 * Verifies:
 *  1. Anonymous clients cannot read unpublished or future-dated blog posts.
 *  2. Anonymous clients can read published blog posts (public blog still works).
 *  3. Anonymous clients are denied any access to social_account_tokens.
 *  4. The service role can still read social_account_tokens (server paths work).
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
const anonKey = env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

async function rest(path, key) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return { status: res.status, body: await res.text() };
}

// 1. anon cannot see drafts / future posts
const drafts = await rest("blog_posts?select=id&published=eq.false", anonKey);
check(
  "anon cannot read unpublished posts",
  drafts.status === 200 && JSON.parse(drafts.body).length === 0,
  drafts.body.slice(0, 120),
);

const future = await rest(
  `blog_posts?select=id&published_at=gt.${new Date().toISOString()}`,
  anonKey,
);
check(
  "anon cannot read future-dated posts",
  future.status === 200 && JSON.parse(future.body).length === 0,
  future.body.slice(0, 120),
);

// 2. published posts remain publicly readable
const pub = await rest("blog_posts?select=id,title&published=eq.true&limit=5", anonKey);
check("public blog still readable by anon", pub.status === 200, `status ${pub.status}`);

// 3. anon denied on token store
const anonTokens = await rest("social_account_tokens?select=access_token&limit=1", anonKey);
check(
  "anon denied on social_account_tokens",
  anonTokens.status >= 400 || JSON.parse(anonTokens.body || "[]").length === 0,
  `status ${anonTokens.status}`,
);

// 4. service role still works
if (serviceKey) {
  const svc = await rest("social_account_tokens?select=account_id&limit=1", serviceKey);
  check("service role can read social_account_tokens", svc.status === 200, `status ${svc.status}`);
} else {
  check("service role check skipped (no key in env)", true);
}

for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} ${r.detail}`);
if (results.some((r) => !r.ok)) process.exit(1);
console.log("\nAll security regression checks passed.");
