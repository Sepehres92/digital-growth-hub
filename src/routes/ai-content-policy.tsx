import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/ai-content-policy")({
  head: () => ({
    meta: [
      { title: "AI Content Policy — Digital Agency OS" },
      { name: "description", content: "Rules for using AI-generated content on Digital Agency OS." },
    ],
  }),
  component: AIPolicyPage,
});

function AIPolicyPage() {
  return (
    <LegalLayout title="AI Content Policy" updated="May 27, 2026">
      <p>Digital Agency OS provides AI tools for text, image, and video generation. This policy explains what's allowed, what's not, and your responsibilities as the publisher of AI output.</p>

      <h2>You are the publisher</h2>
      <ul>
        <li>You must <strong>review and edit AI output before publishing</strong> or relying on it for a client.</li>
        <li>You are responsible for the accuracy, legality, and appropriateness of anything you publish from the platform.</li>
        <li>AI output is not professional medical, legal, financial, or psychological advice.</li>
      </ul>

      <h2>Prohibited uses</h2>
      <p>You may not use our AI tools to generate:</p>
      <ul>
        <li>Copyrighted logos, trademarks, or brand assets you don't have rights to.</li>
        <li>Realistic likenesses of identifiable people without their consent — including celebrities and politicians.</li>
        <li>Deepfakes, fake identification documents, or content designed to deceive.</li>
        <li>Sexual content involving minors, non-consensual sexual content, or CSAM.</li>
        <li>Content promoting self-harm, terrorism, illegal goods, or targeted harassment.</li>
        <li>Misleading before/after, medical, or financial claims.</li>
        <li>Spam, scams, or content intended to manipulate elections.</li>
      </ul>

      <h2>Disclosure</h2>
      <p>Where required by local law or platform policy (e.g. Meta, TikTok, YouTube), disclose that content was AI-generated or AI-assisted.</p>

      <h2>Accuracy and bias</h2>
      <p>AI models can produce inaccurate, biased, or out-of-date information. We don't guarantee originality or non-infringement of AI output. Always verify facts and claims before publishing.</p>

      <h2>Ownership</h2>
      <p>Subject to the underlying model provider's terms, you retain ownership of your prompts and the outputs you generate. We don't claim ownership of your AI output.</p>

      <h2>Enforcement</h2>
      <p>We may remove content and suspend accounts that violate this policy. Repeated or severe violations may result in termination. Report abuse to <a href="mailto:trust@example.com">trust@example.com</a>.</p>
    </LegalLayout>
  );
}
