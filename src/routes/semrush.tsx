import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  getSemrushKeywords,
  getSemrushBacklinks,
  getSemrushCompetitors,
  compareSemrushDomains,
} from "@/lib/semrush.functions";
import type { SemrushTable } from "@/lib/semrush.server";

export const Route = createFileRoute("/semrush")({
  head: () => ({
    meta: [
      { title: "Semrush — Vektra" },
      {
        name: "description",
        content:
          "Live Semrush data: keyword rankings, backlink profile, and competitor comparison for any domain.",
      },
    ],
  }),
  component: SemrushPage,
});

type Tab = "keywords" | "backlinks" | "competitors" | "compare";

function DataTable({ table, max = 25 }: { table: SemrushTable; max?: number }) {
  if (!table.rows.length) {
    return <div className="text-sm text-muted-foreground py-6 text-center">No data.</div>;
  }
  const cols = table.columnNames;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            {cols.map((c) => (
              <th key={c} className="text-left px-3 py-3 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.slice(0, max).map((r, i) => (
            <tr key={i} className="border-t border-border/40">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 whitespace-nowrap">
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SemrushPage() {
  const keywordsFn = useServerFn(getSemrushKeywords);
  const backlinksFn = useServerFn(getSemrushBacklinks);
  const competitorsFn = useServerFn(getSemrushCompetitors);
  const compareFn = useServerFn(compareSemrushDomains);

  const [tab, setTab] = useState<Tab>("keywords");
  const [domain, setDomain] = useState("");
  const [database, setDatabase] = useState("us");
  const [compareInput, setCompareInput] = useState("");

  const kw = useMutation({ mutationFn: () => keywordsFn({ data: { domain, database } }) });
  const bl = useMutation({ mutationFn: () => backlinksFn({ data: { domain, database } }) });
  const co = useMutation({ mutationFn: () => competitorsFn({ data: { domain, database } }) });
  const cmp = useMutation({
    mutationFn: () =>
      compareFn({
        data: {
          domains: compareInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          database,
        },
      }),
  });

  const run = () => {
    if (tab === "keywords") kw.mutate();
    else if (tab === "backlinks") bl.mutate();
    else if (tab === "competitors") co.mutate();
    else cmp.mutate();
  };

  const active =
    tab === "keywords" ? kw : tab === "backlinks" ? bl : tab === "competitors" ? co : cmp;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tighter uppercase">
          Vektra
        </Link>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
          <Link to="/seo-audit" className="text-muted-foreground hover:text-primary">
            SEO Audit
          </Link>
          <Link to="/search-console" className="text-muted-foreground hover:text-primary">
            Search Console
          </Link>
          <span className="text-primary">Semrush</span>
          <Link to="/social" className="text-muted-foreground hover:text-primary">
            Social
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            Live Semrush
          </p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-3">
            Keywords, Backlinks & Competitors
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Pull live rankings, search volume, referring domains, anchors, and competitor metrics
            for any domain through your connected Semrush account.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["keywords", "backlinks", "competitors", "compare"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border rounded-sm transition ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 border border-border/60 rounded-md bg-card">
          {tab === "compare" ? (
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Domains (comma-separated, 2–5)
              </label>
              <input
                value={compareInput}
                onChange={(e) => setCompareInput(e.target.value)}
                placeholder="example.com, competitor.com"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Domain
              </label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Database
            </label>
            <select
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="bg-background border border-border rounded-sm px-3 py-2 text-sm"
            >
              {["us", "uk", "de", "fr", "es", "it", "au", "ca", "br", "in", "nl"].map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              disabled={active.isPending}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-sm disabled:opacity-50"
            >
              {active.isPending ? "Loading…" : "Run"}
            </button>
          </div>
        </div>

        {active.error && (
          <div className="p-4 border border-destructive/40 bg-destructive/10 text-destructive text-sm rounded-md mb-6">
            {(active.error as Error).message}
          </div>
        )}

        {tab === "keywords" && kw.data && (
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-3">Domain Overview</h2>
              <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                <DataTable table={kw.data.overview} />
              </div>
            </section>
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-3">Top Organic Keywords</h2>
              <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                <DataTable table={kw.data.keywords} max={50} />
              </div>
            </section>
          </div>
        )}

        {tab === "backlinks" && bl.data && (
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-3">Backlink Overview</h2>
              <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                <DataTable table={bl.data.overview} />
              </div>
            </section>
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-3">Referring Domains</h2>
              <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                <DataTable table={bl.data.refDomains} />
              </div>
            </section>
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-3">Top Anchors</h2>
              <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                <DataTable table={bl.data.anchors} />
              </div>
            </section>
          </div>
        )}

        {tab === "competitors" && co.data && (
          <section>
            <h2 className="font-display text-2xl tracking-tighter mb-3">Organic Competitors</h2>
            <div className="border border-border/60 rounded-md overflow-hidden bg-card">
              <DataTable table={co.data.competitors} />
            </div>
          </section>
        )}

        {tab === "compare" && cmp.data && (
          <div className="space-y-8">
            {cmp.data.results.map((r) => (
              <section key={r.domain}>
                <h2 className="font-display text-2xl tracking-tighter mb-3">{r.domain}</h2>
                <div className="border border-border/60 rounded-md overflow-hidden bg-card">
                  <DataTable table={r.overview} />
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
