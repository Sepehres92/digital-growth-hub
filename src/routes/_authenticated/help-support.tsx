import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/help-support")({
  ssr: false,
  component: HelpSupportPage,
});

function HelpSupportPage() {
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const tickets = useQuery({
    queryKey: ["support-tickets", me], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("support_tickets") as any).select("*").eq("user_id", me!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const kb = useQuery({
    queryKey: ["kb-public"], enabled: !!me,
    queryFn: async () => {
      const { data } = await (supabase.from("chatbot_kb_articles") as any).select("*").eq("user_id", me!).eq("published", true).order("category");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: { subject: string; body: string; priority: string }) => {
      const { error } = await (supabase.from("support_tickets") as any).insert({ user_id: me, source: "help-page", ...v });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ticket created"); qc.invalidateQueries({ queryKey: ["support-tickets"] }); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><LifeBuoy className="size-4 text-primary" /> Create a support ticket</h2>
        <p className="mb-4 text-xs text-muted-foreground">Need help from a real human? Open a ticket and the team will follow up.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          create.mutate({
            subject: String(f.get("subject") || "").trim(),
            body: String(f.get("body") || "").trim(),
            priority: String(f.get("priority") || "normal"),
          });
          (e.currentTarget as HTMLFormElement).reset();
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
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Submitting…" : "Submit ticket"}</Button>
        </form>
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Your tickets</h3>
          {tickets.data?.length === 0 && <p className="text-xs text-muted-foreground">No tickets yet.</p>}
          {tickets.data?.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()} • {t.source}</div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{t.priority}</Badge>
                <Badge>{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><BookOpen className="size-4 text-primary" /> Knowledge base</h2>
        <p className="mb-4 text-xs text-muted-foreground">Self-serve articles. Ask the AI assistant for explanations or tap an article below.</p>
        <div className="space-y-3">
          {kb.data?.length === 0 && <p className="text-xs text-muted-foreground">No articles yet. An admin can add some from Chatbot Admin.</p>}
          {kb.data?.map((a: any) => (
            <details key={a.id} className="rounded-md border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">{a.title} <Badge variant="outline" className="ml-2">{a.category}</Badge></summary>
              <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
