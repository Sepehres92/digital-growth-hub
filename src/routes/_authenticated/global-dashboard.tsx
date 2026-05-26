import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Briefcase,
  Megaphone,
  CheckSquare,
  DollarSign,
  FileSearch,
  BarChart3,
  Search,
  Share2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/global-dashboard")({
  component: GlobalDashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToolCard({
  to,
  label,
  desc,
  icon: Icon,
}: {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{label}</h3>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function GlobalDashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return data;
    },
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*");
      if (error) throw error;
      return data;
    },
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data;
    },
  });

  const activeClients = clients.filter((c) => c.status === "active").length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const today = new Date().toISOString().slice(0, 10);
  const tasksDue = tasks.filter(
    (t) => t.status !== "done" && t.due_date && t.due_date <= today,
  ).length;
  const monthlyRevenue =
    clients.reduce((s, c) => s + Number(c.monthly_budget ?? 0), 0) +
    campaigns
      .filter((c) => c.status === "active")
      .reduce((s, c) => s + Number(c.monthly_budget ?? 0), 0);
  const newLeads = leads.filter((l) => l.status === "new").length;

  const stats = [
    { label: "Total leads", value: leads.length, icon: Users, hint: `${newLeads} new` },
    { label: "Active clients", value: activeClients, icon: Briefcase },
    { label: "Active campaigns", value: activeCampaigns, icon: Megaphone },
    { label: "Tasks due", value: tasksDue, icon: CheckSquare },
    {
      label: "Est. monthly revenue",
      value: `$${monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: "Pipeline value",
      value: `$${leads
        .reduce((s, l) => s + Number(l.value ?? 0), 0)
        .toLocaleString()}`,
      icon: TrendingUp,
    },
  ];

  const tools = [
    {
      to: "/seo-audit",
      label: "SEO Audit",
      desc: "Run a full technical audit on any client site.",
      icon: FileSearch,
    },
    {
      to: "/semrush",
      label: "Semrush",
      desc: "Keyword research, rankings, and competitive insight.",
      icon: BarChart3,
    },
    {
      to: "/search-console",
      label: "Search Console",
      desc: "Google search performance and indexing.",
      icon: Search,
    },
    {
      to: "/social",
      label: "Social",
      desc: "TikTok, Twitch, and social profile analysis.",
      icon: Share2,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Global Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every client, campaign, task, and marketing tool — in one view.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Agency overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Marketing tools
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <ToolCard key={t.to} {...t} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent leads</h2>
            <Link
              to="/leads"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {l.company ?? l.email ?? "—"}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                  {l.status.replace("_", " ")}
                </span>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No leads yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active campaigns</h2>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {campaigns
              .filter((c) => c.status === "active")
              .slice(0, 5)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-sm capitalize text-muted-foreground">
                      {c.type} • ${Number(c.monthly_budget ?? 0).toLocaleString()}/mo
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-600">
                    {c.status}
                  </span>
                </div>
              ))}
            {campaigns.filter((c) => c.status === "active").length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No active campaigns.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tasks due soon</h2>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open board <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {tasks
            .filter((t) => t.status !== "done")
            .sort((a, b) =>
              (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"),
            )
            .slice(0, 6)
            .map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {t.priority} priority • {t.status.replace("_", " ")}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {t.due_date ?? "No date"}
                </span>
              </div>
            ))}
          {tasks.filter((t) => t.status !== "done").length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              All caught up.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
