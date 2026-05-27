import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWorkspaceMode, convertDemoToReal } from "@/lib/onboarding.functions";
import { toast } from "sonner";

export function DemoBanner() {
  const getMode = useServerFn(getWorkspaceMode);
  const convert = useServerFn(convertDemoToReal);
  const [isDemo, setIsDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getMode({})
      .then((r) => alive && setIsDemo(r.mode === "demo"))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [getMode]);

  if (!isDemo) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 md:flex-row dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          <strong>Demo Mode.</strong> Data is fake. Publishing, payments, and external integrations are disabled.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/onboarding" className="underline">
          Set up real workspace
        </Link>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await convert({ data: { purgeDemo: false } });
              toast.success("Switched to Real Workspace. Demo data kept as examples.");
              setIsDemo(false);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Convert to Real
        </Button>
      </div>
    </div>
  );
}

/** Hook for client-side demo gating (hide destructive buttons, etc). */
export function useIsDemoMode() {
  const getMode = useServerFn(getWorkspaceMode);
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    let alive = true;
    getMode({})
      .then((r) => alive && setIsDemo(r.mode === "demo"))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [getMode]);
  return isDemo;
}
