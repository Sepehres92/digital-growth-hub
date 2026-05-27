import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/upload-ownership-policy")({
  head: () => ({
    meta: [
      { title: "Upload & Ownership Policy — Digital Agency OS" },
      { name: "description", content: "Who owns the content you upload, and the rights you grant." },
    ],
  }),
  component: UploadPolicyPage,
});

function UploadPolicyPage() {
  return (
    <LegalLayout title="Upload & Ownership Policy" updated="May 27, 2026">
      <h2>You own your content</h2>
      <p>You retain full ownership of the files, images, video, copy, and other content you upload to Digital Agency OS ("Your Content"). We do not claim ownership of Your Content.</p>

      <h2>License you grant us</h2>
      <p>To operate the Service, you grant us a limited, worldwide, non-exclusive, royalty-free license to host, store, process, transmit, display, and back up Your Content solely to:</p>
      <ul>
        <li>Provide the Service to you and your authorized clients/teammates;</li>
        <li>Generate previews, thumbnails, and format conversions;</li>
        <li>Publish content to third-party platforms when you instruct us to (e.g. social scheduler);</li>
        <li>Comply with legal obligations and respond to lawful requests.</li>
      </ul>
      <p>This license ends when you delete the content or your account, except where we must retain it for legal or backup reasons for a limited period.</p>

      <h2>Your warranties</h2>
      <p>By uploading content you confirm that:</p>
      <ul>
        <li>You own the content, or have a valid license to use it (including stock licenses, model releases, and brand permissions);</li>
        <li>The content does not infringe third-party copyright, trademark, publicity, or privacy rights;</li>
        <li>The content complies with our <a href="/ai-content-policy">AI Content Policy</a> and applicable laws.</li>
      </ul>

      <h2>Client content</h2>
      <p>When you upload content on behalf of a client, you confirm you have authority from that client to do so. Each client's content is stored in an isolated scope and is not accessible to other clients.</p>

      <h2>Reporting infringement</h2>
      <p>If you believe content on the platform infringes your rights, send a takedown request to <a href="mailto:legal@example.com">legal@example.com</a> with: a description of the work, the URL or file at issue, your contact details, and a statement made under penalty of perjury that you're authorized to act.</p>

      <h2>Removal and termination</h2>
      <p>We may remove content that violates this policy or applicable law, and may suspend or terminate accounts that repeatedly infringe third-party rights.</p>
    </LegalLayout>
  );
}
