import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Digital Agency OS" },
      { name: "description", content: "How Digital Agency OS uses cookies and local storage." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="May 26, 2026">
      <p>Digital Agency OS uses only the minimum browser storage required to operate the Service.</p>

      <h2>Strictly necessary cookies and local storage</h2>
      <ul>
        <li><strong>Authentication tokens</strong> — stored in your browser's local storage to keep you signed in. Without these, you would have to sign in on every page load.</li>
        <li><strong>UI preferences</strong> — your theme choice (light/dark) is stored on your profile.</li>
      </ul>

      <h2>Cookies we do not use</h2>
      <p>We do not use advertising cookies, marketing cookies, cross-site tracking, third-party analytics, or social-media pixels.</p>

      <h2>Managing storage</h2>
      <p>You can clear cookies and local storage at any time from your browser settings. Doing so will sign you out of the Service.</p>

      <h2>Updates</h2>
      <p>If we introduce optional analytics or marketing cookies in the future, we will add a consent banner and update this page before doing so.</p>
    </LegalLayout>
  );
}
