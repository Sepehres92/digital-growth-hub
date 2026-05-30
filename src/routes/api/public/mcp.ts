import { createFileRoute } from "@tanstack/react-router";
import { createMcpServer, withMcpAuth } from "mcp-tanstack-start";
import { getBusinessProfileTool } from "@/lib/mcp/tools/get-business-profile";
import { listClientsTool } from "@/lib/mcp/tools/list-clients";
import { listCampaignsTool } from "@/lib/mcp/tools/list-campaigns";
import { listUpcomingContentTool } from "@/lib/mcp/tools/list-upcoming-content";

const mcp = createMcpServer({
  name: "marketing-cockpit",
  version: "1.0.0",
  instructions:
    "Read-only access to the user's marketing workspace: business profile, clients, campaigns, and upcoming content.",
  tools: [getBusinessProfileTool, listClientsTool, listCampaignsTool, listUpcomingContentTool],
});

const methodNotAllowed = () =>
  new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }),
    { status: 405, headers: { "Content-Type": "application/json", Allow: "POST, OPTIONS" } },
  );

const authenticated = withMcpAuth(
  async (request, auth) => mcp.handleRequest(request, { auth }),
  async (request) => {
    const expected = process.env.MCP_SHARED_TOKEN;
    if (!expected) return null;
    const header = request.headers.get("Authorization") ?? "";
    const headerToken = header.replace(/^Bearer\s+/i, "").trim();
    const queryToken = (new URL(request.url).searchParams.get("token") ?? "").trim();
    const token = headerToken || queryToken;
    if (!token || token !== expected) return null;
    return { token };
  },
);

export const Route = createFileRoute("/api/public/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => authenticated(request),
      GET: async () => methodNotAllowed(),
      DELETE: async () => methodNotAllowed(),
    },
  },
});
