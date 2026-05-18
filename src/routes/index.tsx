import { createFileRoute } from "@tanstack/react-router";
import attributionChart from "@/assets/attribution-chart.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vektra — Command Your Entire Market Footprint" },
      {
        name: "description",
        content:
          "All-in-one digital marketing platform unifying SEO, social, email, and analytics into a high-fidelity mission control console.",
      },
      { property: "og:title", content: "Vektra — Integrated Growth Engine" },
      {
        property: "og:description",
        content:
          "Unified SEO, social, and email intelligence for modern growth teams.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-display text-xl tracking-tighter uppercase">
            Vektra
          </span>
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground uppercase tracking-widest">
            <a href="#platform" className="hover:text-primary transition-colors">
              Platform
            </a>
            <a href="#solutions" className="hover:text-primary transition-colors">
              Solutions
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </a>
          </div>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all">
          Launch Console
        </button>
      </nav>

      {/* Hero */}
      <header className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.35 0.12 275) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.4em] mb-4 block animate-reveal">
            Integrated Growth Engine
          </span>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter uppercase mb-8 text-balance animate-reveal [animation-delay:100ms]">
            Command your <span className="text-primary">entire</span> market
            footprint.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 text-pretty animate-reveal [animation-delay:200ms]">
            Unified SEO, social, and email intelligence delivered through a
            high-fidelity dashboard built for growth teams.
          </p>
        </div>
      </header>

      {/* Bento Grid */}
      <section
        id="platform"
        className="max-w-7xl mx-auto px-6 pb-24"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-4 gap-4 h-auto md:h-[850px]">
          {/* Analytics */}
          <div className="md:col-span-7 md:row-span-4 bg-surface/40 border border-border rounded-lg p-8 flex flex-col justify-between group hover:border-primary/50 transition-colors animate-reveal [animation-delay:300ms]">
            <div>
              <span className="font-mono text-[10px] uppercase text-primary mb-2 block">
                Global Analytics
              </span>
              <h3 className="font-display text-2xl uppercase">
                Real-time Attribution
              </h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                Track every conversion across 12+ channels with sub-second
                latency.
              </p>
            </div>
            <div className="w-full aspect-[2/1] bg-background/60 border border-border/50 rounded mt-8 overflow-hidden">
              <img
                src={attributionChart}
                alt="Real-time marketing attribution chart"
                width={1600}
                height={800}
                loading="lazy"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>

          {/* SEO Sentinel */}
          <div className="md:col-span-5 md:row-span-3 bg-surface/40 border border-border rounded-lg p-6 flex flex-col animate-reveal [animation-delay:400ms]">
            <div className="mb-6">
              <h3 className="font-display text-lg uppercase">SEO Sentinel</h3>
              <p className="text-muted-foreground text-xs uppercase tracking-tighter">
                Live SERP Monitoring
              </p>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { kw: "enterprise-saas.com", tag: "+4 POS", hot: true },
                { kw: "growth-marketing", tag: "TOP 3", hot: true },
                { kw: "dashboard-ui-kit", tag: "STABLE", hot: false },
                { kw: "ai-copy-engine", tag: "+2 POS", hot: true },
              ].map((row) => (
                <div
                  key={row.kw}
                  className="h-12 border-b border-border/40 flex items-center justify-between px-2"
                >
                  <span className="text-sm">{row.kw}</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      row.hot ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {row.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Synthesizer */}
          <div className="md:col-span-5 md:row-span-1 bg-primary border border-primary/20 rounded-lg p-8 text-primary-foreground flex flex-col justify-end animate-reveal [animation-delay:500ms]">
            <h3 className="font-display text-2xl uppercase mb-2">
              AI Synthesizer
            </h3>
            <p className="text-primary-foreground/80 text-sm">
              Generate high-converting ad copy based on real-time competitor
              analysis.
            </p>
          </div>

          {/* Social Pulse */}
          <div className="md:col-span-4 md:row-span-1 bg-surface/40 border border-border rounded-lg p-6 animate-reveal [animation-delay:600ms]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-sm uppercase">Social Pulse</h3>
              <div className="size-2 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-16 w-1/3 bg-background/40 rounded border border-border/50" />
              <div className="h-16 w-1/3 bg-background/40 rounded border border-border/50" />
              <div className="h-16 w-1/3 bg-background/40 rounded border border-border/50" />
            </div>
          </div>

          {/* Inbox metric */}
          <div className="md:col-span-3 md:row-span-1 bg-surface/40 border border-border rounded-lg p-6 flex flex-col justify-center animate-reveal [animation-delay:700ms]">
            <span className="font-mono text-3xl font-bold text-primary mb-1">
              98.4%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Inbox Delivery
            </span>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer
        id="pricing"
        className="border-t border-border/20 py-20 px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-left">
            <h2 className="font-display text-3xl uppercase mb-4">
              Ready to deploy?
            </h2>
            <p className="text-muted-foreground">
              Join 400+ data-driven marketing teams.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="border border-border hover:bg-surface text-foreground px-8 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all">
              Book Demo
            </button>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-primary/20">
              Start Trial
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
