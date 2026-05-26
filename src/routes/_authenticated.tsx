import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, LogOut, Menu, X, Briefcase, Megaphone, KanbanSquare, Settings as SettingsIcon, Search, BarChart3, FileSearch, Share2, Globe, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
      else setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const nav = [
    { to: "/global-dashboard", label: "Global Dashboard", icon: Globe, group: "Workspace" },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Workspace" },
    { to: "/leads", label: "Leads", icon: Users, group: "Workspace" },
    { to: "/clients", label: "Clients", icon: Briefcase, group: "Workspace" },
    { to: "/campaigns", label: "Campaigns", icon: Megaphone, group: "Workspace" },
    { to: "/tasks", label: "Tasks", icon: KanbanSquare, group: "Workspace" },
    { to: "/seo-audit", label: "SEO Audit", icon: FileSearch, group: "Marketing Tools" },
    { to: "/semrush", label: "Semrush", icon: BarChart3, group: "Marketing Tools" },
    { to: "/search-console", label: "Search Console", icon: Search, group: "Marketing Tools" },
    { to: "/social", label: "Social", icon: Share2, group: "Marketing Tools" },
    { to: "/settings", label: "Settings", icon: SettingsIcon, group: "Workspace" },
  ] as const;

  const groups = Array.from(new Set(nav.map((n) => n.group)));

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="size-7 rounded-md bg-primary" />
        <span className="font-semibold">Agency OS</span>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group}
            </div>
            {nav
              .filter((n) => n.group === group)
              .map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <SidebarContent />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-64 flex-col bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <button
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <h1 className="text-sm font-medium text-muted-foreground">
            {nav.find((n) => n.to === pathname)?.label ?? ""}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
