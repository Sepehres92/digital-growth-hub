import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Digital Agency OS" },
      { name: "description", content: "How Digital Agency OS protects your data." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <LegalLayout title="Security" updated="May 27, 2026">
      <p>We take security seriously. This page describes the protections we have in place today and the practices we follow. We avoid claims we cannot stand behind.</p>

      <h2>What is in place today</h2>
      <ul>
        <li><strong>Encryption in transit:</strong> all traffic uses HTTPS (TLS) end-to-end.</li>
        <li><strong>Encryption at rest:</strong> data and uploaded files are stored on managed cloud infrastructure that encrypts data at rest by default.</li>
        <li><strong>Authentication:</strong> email/password and Google sign-in, with secure session tokens.</li>
        <li><strong>Authorization:</strong> Row-Level Security (RLS) policies enforce per-user and per-client data isolation at the database layer.</li>
        <li><strong>Role-based access:</strong> roles are stored in a separate <code>user_roles</code> table and checked via a security-definer function — they cannot be elevated from the client.</li>
        <li><strong>Audit logs:</strong> sensitive actions write to an audit log for review.</li>
        <li><strong>Secret management:</strong> API keys and service credentials are kept in server-side environment variables, never shipped to the browser.</li>
      </ul>

      <h2>What we do not yet claim</h2>
      <p>To stay honest, we do not currently advertise:</p>
      <ul>
        <li>SOC 2 / ISO 27001 certification</li>
        <li>A specific uptime SLA</li>
        <li>On-upload virus scanning</li>
        <li>Penetration test reports</li>
      </ul>
      <p>If your organization requires any of the above, contact us at <a href="mailto:privacy@example.com">privacy@example.com</a> and we'll discuss what's possible.</p>

      <h2>Reporting a vulnerability</h2>
      <p>If you believe you've found a security issue, email <a href="mailto:security@example.com">security@example.com</a> with steps to reproduce. Please do not publicly disclose the issue until we've had a reasonable chance to investigate.</p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Protect your account credentials and use a strong, unique password.</li>
        <li>Only upload content you have the rights to share.</li>
        <li>Use role permissions to limit teammate access to what they need.</li>
      </ul>
    </LegalLayout>
  );
}
