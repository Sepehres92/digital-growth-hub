import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy "/index" URL. Redirects permanently to "/" so the landing page has a
 * single canonical address instead of two indexable copies.
 */
export const Route = createFileRoute("/index")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
