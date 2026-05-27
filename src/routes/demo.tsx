import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Play } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Product Demo — Digital Agency OS" },
      { name: "description", content: "Watch a guided product tour of Digital Agency OS." },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <Link to="/book-demo" className="text-sm font-medium text-primary hover:underline">Book a live demo</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Product walkthrough</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">A guided tour of the platform — clients, AI content, scheduling, and the client portal.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid aspect-video place-items-center bg-gradient-to-br from-navy via-navy to-primary text-white">
            <div className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur">
                <Play className="size-7" />
              </div>
              <p className="mt-4 text-sm opacity-80">Demo video coming soon</p>
              <p className="mt-1 text-xs opacity-60">Mockup preview — not a real recording yet</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Try it free
          </Link>
          <Link to="/book-demo" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent">
            Book a live demo
          </Link>
        </div>
      </main>
    </div>
  );
}
