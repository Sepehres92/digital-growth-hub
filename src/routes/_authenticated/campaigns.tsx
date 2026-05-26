import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CType = Database["public"]["Enums"]["campaign_type"];
type CStatus = Database["public"]["Enums"]["campaign_status"];

const TYPE_LABEL: Record<CType, string> = {
  seo: "SEO", ppc: "PPC", social_media: "Social Media", website: "Website", branding: "Branding",
};
const STATUS_LABEL: Record<CStatus, string> = {
  planned: "Planned", active: "Active", paused: "Paused", completed: "Completed", cancelled: "Cancelled",
};

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
});

const empty = {
  client_id: "", name: "", type: "seo" as CType, start_date: "", end_date: "",
  monthly_budget: "", goal: "", status: "planned" as CStatus, results_notes: "",
};

function CampaignsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, business_name");
      if (error) throw error;
      return data;
    },
  });
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.business_name ?? "—";

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        client_id: form.client_id || null,
        name: form.name.trim(),
        type: form.type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : 0,
        goal: form.goal.trim() || null,
        status: form.status,
        results_notes: form.results_notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("campaigns").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campaigns").insert({ ...payload, user_id: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(editing ? "Campaign updated" : "Campaign added");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Deleted");
      setDeleteId(null);
    },
  });

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      client_id: c.client_id ?? "",
      name: c.name,
      type: c.type,
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      monthly_budget: c.monthly_budget ? String(c.monthly_budget) : "",
      goal: c.goal ?? "",
      status: c.status,
      results_notes: c.results_notes ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all active and past campaigns.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
          <Plus className="size-4" /> Add campaign
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium">No campaigns yet</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{clientName(c.client_id)}</td>
                      <td className="px-4 py-3">{TYPE_LABEL[c.type]}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{STATUS_LABEL[c.status]}</span></td>
                      <td className="px-4 py-3 text-right tabular-nums">${Number(c.monthly_budget ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{clientName(c.client_id)} · {TYPE_LABEL[c.type]}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{STATUS_LABEL[c.status]}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">${Number(c.monthly_budget ?? 0).toLocaleString()}/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit campaign" : "Add campaign"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) return toast.error("Name required"); saveMut.mutate(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Campaign name *</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="sm:col-span-2">
                <Label>Client</Label>
                <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CType })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as CType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CStatus })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as CStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start date</Label><Input type="date" className="mt-1.5" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End date</Label><Input type="date" className="mt-1.5" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Monthly budget ($)</Label><Input type="number" min="0" step="0.01" className="mt-1.5" value={form.monthly_budget} onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Goal</Label><Input className="mt-1.5" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Results notes</Label><Textarea rows={3} className="mt-1.5" value={form.results_notes} onChange={(e) => setForm({ ...form, results_notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? "Saving…" : editing ? "Save" : "Add campaign"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
