import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Eye } from "lucide-react";

import { RoleGuard } from "@/components/RoleGuard";

export const Route = createFileRoute("/_authenticated/chatbot-admin")({
  ssr: false,
  component: ChatbotAdminGuarded,
});

const SCOPE_KEYS = ["campaigns", "calendar", "posts", "leads", "meetings", "files", "reports"] as const;

function ChatbotAdminGuarded() {
  return (
    <RoleGuard role="admin">
      <ChatbotAdmin />
    </RoleGuard>
  );
}

function ChatbotAdmin() {
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const clients = useQuery({
    queryKey: ["admin-clients", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("clients") as any).select("id,business_name").eq("user_id", me!).order("business_name");
      return data ?? [];
    },
  });

  const settings = useQuery({
    queryKey: ["chatbot-settings", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_settings") as any).select("*").eq("user_id", me!);
      return data ?? [];
    },
  });

  const conversations = useQuery({
    queryKey: ["chatbot-conversations", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_conversations") as any).select("*").eq("user_id", me!).order("updated_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const tickets = useQuery({
    queryKey: ["admin-tickets", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("support_tickets") as any).select("*").eq("user_id", me!).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const kb = useQuery({
    queryKey: ["kb-admin", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_kb_articles") as any).select("*").eq("user_id", me!).order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const [viewConv, setViewConv] = useState<string | null>(null);
  const viewMessages = useQuery({
    queryKey: ["conv-messages", viewConv], enabled: !!viewConv,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_messages") as any).select("*").eq("conversation_id", viewConv!).order("created_at");
      return data ?? [];
    },
  });

  // Settings upsert helper
  const upsertSettings = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await (supabase.from("chatbot_settings") as any).upsert({ ...row, user_id: me }, { onConflict: "user_id,client_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chatbot-settings"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const getSettings = (clientId: string | null) => settings.data?.find((s: any) => (s.client_id ?? null) === clientId) || {
    client_id: clientId, enabled: true, tone: "friendly",
    allow_scopes: Object.fromEntries(SCOPE_KEYS.map((k) => [k, true])),
    custom_instructions: "",
  };

  // KB CRUD
  const [kbEdit, setKbEdit] = useState<any>(null);
  const saveKb = useMutation({
    mutationFn: async (v: any) => {
      if (v.id) {
        const { error } = await (supabase.from("chatbot_kb_articles") as any).update({ title: v.title, category: v.category, body: v.body, published: v.published }).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("chatbot_kb_articles") as any).insert({ user_id: me, title: v.title, category: v.category, body: v.body, published: v.published });
        if (error) throw error;
      }
    },
    onSuccess: () => { setKbEdit(null); qc.invalidateQueries({ queryKey: ["kb-admin"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });
  const delKb = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase.from("chatbot_kb_articles") as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb-admin"] }),
  });

  const clientName = (id: string | null) => id ? (clients.data?.find((c: any) => c.id === id)?.business_name || id.slice(0, 8)) : "All clients (default)";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chatbot Admin</h1>
        <p className="text-sm text-muted-foreground">Manage the client AI assistant, knowledge base, and conversation logs.</p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 pt-4">
          {[{ id: null, business_name: "Default (all clients)" } as any, ...(clients.data ?? [])].map((c: any) => {
            const s = getSettings(c.id);
            return (
              <Card key={c.id ?? "default"} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium">{c.business_name}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>Enabled</span>
                    <Switch checked={!!s.enabled} onCheckedChange={(v) => upsertSettings.mutate({ ...s, enabled: v })} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Tone</Label>
                    <Select value={s.tone} onValueChange={(v) => upsertSettings.mutate({ ...s, tone: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["friendly", "professional", "casual", "concise", "playful"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data scopes</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {SCOPE_KEYS.map((k) => {
                        const on = !!s.allow_scopes?.[k];
                        return (
                          <button key={k} type="button"
                            onClick={() => upsertSettings.mutate({ ...s, allow_scopes: { ...s.allow_scopes, [k]: !on } })}
                            className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                            {k}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Custom instructions</Label>
                  <Textarea rows={2} defaultValue={s.custom_instructions || ""} placeholder="e.g. Always sign off as 'The XYZ team'…"
                    onBlur={(e) => { if (e.target.value !== (s.custom_instructions || "")) upsertSettings.mutate({ ...s, custom_instructions: e.target.value }); }} />
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="kb" className="space-y-3 pt-4">
          <Button onClick={() => setKbEdit({ title: "", category: "general", body: "", published: true })}><Plus className="size-4" /> New article</Button>
          <div className="grid gap-2">
            {kb.data?.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
            {kb.data?.map((a: any) => (
              <Card key={a.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.category} • {a.published ? "Published" : "Draft"}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setKbEdit(a)}><Edit2 className="size-3" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delKb.mutate(a.id)}><Trash2 className="size-3" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="pt-4">
          <Card className="divide-y divide-border">
            {conversations.data?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>}
            {conversations.data?.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{clientName(c.client_id)} • {c.context_page || "—"} • {new Date(c.updated_at).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setViewConv(c.id)}><Eye className="size-3" /> View</Button>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="pt-4">
          <Card className="divide-y divide-border">
            {tickets.data?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No tickets yet.</div>}
            {tickets.data?.map((t: any) => (
              <div key={t.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="truncate text-sm font-medium">{t.subject}</div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">{t.priority}</Badge>
                    <Badge>{t.status}</Badge>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{clientName(t.client_id)} • {t.source} • {new Date(t.created_at).toLocaleString()}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{t.body}</div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      {/* KB editor */}
      <Dialog open={!!kbEdit} onOpenChange={(o) => !o && setKbEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{kbEdit?.id ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          {kbEdit && (
            <form onSubmit={(e) => { e.preventDefault(); saveKb.mutate(kbEdit); }} className="space-y-3">
              <Input value={kbEdit.title} onChange={(e) => setKbEdit({ ...kbEdit, title: e.target.value })} placeholder="Title" required maxLength={200} />
              <Input value={kbEdit.category} onChange={(e) => setKbEdit({ ...kbEdit, category: e.target.value })} placeholder="Category (faq, services, campaigns, reports, onboarding, billing…)" maxLength={50} />
              <Textarea rows={10} value={kbEdit.body} onChange={(e) => setKbEdit({ ...kbEdit, body: e.target.value })} placeholder="Article body (markdown supported)" required maxLength={10000} />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!kbEdit.published} onCheckedChange={(v) => setKbEdit({ ...kbEdit, published: v })} /> Published
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setKbEdit(null)}>Cancel</Button>
                <Button type="submit" disabled={saveKb.isPending}>{saveKb.isPending ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Conversation viewer */}
      <Dialog open={!!viewConv} onOpenChange={(o) => !o && setViewConv(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Conversation</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-auto">
            {viewMessages.data?.map((m: any) => (
              <div key={m.id} className={`rounded-md p-2 text-sm ${m.role === "user" ? "bg-primary/10" : "bg-muted/50"}`}>
                <div className="mb-1 text-[10px] uppercase text-muted-foreground">{m.role} • {new Date(m.created_at).toLocaleString()}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
