import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getGscSites, getGscReport } from "@/lib/gsc.functions";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export const Route = createFileRoute("/search-console")({
  head: () => ({
    meta: [
      { title: "Search Console — Digital Agency OS" },
      {
        name: "description",
        content:
          "Live Google Search Console data: clicks, impressions, CTR, and top queries for your verified properties.",
      },
      { property: "og:title", content: "Search Console — Digital Agency OS" },
      {
        property: "og:description",
        content: "Clicks, impressions, CTR, and top queries from your verified Search Console properties.",
      },
    ],
  }),
  component: GscPage,
});

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}
function fmtPos(n: number) {
  return n ? n.toFixed(1) : "—";
}

type ByDateRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

function TrendChart({ rows }: { rows: ByDateRow[] }) {
  const data = rows
    .slice()
    .sort((a, b) => a.keys[0].localeCompare(b.keys[0]))
    .map((r) => ({
      date: r.keys[0].slice(5),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(2),
    }));

  if (!data.length) {
    return <div className="text-sm text-muted-foreground py-8 text-center">No trend data.</div>;
  }

  const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 };

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axis} />
          <YAxis yAxisId="left" {...axis} />
          <YAxis yAxisId="right" orientation="right" {...axis} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }} />
          <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="oklch(0.7 0.18 275)" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="oklch(0.75 0.15 200)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" {...axis} />
          <YAxis yAxisId="left" {...axis} unit="%" />
          <YAxis yAxisId="right" orientation="right" reversed {...axis} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }} />
          <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR %" stroke="oklch(0.8 0.18 145)" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="position" name="Avg. Position" stroke="oklch(0.75 0.18 40)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


function GscPage() {
  const sitesFn = useServerFn(getGscSites);
  const reportFn = useServerFn(getGscReport);
  const [site, setSite] = useState<string>("");
  const [days, setDays] = useState<number>(28);

  const sitesQuery = useQuery({
    queryKey: ["gsc-sites"],
    queryFn: () => sitesFn(),
  });

  useEffect(() => {
    if (!site && sitesQuery.data?.sites?.length) {
      setSite(sitesQuery.data.sites[0].siteUrl);
    }
  }, [sitesQuery.data, site]);

  const reportQuery = useQuery({
    queryKey: ["gsc-report", site, days],
    queryFn: () => reportFn({ data: { siteUrl: site, days } }),
    enabled: !!site,
  });

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
          <span className="text-primary">Search Console</span>
          <Link to="/semrush" className="text-muted-foreground hover:text-primary">
            Semrush
          </Link>
          <Link to="/social" className="text-muted-foreground hover:text-primary">
            Social
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">
            Live Google Search Console
          </p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-3">
            Search Performance
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Real clicks, impressions, CTR, and top queries pulled directly from your verified
            Google Search Console properties.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 border border-border/60 rounded-md bg-card">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Property
            </label>
            {sitesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading sites…</div>
            ) : sitesQuery.error ? (
              <div className="text-sm text-destructive">
                {(sitesQuery.error as Error).message}
              </div>
            ) : !sitesQuery.data?.sites?.length ? (
              <div className="text-sm text-muted-foreground">
                No verified properties on this Google account.
              </div>
            ) : (
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm"
              >
                {sitesQuery.data.sites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl} ({s.permissionLevel})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Range
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-background border border-border rounded-sm px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {reportQuery.isLoading && site && (
          <div className="text-sm text-muted-foreground">Fetching report…</div>
        )}
        {reportQuery.error && (
          <div className="p-4 border border-destructive/40 bg-destructive/10 text-destructive text-sm rounded-md">
            {(reportQuery.error as Error).message}
          </div>
        )}

        {reportQuery.data && (
          <>
            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Clicks", value: fmtNum(reportQuery.data.totals.clicks) },
                { label: "Impressions", value: fmtNum(reportQuery.data.totals.impressions) },
                { label: "CTR", value: fmtPct(reportQuery.data.totals.ctr) },
                { label: "Avg. Position", value: fmtPos(reportQuery.data.totals.position) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border border-border/60 rounded-md bg-card p-5"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {s.label}
                  </div>
                  <div className="font-display text-3xl tracking-tighter">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            <section className="mb-10">
              <h2 className="font-display text-2xl tracking-tighter mb-4">Trend</h2>
              <div className="border border-border/60 rounded-md bg-card p-4">
                <TrendChart rows={reportQuery.data.byDate} />
              </div>
            </section>



            {/* Top queries */}
            <section className="mb-10">
              <h2 className="font-display text-2xl tracking-tighter mb-4">Top Queries</h2>
              <div className="border border-border/60 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Query</th>
                      <th className="text-right px-4 py-3">Clicks</th>
                      <th className="text-right px-4 py-3">Impr.</th>
                      <th className="text-right px-4 py-3">CTR</th>
                      <th className="text-right px-4 py-3">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportQuery.data.queries.map((r, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="px-4 py-2 font-medium">{r.keys[0]}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(r.clicks)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(r.impressions)}</td>
                        <td className="px-4 py-2 text-right">{fmtPct(r.ctr)}</td>
                        <td className="px-4 py-2 text-right">{fmtPos(r.position)}</td>
                      </tr>
                    ))}
                    {!reportQuery.data.queries.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                          No query data for this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Top pages */}
            <section>
              <h2 className="font-display text-2xl tracking-tighter mb-4">Top Pages</h2>
              <div className="border border-border/60 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Page</th>
                      <th className="text-right px-4 py-3">Clicks</th>
                      <th className="text-right px-4 py-3">Impr.</th>
                      <th className="text-right px-4 py-3">CTR</th>
                      <th className="text-right px-4 py-3">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportQuery.data.pages.map((r, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="px-4 py-2 font-medium truncate max-w-[320px]">
                          <a
                            href={r.keys[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary"
                          >
                            {r.keys[0]}
                          </a>
                        </td>
                        <td className="px-4 py-2 text-right">{fmtNum(r.clicks)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(r.impressions)}</td>
                        <td className="px-4 py-2 text-right">{fmtPct(r.ctr)}</td>
                        <td className="px-4 py-2 text-right">{fmtPos(r.position)}</td>
                      </tr>
                    ))}
                    {!reportQuery.data.pages.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                          No page data for this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
