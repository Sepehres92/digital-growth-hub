import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole, type AppRole } from "@/hooks/use-user-role";
import { LoadingState } from "@/components/StateView";

interface RoleGuardProps {
  role?: AppRole;
  anyOf?: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side role gate for UI. Server-side enforcement still
 * comes from RLS + has_role() — this only hides admin surfaces
 * from non-admin users.
 */
export function RoleGuard({ role, anyOf, children, fallback }: RoleGuardProps) {
  const { roles, loading } = useUserRole();

  if (loading) return <LoadingState title="Checking permissions…" />;

  const allowed =
    (role && roles.includes(role)) ||
    (anyOf && anyOf.some((r) => roles.includes(r)));

  if (!allowed) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <ShieldAlert className="size-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-semibold">Access restricted</h2>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view this page. Ask an admin to grant
              you access, or head back to your dashboard.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
