import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Inbox, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      path: "/contact",
      title: "Contact — Digital Agency OS",
      description: "Send the Digital Agency OS team a message about the product, pricing, or your data. We reply from the contact form.",
    }),
  component: ContactPage,
});

function ContactPage() {
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
        <p className="mt-3 text-muted-foreground">
          The contact form is the only channel we currently monitor. Requests are stored securely
          and reviewed by our team — we have not published a public phone number or support inbox yet.
        </p>

        <div className="mt-10 space-y-4">
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Inbox className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Send us a message</div>
              <p className="text-sm text-muted-foreground">
                Product questions, pricing, partnerships, or a walkthrough of the platform.
              </p>
              <Link
                to="/book-demo"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Open the contact form <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Privacy and data requests</div>
              <p className="text-sm text-muted-foreground">
                If you already have an account, you can export or delete all of your data yourself
                from Account &amp; Privacy. Otherwise use the contact form and mark your message as a
                privacy request.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          We aim to respond to every message, but we do not currently publish a guaranteed response time.
        </p>
      </main>
    </div>
  );
}
