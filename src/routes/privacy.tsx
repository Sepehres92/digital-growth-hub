import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Digital Agency OS" },
      { name: "description", content: "How Digital Agency OS collects, uses, and protects your personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 26, 2026">
      <p>
        This Privacy Policy explains how Digital Agency OS ("we", "us") collects, uses, and protects
        information when you use our application (the "Service"). We are committed to data minimization
        and to your rights under GDPR (EU/UK), PIPEDA (Canada), and CCPA (California).
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address, password hash, display name, agency name.</li>
        <li><strong>Workspace data you create:</strong> clients, campaigns, leads, tasks, blog posts, AI prompts and outputs, uploaded images.</li>
        <li><strong>Technical data:</strong> IP address, browser type, timestamps, and audit logs of security-relevant actions.</li>
      </ul>
      <p>We do not collect payment card data, biometric data, or special-category personal data.</p>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide and operate the Service (display your data, run AI generations, send password resets).</li>
        <li>To secure your account (detect abuse, enforce access control).</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>We do not sell your personal data. We do not use your data to train third-party AI models.</p>

      <h2>3. AI-generated content</h2>
      <p>
        Prompts you submit to AI features are sent to our AI Gateway provider solely to produce the
        requested output. Outputs are stored in your account. You are responsible for reviewing AI
        outputs before use, especially in regulated contexts (legal, medical, financial).
      </p>

      <h2>4. Sharing</h2>
      <p>We share data only with infrastructure providers that process it on our behalf under contract:</p>
      <ul>
        <li>Lovable Cloud (database, authentication, file storage)</li>
        <li>Lovable AI Gateway (AI model providers, for prompt processing only)</li>
      </ul>

      <h2>5. Data retention</h2>
      <p>
        We retain account and workspace data for as long as your account is active. Audit logs are
        retained for up to 12 months. When you delete your account, your workspace data is removed
        within 30 days.
      </p>

      <h2>6. Your rights</h2>
      <p>You can, at any time, from Settings → Privacy:</p>
      <ul>
        <li>Export a copy of your personal data (right to portability).</li>
        <li>Delete your account and associated data (right to erasure).</li>
      </ul>
      <p>To exercise other rights (access, rectification, restriction, objection, complaint to a supervisory authority), contact us at the email on our website.</p>

      <h2>7. International transfers</h2>
      <p>Your data may be processed in countries outside your region. Where required, we rely on Standard Contractual Clauses or equivalent safeguards.</p>

      <h2>8. Security</h2>
      <p>We protect data with encryption in transit (TLS), encryption at rest, row-level access control, server-side secret storage, and audit logging.</p>

      <h2>9. Children</h2>
      <p>The Service is not directed to children under 16 and we do not knowingly collect their data.</p>

      <h2>10. Changes</h2>
      <p>We will update this policy when our practices change. Material changes will be announced in-app.</p>
    </LegalLayout>
  );
}
