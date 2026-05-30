import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auditUrl } from "@/lib/seo-audit.functions";
import type { SeoAuditResult } from "@/lib/seo-audit.server";

export const Route = createFileRoute("/seo-audit")({
  head: () => ({
    meta: [
      { title: "SEO Audit — Digital Agency OS" },
      {
        name: "description",
        content:
          "Run a live SEO audit on any URL. Inspect title tags, meta description, Open Graph, headings, alt text, and indexability.",
      },
      { property: "og:title", content: "SEO Audit — Digital Agency OS" },
      {
        property: "og:description",
        content: "Live SEO audit — score any URL in seconds.",
      },
      { property: "og:url", content: "/seo-audit" },
    ],
    links: [{ rel: "canonical", href: "/seo-audit" }],
  }),
  component: SeoAuditPage,
});

function SeoAuditPage() {
  const audit = useServerFn(auditUrl);
  const [url, setUrl] = useState("");

  const mutation = useMutation({
    mutationFn: (target: string) => audit({ data: { url: target } }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    mutation.mutate(url.trim());
  };

  const result = mutation.data?.ok ? mutation.data.result : null;
  const error =
    mutation.data && !mutation.data.ok
      ? mutation.data.error
      : mutation.error instanceof Error
        ? mutation.error.message
        : null;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tighter uppercase">
          Vektra
        </Link>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
          <Link to="/search-console" className="text-muted-foreground hover:text-primary">
            Search Console
          </Link>
          <Link to="/semrush" className="text-muted-foreground hover:text-primary">
            Semrush
          </Link>
          <Link to="/social" className="text-muted-foreground hover:text-primary">
            Social
          </Link>
          <Link to="/" className="text-muted-foreground hover:text-primary">
            ← Back
          </Link>
        </div>
      </nav>

      {/* Hero / form */}
      <header className="relative pt-20 pb-12 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.35 0.12 275) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.4em] mb-4 block">
            SEO Sentinel
          </span>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tighter uppercase mb-6 text-balance">
            Audit any URL in seconds.
          </h1>
          <p className="text-muted-foreground mb-8 text-pretty">
            Live crawl of meta tags, headings, social cards, alt text, and
            indexability — scored against modern SEO best practices.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-surface/40 border border-border rounded-sm px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              maxLength={2048}
              required
              disabled={mutation.isPending}
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-primary/20"
            >
              {mutation.isPending ? "Auditing..." : "Run Audit"}
            </button>
          </form>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        {mutation.isPending && <LoadingState />}
        {error && (
          <div className="bg-destructive/10 border border-destructive/40 rounded-sm p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-destructive mb-2">
              Audit failed
            </p>
            <p className="text-sm text-foreground/80">{error}</p>
          </div>
        )}
        {result && <ResultView result={result} />}
        {!mutation.isPending && !error && !result && <EmptyState />}
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="border border-border rounded-sm p-12 text-center">
      <div className="inline-block size-3 rounded-full bg-primary animate-pulse mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Crawling page · analyzing metadata
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded-sm p-12 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Enter a URL above to begin
      </p>
    </div>
  );
}

function ResultView({ result }: { result: SeoAuditResult }) {
  return (
    <div className="space-y-4">
      {/* Score + summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-surface/40 border border-border rounded-sm p-8 flex flex-col items-center justify-center">
          <span className="font-mono text-[10px] uppercase text-primary tracking-[0.3em] mb-3">
            SEO Score
          </span>
          <span className="font-display text-7xl text-foreground leading-none">
            {result.score}
          </span>
          <span className="font-mono text-xs text-muted-foreground mt-2">/ 100</span>
        </div>

        <div className="md:col-span-8 bg-surface/40 border border-border rounded-sm p-6 space-y-3">
          <Field label="URL" value={result.url} mono />
          <Field label="Title" value={result.title} highlight />
          <Field label="Description" value={result.description} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <Metric label="Words" value={result.wordCount.toLocaleString()} />
            <Metric label="Links" value={`${result.internalLinks}/${result.externalLinks}`} sub="int/ext" />
            <Metric label="Images" value={String(result.imageCount)} />
            <Metric
              label="Status"
              value={result.statusCode ? String(result.statusCode) : "—"}
            />
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="bg-surface/40 border border-border rounded-sm p-6">
        <h2 className="font-display text-lg uppercase mb-4">Audit Checklist</h2>
        <ul className="divide-y divide-border/40">
          {result.checks.map((c) => (
            <li key={c.id} className="py-3 flex items-start gap-4">
              <StatusDot status={c.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {c.detail}
                </p>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest font-bold shrink-0 ${
                  c.status === "pass"
                    ? "text-primary"
                    : c.status === "warn"
                      ? "text-amber-400"
                      : "text-destructive"
                }`}
              >
                {c.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Headings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeadingsBlock label="H1" items={result.h1} />
        <HeadingsBlock label="H2" items={result.h2} />
      </div>

      {/* Social preview */}
      {(result.ogTitle || result.ogDescription || result.ogImage) && (
        <div className="bg-surface/40 border border-border rounded-sm p-6">
          <h2 className="font-display text-lg uppercase mb-4">Social Preview</h2>
          <div className="border border-border/60 rounded-sm overflow-hidden max-w-md">
            {result.ogImage && (
              <img
                src={result.ogImage}
                alt="Open Graph preview"
                className="w-full aspect-[1.91/1] object-cover bg-background"
                loading="lazy"
              />
            )}
            <div className="p-4 bg-background/60">
              <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-1">
                {safeHost(result.url)}
              </p>
              <p className="text-sm font-semibold leading-snug">
                {result.ogTitle ?? result.title ?? "(no title)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {result.ogDescription ?? result.description ?? ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: "pass" | "warn" | "fail" }) {
  const cls =
    status === "pass"
      ? "bg-primary"
      : status === "warn"
        ? "bg-amber-400"
        : "bg-destructive";
  return <span className={`mt-1.5 size-2 rounded-full shrink-0 ${cls}`} />;
}

function Field({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-1">
        {label}
      </p>
      <p
        className={`text-sm break-words ${mono ? "font-mono" : ""} ${
          highlight ? "text-foreground font-semibold" : "text-foreground/90"
        }`}
      >
        {value ?? <span className="text-muted-foreground italic">— not set —</span>}
      </p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
        {label}
      </p>
      <p className="font-display text-xl text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function HeadingsBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="bg-surface/40 border border-border rounded-sm p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-sm uppercase">{label}</h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {items.length} found
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None on page</p>
      ) : (
        <ul className="space-y-2">
          {items.map((h, i) => (
            <li key={i} className="text-sm text-foreground/80 truncate">
              {h || <span className="text-muted-foreground italic">(empty)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}
