import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "./index";

export const Route = createFileRoute("/index")({
  head: () => ({
    meta: [
      { title: "Digital Agency OS — AI-Powered Marketing Agency Platform" },
      {
        name: "description",
        content:
          "Run your entire digital marketing agency from one AI-powered platform. CRM, AI content, video studio, scheduling, team chat, and client portal.",
      },
      { property: "og:title", content: "Digital Agency OS — AI-Powered Marketing Platform" },
      { property: "og:description", content: "All-in-one AI platform for modern marketing agencies. Clients, content, video, scheduling, automation." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});
