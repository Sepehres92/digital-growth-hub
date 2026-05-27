import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { clientChatbotChat } from "@/lib/chatbot.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bot, X, Send, Sparkles, Paperclip, LifeBuoy, MessageSquare, Loader2, AlertTriangle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What is my campaign status?",
  "What posts are scheduled this week?",
  "Can you explain my results?",
  "What content needs approval?",
  "What tasks are pending?",
  "Can I request a change?",
  "When is my next meeting?",
];

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string; attachments?: any[] };

export function ClientChatbot() {
  const qc = useQueryClient();
  const chat = useServerFn(clientChatbotChat);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [me, setMe] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [typing, setTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["chatbot-clients", me],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("clients") as any).select("id,business_name").eq("user_id", me!).order("business_name");
      return (data ?? []) as Array<{ id: string; business_name: string }>;
    },
  });

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    const { data, error } = await (supabase.from("chatbot_conversations") as any).insert({
      user_id: me, client_id: clientId || null, title: "New conversation", context_page: pathname,
    }).select("id").single();
    if (error) throw error;
    setConversationId(data.id);
    return data.id as string;
  };

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["chatbot-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_messages") as any)
        .select("*").eq("conversation_id", conversationId!).order("created_at", { ascending: true });
      return (data ?? []) as Msg[];
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = async (text: string) => {
    if (!me) { toast.error("Sign in required"); return; }
    if (!text.trim()) return;
    setSending(true); setTyping(true);
    try {
      const convId = await ensureConversation();
      // Optimistic user message
      qc.setQueryData(["chatbot-messages", convId], (prev: Msg[] = []) => [
        ...prev,
        { id: `tmp-${Date.now()}`, role: "user", content: text, created_at: new Date().toISOString(), attachments },
      ]);
      setDraft(""); setAttachments([]);
      await chat({ data: { conversationId: convId, message: text, clientId: clientId || null, contextPage: pathname, attachments } });
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || "Send failed");
    } finally {
      setSending(false); setTyping(false);
    }
  };

  const onFile = async (f: File) => {
    if (!me) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    const path = `${me}/chatbot/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("client-uploads").upload(path, f, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("client-uploads").getPublicUrl(path);
    setAttachments((p) => [...p, { url: data.publicUrl, name: f.name, type: f.type }]);
  };

  const createTicket = useMutation({
    mutationFn: async (v: { subject: string; body: string; priority: string }) => {
      const { error } = await (supabase.from("support_tickets") as any).insert({
        user_id: me, client_id: clientId || null, subject: v.subject, body: v.body, priority: v.priority,
        source: "chatbot", conversation_id: conversationId,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Support ticket created"); setSupportOpen(false); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const clientName = useMemo(() => clients.find((c) => c.id === clientId)?.business_name ?? "All clients", [clients, clientId]);

  if (!me) return null;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-105",
          open && "scale-95",
        )}
        aria-label="Open AI assistant"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[640px] max-h-[85vh] w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-3 py-2.5">
            <div className="grid size-8 place-items-center rounded-md bg-primary/15 text-primary"><Sparkles className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Client AI Assistant</div>
              <div className="truncate text-[11px] text-muted-foreground">Context: {clientName}</div>
            </div>
            <Select value={clientId || "all"} onValueChange={(v) => { setClientId(v === "all" ? "" : v); setConversationId(null); }}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 p-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                    👋 Hi! I can answer questions about your campaigns, content calendar, scheduled posts, leads, meetings, files and reports.
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">Suggested questions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-accent">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                  {m.role === "assistant" && <div className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary"><Bot className="size-3.5" /></div>}
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60",
                  )}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.attachments.map((a: any, i: number) => (
                          <a key={i} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[10px] text-foreground hover:bg-accent">
                            <Paperclip className="size-3" /> {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Assistant is typing…
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Handoff actions */}
          <div className="flex flex-wrap items-center gap-1 border-t border-border bg-muted/20 px-2 py-1.5">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setSupportOpen(true)}>
              <LifeBuoy className="size-3" /> Support
            </Button>
            <a href="/team-chat" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] hover:bg-accent">
              <MessageSquare className="size-3" /> Team chat
            </a>
            <a href="/meetings" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] hover:bg-accent">
              <CalendarPlus className="size-3" /> Request meeting
            </a>
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-border px-2 py-1.5">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px]">
                  <Paperclip className="size-3" /> {a.name}
                  <button onClick={() => setAttachments((p) => p.filter((_, x) => x !== i))} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-border p-2">
            <div className="flex items-end gap-1.5">
              <input
                ref={fileRef} type="file" hidden
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
              />
              <Button size="icon" variant="ghost" className="size-8" onClick={() => fileRef.current?.click()} aria-label="Attach">
                <Paperclip className="size-4" />
              </Button>
              <Textarea
                rows={1} value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); } }}
                placeholder="Ask anything about your campaigns…"
                className="min-h-[36px] resize-none"
              />
              <Button size="icon" className="size-8" onClick={() => send(draft)} disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <div className="mt-1.5 flex items-start gap-1 text-[10px] leading-tight text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              <span>AI responses may be inaccurate. Important marketing, billing, legal, or account decisions should be reviewed by the agency team.</span>
            </div>
          </div>
        </div>
      )}

      {/* Support ticket dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create support ticket</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            createTicket.mutate({
              subject: String(f.get("subject") || "").trim(),
              body: String(f.get("body") || "").trim(),
              priority: String(f.get("priority") || "normal"),
            });
          }} className="space-y-3">
            <Input name="subject" placeholder="Subject" required maxLength={200} />
            <Textarea name="body" rows={5} placeholder="Describe your request…" required maxLength={4000} />
            <Select name="priority" defaultValue="normal">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSupportOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTicket.isPending}>{createTicket.isPending ? "Submitting…" : "Submit"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
