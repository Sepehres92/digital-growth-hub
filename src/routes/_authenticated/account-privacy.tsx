import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { exportMyData, deleteMyAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account-privacy")({
  component: PrivacyAndDataPage,
});

function PrivacyAndDataPage() {
  const navigate = useNavigate();
  const runExport = useServerFn(exportMyData);
  const runDelete = useServerFn(deleteMyAccount);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await runExport({});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agency-os-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data export has been downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await runDelete({});
      await supabase.auth.signOut();
      toast.success("Your account and data have been deleted.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Account deletion failed");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy &amp; data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export or delete your personal data at any time. These are your GDPR &amp; PIPEDA rights.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 size-5 text-primary" />
          <div className="flex-1">
            <h2 className="font-semibold">Export your data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download a JSON file with all the data we hold about you — clients, campaigns, leads,
              tasks, blog posts, AI generations, uploads, profile, and audit logs.
            </p>
            <Button onClick={handleExport} disabled={exporting} className="mt-4">
              {exporting ? "Preparing…" : "Download my data"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-card p-6">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 size-5 text-destructive" />
          <div className="flex-1">
            <h2 className="font-semibold">Delete your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This cannot be undone.
              Export your data first if you want a copy.
            </p>

            <Alert className="mt-4 border-destructive/40 bg-destructive/5">
              <AlertTriangle className="size-4 text-destructive" />
              <AlertTitle className="text-destructive">This is permanent</AlertTitle>
              <AlertDescription>
                Type <strong>DELETE</strong> below to confirm.
              </AlertDescription>
            </Alert>

            <div className="mt-4">
              <Label htmlFor="confirm">Confirmation</Label>
              <Input
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || confirm !== "DELETE"}
              className="mt-4"
            >
              {deleting ? "Deleting…" : "Delete my account permanently"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
