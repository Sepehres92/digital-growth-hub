import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Digital Agency OS" },
      { name: "description", content: "Terms governing your use of Digital Agency OS, including AI-content disclaimers and acceptable use." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="May 26, 2026">
      <p>By creating an account or using Digital Agency OS (the "Service"), you agree to these Terms.</p>

      <h2>1. Your account</h2>
      <p>You are responsible for the security of your credentials and for all activity under your account. Notify us immediately of any unauthorized access.</p>

      <h2>2. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Violate any law or third-party right;</li>
        <li>Upload content you do not own or have permission to use;</li>
        <li>Generate or distribute copyrighted logos, celebrity likenesses, deepfakes, fake identification documents, or misleading before-and-after claims;</li>
        <li>Impersonate any person or organization;</li>
        <li>Generate content that promotes violence, harassment, sexual content involving minors, or illegal goods/services;</li>
        <li>Reverse-engineer, scrape, or attempt to circumvent rate limits or access controls;</li>
        <li>Send unsolicited marketing (spam) using content generated on the Service.</li>
      </ul>

      <h2>3. AI-generated content</h2>
      <ul>
        <li>AI outputs may be inaccurate, biased, or incomplete. You must <strong>review and edit AI output before publishing or relying on it</strong>.</li>
        <li>AI outputs are not professional medical, legal, financial, or psychological advice. Do not present them as such.</li>
        <li>You retain ownership of your prompts and, subject to the underlying model provider's terms, the outputs you generate.</li>
        <li>We do not guarantee the originality, accuracy, or non-infringement of AI output.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>You own the content you upload and create. You grant us a limited license to host, process, and display that content solely to provide the Service to you. You represent that you have all necessary rights to the content you upload.</p>

      <h2>5. Privacy</h2>
      <p>Our handling of personal data is described in the <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms.</p>

      <h2>6. Service availability</h2>
      <p>We provide the Service on an "as is" and "as available" basis. We may modify, suspend, or discontinue features at any time. We are not liable for any data loss caused by your failure to export your data before deletion.</p>

      <h2>7. Disclaimer of warranties</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

      <h2>8. Limitation of liability</h2>
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL. OUR TOTAL LIABILITY ARISING FROM THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID US IN THE 12 MONTHS PRIOR TO THE CLAIM (OR USD 100 IF GREATER).</p>

      <h2>9. Indemnification</h2>
      <p>You agree to indemnify and hold us harmless from any claim arising from your content, your use of AI outputs, or your violation of these Terms.</p>

      <h2>10. Termination</h2>
      <p>You may delete your account at any time from Settings → Privacy. We may suspend or terminate accounts that violate these Terms.</p>

      <h2>11. Governing law</h2>
      <p>These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict-of-laws principles. The courts located in Toronto, Ontario shall have exclusive jurisdiction over any dispute arising from or related to these Terms or the Service.</p>

      <h2>12. Changes</h2>
      <p>We may update these Terms. Material changes will be announced in-app. Continued use after changes constitutes acceptance.</p>

      <h2>13. Contact</h2>
      <p>For legal questions, contact <a href="mailto:legal@example.com">legal@example.com</a>. For privacy and data requests, contact <a href="mailto:privacy@example.com">privacy@example.com</a>.</p>
    </LegalLayout>
  );
}
