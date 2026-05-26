import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

const empty = {
  business_name: "", contact_person: "", email: "", phone: "", website: "",
  industry: "", monthly_budget: "", services: "", notes: "", status: "active",
};

function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        business_name: form.business_name.trim(),
        contact_person: form.contact_person.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : 0,
        services: form.services.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({ ...payload, user_id: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editing ? "Client updated" : "Client added");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted");
      setDeleteId(null);
    },
  });

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      business_name: c.business_name,
      contact_person: c.contact_person ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      website: c.website ?? "",
      industry: c.industry ?? "",
      monthly_budget: c.monthly_budget ? String(c.monthly_budget) : "",
      services: c.services ?? "",
      notes: c.notes ?? "",
      status: c.status,
    });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your active and past clients.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
          <Plus className="size-4" /> Add client
        </Button>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="font-medium">No clients yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first client.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{c.business_name}</h3>
                  <p className="truncate text-sm text-muted-foreground">{c.contact_person ?? "—"}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                {c.industry && <div className="flex justify-between"><dt className="text-muted-foreground">Industry</dt><dd>{c.industry}</dd></div>}
                {c.email && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="truncate">{c.email}</dd></div>}
                {c.phone && <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd>{c.phone}</dd></div>}
                {c.website && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="truncate"><a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><Globe className="size-3" />{c.website.replace(/^https?:\/\//, "")}</a></dd>
                  </div>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">Monthly</dt><dd className="font-medium tabular-nums">${Number(c.monthly_budget ?? 0).toLocaleString()}</dd></div>
                {c.services && <div className="text-xs text-muted-foreground">{c.services}</div>}
              </dl>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit client" : "Add client"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.business_name.trim()) return toast.error("Business name required"); saveMut.mutate(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Business name *</Label><Input className="mt-1.5" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required /></div>
              <div><Label>Contact person</Label><Input className="mt-1.5" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><Label>Industry</Label><Input className="mt-1.5" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Website</Label><Input className="mt-1.5" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div><Label>Monthly budget ($)</Label><Input type="number" min="0" step="0.01" className="mt-1.5" value={form.monthly_budget} onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })} /></div>
              <div><Label>Status</Label><Input className="mt-1.5" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="active / paused" /></div>
              <div className="sm:col-span-2"><Label>Services purchased</Label><Input className="mt-1.5" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="SEO, PPC, Website…" /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} className="mt-1.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? "Saving…" : editing ? "Save" : "Add client"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
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
