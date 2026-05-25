import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Users, Zap, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Agency OS — Run Your Agency on Autopilot" },
      {
        name: "description",
        content:
          "The all-in-one operating system for modern digital agencies. Manage leads, clients, and growth in one premium workspace.",
      },
      { property: "og:title", content: "Digital Agency OS" },
      {
        property: "og:description",
        content: "The all-in-one operating system for modern digital agencies.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary" />
            <span className="font-semibold tracking-tight">Agency OS</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            New • MVP launch
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Run your agency on{" "}
            <span className="text-primary">autopilot.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Digital Agency OS unifies your leads, clients, and pipeline in one
            premium workspace built for modern teams.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              Start free <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              See features
            </a>
          </div>
        </div>
      </header>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: "Lead CRM", desc: "Capture and qualify leads in seconds." },
            { icon: BarChart3, title: "Dashboards", desc: "Real-time pipeline insights." },
            { icon: Zap, title: "Automation", desc: "Move work forward, hands-free." },
            { icon: Shield, title: "Secure", desc: "Enterprise-grade auth and RLS." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
          <p className="text-sm opacity-70">© 2026 Digital Agency OS</p>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Launch console
          </Link>
        </div>
      </footer>
    </div>
  );
}
