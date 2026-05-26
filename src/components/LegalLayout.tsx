import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary" />
            <span className="font-semibold tracking-tight">Agency OS</span>
          </Link>
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <article className="prose prose-sm dark:prose-invert mt-8 max-w-none leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_p]:mt-3 [&_ul]:ml-6 [&_ul]:mt-3 [&_ul]:list-disc [&_li]:mt-1">
          {children}
        </article>
        <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          <span className="ml-auto">© 2026 Digital Agency OS</span>
        </footer>
      </main>
    </div>
  );
}
