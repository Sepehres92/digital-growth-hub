import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Calendar } from "lucide-react";
import { submitDemoRequest } from "@/lib/demo-requests.functions";

export const Route = createFileRoute("/book-demo")({
  head: () => ({
    meta: [
      { title: "Book a Demo — Digital Agency OS" },
      { name: "description", content: "Book a personalized walkthrough of Digital Agency OS." },
      { property: "og:title", content: "Book a Demo — Digital Agency OS" },
      { property: "og:description", content: "Book a personalized walkthrough of Digital Agency OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookDemoPage,
});

function BookDemoPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendRequest = useServerFn(submitDemoRequest);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setLoading(true);
    try {
      await sendRequest({
        data: {
          name: String(form.get("name") ?? ""),
          company: String(form.get("company") ?? ""),
          email: String(form.get("email") ?? ""),
          message: String(form.get("message") ?? ""),
          website: String(form.get("website") ?? ""),
        },
      });
      setSent(true);
      toast.success("Request received — we'll be in touch.");
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "We couldn't send your request. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <Link to="/auth" className="text-sm font-medium">Sign in</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Book a demo</h1>
            <p className="text-sm text-muted-foreground">Tell us about your agency and we'll reach out within 1 business day.</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">Thanks — request received</h2>
            <p className="mt-2 text-sm text-muted-foreground">We'll email you shortly to schedule a time.</p>
            <Link to="/" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">Back to home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" required className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="message">What would you like to see?</Label>
              <Textarea id="message" rows={4} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Request demo"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Prefer email? <a href="mailto:hello@example.com" className="text-primary hover:underline">hello@example.com</a>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
