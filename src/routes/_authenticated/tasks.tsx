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
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TStatus = Database["public"]["Enums"]["task_status"];
type TPriority = Database["public"]["Enums"]["task_priority"];

const COLUMNS: { key: TStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting", label: "Waiting" },
  { key: "done", label: "Done" },
];

const PRIORITY_LABEL: Record<TPriority, string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const PRIORITY_COLOR: Record<TPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  urgent: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

const empty = {
  title: "", client_id: "", due_date: "", priority: "medium" as TPriority,
  assigned_to: "", notes: "", status: "todo" as TStatus,
};

function TasksPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(empty);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
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
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.business_name;

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        title: form.title.trim(),
        client_id: form.client_id || null,
        due_date: form.due_date || null,
        priority: form.priority,
        assigned_to: form.assigned_to.trim() || null,
        notes: form.notes.trim() || null,
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({ ...payload, user_id: u.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(editing ? "Task updated" : "Task added");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      client_id: t.client_id ?? "",
      due_date: t.due_date ?? "",
      priority: t.priority,
      assigned_to: t.assigned_to ?? "",
      notes: t.notes ?? "",
      status: t.status,
    });
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag cards between columns.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>
          <Plus className="size-4" /> Add task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) moveMut.mutate({ id: dragId, status: col.key });
                setDragId(null);
              }}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-24">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    className="group rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{t.title}</p>
                        {clientName(t.client_id) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{clientName(t.client_id)}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_COLOR[t.priority])}>
                            {PRIORITY_LABEL[t.priority]}
                          </span>
                          {t.due_date && <span className="text-[10px] text-muted-foreground">Due {t.due_date}</span>}
                          {t.assigned_to && <span className="text-[10px] text-muted-foreground">· {t.assigned_to}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="size-6" onClick={() => openEdit(t)}><Pencil className="size-3" /></Button>
                        <Button size="icon" variant="ghost" className="size-6" onClick={() => deleteMut.mutate(t.id)}><Trash2 className="size-3" /></Button>
                      </div>
                    </div>
                    <div className="mt-2 md:hidden">
                      <Select value={t.status} onValueChange={(v) => moveMut.mutate({ id: t.id, status: v as TStatus })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-muted-foreground">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit task" : "Add task"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.title.trim()) return toast.error("Title required"); saveMut.mutate(); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Title *</Label><Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="sm:col-span-2">
                <Label>Related client</Label>
                <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due date</Label><Input type="date" className="mt-1.5" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TPriority })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABEL) as TPriority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Assigned to</Label><Input className="mt-1.5" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} /></div>
              <div>
                <Label>Column</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TStatus })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} className="mt-1.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? "Saving…" : editing ? "Save" : "Add task"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
