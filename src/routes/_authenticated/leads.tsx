import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Status = Database["public"]["Enums"]["lead_status"];

const STATUSES: Status[] = ["new", "contacted", "discovery_booked", "proposal", "won", "lost"];
const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  discovery_booked: "Discovery Booked",
  qualified: "Qualified",
  proposal: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service_interest: "",
  source: "",
  status: "new" as Status,
  value: "",
  notes: "",
};

function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: leads = [], isLoading } = useQuery({
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

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        service_interest: form.service_interest.trim() || null,
        source: form.source.trim() || null,
        status: form.status,
        value: form.value ? Number(form.value) : 0,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("leads").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("leads")
          .insert({ ...payload, user_id: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(editing ? "Lead updated" : "Lead added");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
      setDeleteId(null);
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({
      name: l.name,
      email: l.email ?? "",
      phone: l.phone ?? "",
      company: l.company ?? "",
      status: l.status,
      value: l.value ? String(l.value) : "",
      notes: l.notes ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and qualify your pipeline.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" /> Add lead
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first lead to start tracking your pipeline.
            </p>
            <Button className="mt-4" onClick={openAdd}>
              <Plus className="size-4" /> Add lead
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.company ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${Number(l.value ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(l.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {leads.map((l) => (
                <div key={l.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{l.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {l.company ?? l.email ?? "—"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                          {l.status}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ${Number(l.value ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(l.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit lead" : "Add lead"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim()) return toast.error("Name is required");
              saveMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as Status })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending ? "Saving…" : editing ? "Save" : "Add lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
