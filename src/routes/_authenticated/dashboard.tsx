import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Target, DollarSign, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
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

  const total = leads.length;
  const won = leads.filter((l) => l.status === "won").length;
  const pipeline = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + Number(l.value ?? 0), 0);
  const winRate = total ? Math.round((won / total) * 100) : 0;

  const stats = [
    { label: "Total leads", value: total, icon: Users },
    { label: "Pipeline value", value: `$${pipeline.toLocaleString()}`, icon: DollarSign },
    { label: "Won deals", value: won, icon: Target },
    { label: "Win rate", value: `${winRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of your pipeline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

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
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-muted-foreground">
                  {l.company ?? l.email ?? "—"}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                {l.status}
              </span>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No leads yet.{" "}
              <Link to="/leads" className="font-medium text-primary hover:underline">
                Add your first lead
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
