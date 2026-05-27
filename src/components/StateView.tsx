import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BaseProps {
  title?: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}

export function LoadingState({ title = "Loading…", className }: BaseProps) {
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground", className)}>
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">{title}</p>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Get started by creating your first item.",
  action,
  icon,
  className,
}: BaseProps & { icon?: ReactNode }) {
  return (
    <div className={cn("flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 p-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this section. Please try again.",
  onRetry,
  className,
}: BaseProps & { onRetry?: () => void }) {
  return (
    <div className={cn("flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center", className)}>
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
