import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MessageSquare, Shield } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Digital Agency OS" },
      { name: "description", content: "Get in touch with the Digital Agency OS team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const channels = [
    { i: Mail, t: "General", e: "hello@example.com", d: "Sales, partnerships, and general questions" },
    { i: MessageSquare, t: "Support", e: "support@example.com", d: "Help with your account or the product" },
    { i: Shield, t: "Privacy & Legal", e: "privacy@example.com", d: "Data requests, legal notices, GDPR/CCPA" },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact us</h1>
        <p className="mt-3 text-muted-foreground">Reach the right team directly. Replace these placeholders with your real addresses when you launch.</p>

        <div className="mt-10 space-y-4">
          {channels.map((c) => (
            <div key={c.t} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <c.i className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.t}</div>
                <p className="text-sm text-muted-foreground">{c.d}</p>
                <a href={`mailto:${c.e}`} className="mt-1 inline-block text-sm font-medium text-primary hover:underline break-all">{c.e}</a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <strong className="text-foreground">Mailing address (placeholder):</strong><br />
          Digital Agency OS, Toronto, Ontario, Canada
        </div>
      </main>
    </div>
  );
}
