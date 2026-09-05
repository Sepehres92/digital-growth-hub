import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";

/**
 * Catch-all for unknown URLs.
 *
 * Throwing notFound() from the loader makes the server respond with a real
 * HTTP 404 status (not a soft 200), and the head() below marks the page
 * noindex with 404-appropriate metadata.
 */
export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  head: () =>
    pageHead({
      path: "/404",
      title: "Page not found (404) — Digital Agency OS",
      description: "The page you requested does not exist or has been moved.",
      noindex: true,
    }),
  component: NotFoundPage,
  notFoundComponent: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-foreground">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
