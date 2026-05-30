import { createFileRoute } from "@tanstack/react-router";
import { createMcpServer } from "mcp-tanstack-start";
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Origin, X-Requested-With, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

const withCors = (response: Response) => {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const methodNotAllowed = () =>
  withCors(new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }),
    { status: 405, headers: { "Content-Type": "application/json", Allow: "POST, OPTIONS" } },
  ));

const unauthorized = (message: string) =>
  withCors(new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="MCP Server"',
      },
    },
  ));

const authenticated = async (request: Request) => {
  const expected = process.env.MCP_SHARED_TOKEN;
  if (!expected) return unauthorized("MCP server token is not configured");

  const header = request.headers.get("Authorization") ?? "";
  const headerToken = header.replace(/^Bearer\s+/i, "").trim();
  const queryToken = (new URL(request.url).searchParams.get("token") ?? "").trim();
  const token = headerToken || queryToken;

  if (!token || token !== expected) return unauthorized("Invalid or missing authorization token");

  const response = await mcp.handleRequest(request, {
    auth: {
      token,
      claims: {},
      scopes: [],
    },
  });
  return withCors(response);
};

const corsResponse = () =>
  new Response(null, {
    status: 204,
    headers: corsHeaders,
  });

export const Route = createFileRoute("/api/public/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => authenticated(request),
      GET: async () => methodNotAllowed(),
      DELETE: async () => methodNotAllowed(),
      OPTIONS: async () => corsResponse(),
    },
  },
});
