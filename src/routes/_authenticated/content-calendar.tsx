import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  generateSnippet,
  generateContentPlan,
  type PlannedPost,
} from "@/lib/calendar-ai.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Sparkles, Wand2,
  Upload, Loader2, Trash2, Image as ImageIcon, BarChart3, CheckCircle2,
  Clock, XCircle, Send, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/content-calendar")({
  component: ContentCalendarPage,
});

type PostRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  campaign_id: string | null;
  platform: "instagram" | "facebook" | "x" | "tiktok" | "youtube";
  caption: string;
  hashtags: string | null;
  cta: string | null;
  link: string | null;
  media_url: string | null;
  scheduled_at: string;
  status: "draft" | "pending" | "approved" | "scheduled" | "published" | "failed" | "rejected";
  notes: string | null;
  ai_generated?: boolean;
  source_module?: string | null;
};

type MediaRow = {
  id: string;
  name: string;
  file_url: string;
  file_type: "image" | "video" | "logo" | "other";
  source: "upload" | "ai" | "brand";
  created_at: string;
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "bg-pink-500", text: "text-pink-50" },
  { value: "facebook", label: "Facebook", color: "bg-blue-600", text: "text-blue-50" },
  { value: "x", label: "X (Twitter)", color: "bg-neutral-900", text: "text-white" },
  { value: "tiktok", label: "TikTok", color: "bg-fuchsia-600", text: "text-fuchsia-50" },
  { value: "youtube", label: "YouTube", color: "bg-red-600", text: "text-red-50" },
] as const;

const STATUS_META: Record<PostRow["status"], { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-muted text-foreground" },
  pending: { label: "Pending Approval", tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" },
  scheduled: { label: "Scheduled", tone: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200" },
  published: { label: "Published", tone: "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200" },
  failed: { label: "Failed", tone: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200" },
  rejected: { label: "Rejected", tone: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200" },
};

function platformMeta(p: string) {
  return PLATFORMS.find((x) => x.value === p) ?? PLATFORMS[0];
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function localDate(s: string) { return new Date(s); }

function ContentCalendarPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tab, setTab] = useState("calendar");
  const [editing, setEditing] = useState<Partial<PostRow> | null>(null);

  // Realtime sync — auto refresh when AI modules write new content
  useEffect(() => {
    const ch = supabase
      .channel("calendar-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, () => {
        qc.invalidateQueries({ queryKey: ["social-posts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const clientsQ = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,business_name").order("business_name");
      return data ?? [];
    },
  });
  const campaignsQ = useQuery({
    queryKey: ["campaigns-min"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id,name,client_id").order("name");
      return data ?? [];
    },
  });

  // Compute date range for query based on view
  const range = useMemo(() => {
    if (view === "month") {
      const s = startOfMonth(cursor);
      const e = addDays(new Date(s.getFullYear(), s.getMonth() + 1, 1), 0);
      return { from: s, to: e };
    }
    if (view === "week") {
      const s = startOfWeek(cursor);
      return { from: s, to: addDays(s, 7) };
    }
    const s = new Date(cursor); s.setHours(0, 0, 0, 0);
    return { from: s, to: addDays(s, 1) };
  }, [view, cursor]);

  const postsQ = useQuery({
    queryKey: ["social-posts", range.from.toISOString(), range.to.toISOString(), filterClient, filterPlatform, filterCampaign],
    queryFn: async () => {
      let q = supabase
        .from("social_posts").select("*")
        .gte("scheduled_at", range.from.toISOString())
        .lt("scheduled_at", range.to.toISOString())
        .order("scheduled_at");
      if (filterClient !== "all") q = q.eq("client_id", filterClient);
      if (filterPlatform !== "all") q = q.eq("platform", filterPlatform);
      if (filterCampaign !== "all") q = q.eq("campaign_id", filterCampaign);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PostRow[];
    },
  });

  // Mutations
  const upsertPost = useMutation({
    mutationFn: async (p: Partial<PostRow>) => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not signed in");
      const row = {
        ...p,
        user_id: userId,
        client_id: p.client_id || null,
        campaign_id: p.campaign_id || null,
      };
      if (p.id) {
        const { error } = await supabase.from("social_posts").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("social_posts").insert(row as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-posts"] });
      setEditing(null);
      toast.success("Post saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-posts"] });
      toast.success("Post deleted");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PostRow["status"] }) => {
      const { error } = await supabase.from("social_posts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["social-posts"] });
      const label = STATUS_META[vars.status].label;
      toast.success(`Moved to ${label}`);
      if (vars.status === "rejected" || vars.status === "failed") {
        // simple notification surface
        toast.warning(`Heads up: post ${label.toLowerCase()}`);
      }
    },
  });

  const rescheduleLocal = useMutation({
    mutationFn: async ({ id, dateStr }: { id: string; dateStr: string }) => {
      const post = postsQ.data?.find((p) => p.id === id);
      if (!post) return;
      const orig = localDate(post.scheduled_at);
      const target = new Date(dateStr + "T00:00:00");
      target.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
      const { error } = await supabase
        .from("social_posts").update({ scheduled_at: target.toISOString() }).eq("id", id);
      if (error) throw error;

      // Conflict detection: 2+ posts on same date+platform
      const platform = post.platform;
      const dayStart = new Date(target); dayStart.setHours(0,0,0,0);
      const dayEnd = addDays(dayStart, 1);
      const { count } = await supabase
        .from("social_posts").select("*", { count: "exact", head: true })
        .eq("platform", platform)
        .gte("scheduled_at", dayStart.toISOString())
        .lt("scheduled_at", dayEnd.toISOString());
      if ((count ?? 0) > 1) {
        toast.warning(`Scheduling conflict: ${count} ${platform} posts on ${isoDate(target)}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-posts"] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CalIcon className="size-6 text-primary" /> Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan, generate, approve and schedule social content across platforms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanGeneratorDialog
            onSaved={() => qc.invalidateQueries({ queryKey: ["social-posts"] })}
            defaultPlatform={filterPlatform === "all" ? "instagram" : filterPlatform}
          />
          <Button onClick={() => setEditing({ platform: "instagram", status: "draft", scheduled_at: new Date().toISOString() })}>
            <Plus className="mr-2 size-4" /> New post
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="calendar"><CalIcon className="mr-2 size-4" />Calendar</TabsTrigger>
          <TabsTrigger value="posts"><FileText className="mr-2 size-4" />Posts</TabsTrigger>
          <TabsTrigger value="media"><ImageIcon className="mr-2 size-4" />Media Library</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-2 size-4" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => setCursor((c) => shift(c, view, -1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => setCursor(new Date())}>Today</Button>
                <Button size="icon" variant="outline" onClick={() => setCursor((c) => shift(c, view, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
                <span className="ml-2 text-base font-medium">{headerLabel(cursor, view)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {(clientsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Campaign" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campaigns</SelectItem>
                    {(campaignsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {view === "month" && (
                <MonthGrid
                  cursor={cursor}
                  posts={postsQ.data ?? []}
                  onClickPost={(p) => setEditing(p)}
                  onDropPost={(id, dateStr) => rescheduleLocal.mutate({ id, dateStr })}
                  onAddOn={(dateStr) => setEditing({
                    platform: "instagram", status: "draft",
                    scheduled_at: new Date(dateStr + "T10:00:00").toISOString(),
                  })}
                />
              )}
              {view === "week" && (
                <WeekGrid
                  cursor={cursor}
                  posts={postsQ.data ?? []}
                  onClickPost={(p) => setEditing(p)}
                  onDropPost={(id, dateStr) => rescheduleLocal.mutate({ id, dateStr })}
                />
              )}
              {view === "day" && (
                <DayList posts={postsQ.data ?? []} onClickPost={(p) => setEditing(p)} />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Badge key={p.value} className={cn(p.color, p.text, "border-transparent")}>
                {p.label}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <PostsList
            posts={postsQ.data ?? []}
            onEdit={(p) => setEditing(p)}
            onDelete={(id) => deletePost.mutate(id)}
            onStatus={(id, status) => updateStatus.mutate({ id, status })}
          />
        </TabsContent>

        <TabsContent value="media">
          <MediaLibrary />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>

      {editing && (
        <PostDialog
          initial={editing}
          clients={clientsQ.data ?? []}
          campaigns={campaignsQ.data ?? []}
          onClose={() => setEditing(null)}
          onSave={(p) => upsertPost.mutate(p)}
          onDelete={(id) => { deletePost.mutate(id); setEditing(null); }}
          saving={upsertPost.isPending}
        />
      )}
    </div>
  );
}

function shift(d: Date, view: "month"|"week"|"day", dir: number) {
  const x = new Date(d);
  if (view === "month") x.setMonth(x.getMonth() + dir);
  else if (view === "week") x.setDate(x.getDate() + 7 * dir);
  else x.setDate(x.getDate() + dir);
  return x;
}
function headerLabel(d: Date, view: "month"|"week"|"day") {
  if (view === "month") return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (view === "week") {
    const s = startOfWeek(d); const e = addDays(s, 6);
    return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/* ---------- Month grid with drag-drop ---------- */

function MonthGrid({
  cursor, posts, onClickPost, onDropPost, onAddOn,
}: {
  cursor: Date;
  posts: PostRow[];
  onClickPost: (p: PostRow) => void;
  onDropPost: (id: string, dateStr: string) => void;
  onAddOn: (dateStr: string) => void;
}) {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const byDay = useMemo(() => {
    const m: Record<string, PostRow[]> = {};
    for (const p of posts) {
      const k = isoDate(localDate(p.scheduled_at));
      (m[k] ||= []).push(p);
    }
    return m;
  }, [posts]);

  const weekdayHeaders = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 bg-muted/50 text-xs font-medium text-muted-foreground">
        {weekdayHeaders.map((w) => (
          <div key={w} className="border-b border-border p-2 text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = isoDate(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const today = isoDate(new Date()) === key;
          return (
            <div
              key={key}
              className={cn(
                "group min-h-28 border-b border-r border-border p-1.5 align-top",
                !inMonth && "bg-muted/30 text-muted-foreground",
              )}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2","ring-primary/40"); }}
              onDragLeave={(e) => e.currentTarget.classList.remove("ring-2","ring-primary/40")}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("ring-2","ring-primary/40");
                const id = e.dataTransfer.getData("text/post-id");
                if (id) onDropPost(id, key);
              }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={cn("text-xs font-medium", today && "rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground")}>
                  {d.getDate()}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => onAddOn(key)} title="Add post"
                ><Plus className="size-3.5 text-muted-foreground hover:text-foreground" /></button>
              </div>
              <div className="space-y-1">
                {(byDay[key] ?? []).slice(0, 4).map((p) => {
                  const pm = platformMeta(p.platform);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/post-id", p.id)}
                      onClick={() => onClickPost(p)}
                      className={cn("cursor-grab truncate rounded px-1.5 py-0.5 text-[11px] active:cursor-grabbing", pm.color, pm.text)}
                      title={p.caption}
                    >
                      {timeOf(p.scheduled_at)} · {p.caption || pm.label}
                    </div>
                  );
                })}
                {byDay[key] && byDay[key].length > 4 && (
                  <div className="text-[10px] text-muted-foreground">+{byDay[key].length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  cursor, posts, onClickPost, onDropPost,
}: {
  cursor: Date;
  posts: PostRow[];
  onClickPost: (p: PostRow) => void;
  onDropPost: (id: string, dateStr: string) => void;
}) {
  const s = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(s, i));
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((d) => {
        const key = isoDate(d);
        const dayPosts = posts.filter((p) => isoDate(localDate(p.scheduled_at)) === key);
        return (
          <div
            key={key}
            className="min-h-48 rounded-lg border border-border p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/post-id");
              if (id) onDropPost(id, key);
            }}
          >
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
            </div>
            <div className="space-y-1">
              {dayPosts.map((p) => {
                const pm = platformMeta(p.platform);
                return (
                  <div
                    key={p.id} draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/post-id", p.id)}
                    onClick={() => onClickPost(p)}
                    className={cn("cursor-grab rounded p-1.5 text-xs", pm.color, pm.text)}
                  >
                    <div className="font-medium">{timeOf(p.scheduled_at)} · {pm.label}</div>
                    <div className="line-clamp-2 opacity-90">{p.caption}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({ posts, onClickPost }: { posts: PostRow[]; onClickPost: (p: PostRow) => void }) {
  if (!posts.length) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No posts scheduled.</div>;
  return (
    <div className="space-y-2">
      {posts.map((p) => {
        const pm = platformMeta(p.platform);
        return (
          <button
            key={p.id} onClick={() => onClickPost(p)}
            className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md text-xs font-semibold", pm.color, pm.text)}>
              {pm.label[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{timeOf(p.scheduled_at)}</span>
                <Badge className={cn(STATUS_META[p.status].tone, "border-transparent text-[10px]")}>{STATUS_META[p.status].label}</Badge>
              </div>
              <div className="truncate text-sm">{p.caption}</div>
              {p.hashtags && <div className="truncate text-xs text-muted-foreground">{p.hashtags}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ---------- Posts list with status workflow ---------- */

function PostsList({
  posts, onEdit, onDelete, onStatus,
}: {
  posts: PostRow[];
  onEdit: (p: PostRow) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: PostRow["status"]) => void;
}) {
  if (!posts.length) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No posts in this view.</div>;
  return (
    <div className="space-y-2">
      {posts.map((p) => {
        const pm = platformMeta(p.platform);
        return (
          <Card key={p.id}>
            <CardContent className="flex flex-wrap items-start gap-3 p-4">
              <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-md text-sm font-semibold", pm.color, pm.text)}>
                {pm.label[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge className={cn(STATUS_META[p.status].tone, "border-transparent")}>{STATUS_META[p.status].label}</Badge>
                  <span className="text-muted-foreground">{new Date(p.scheduled_at).toLocaleString()}</span>
                </div>
                <div className="text-sm">{p.caption || <span className="text-muted-foreground italic">No caption</span>}</div>
                {p.hashtags && <div className="text-xs text-muted-foreground">{p.hashtags}</div>}
                {p.cta && <div className="mt-1 text-xs">CTA: <span className="font-medium">{p.cta}</span></div>}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {p.status === "draft" && <Button size="sm" variant="outline" onClick={() => onStatus(p.id, "pending")}><Send className="mr-1 size-3" />Request approval</Button>}
                {p.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onStatus(p.id, "approved")}><CheckCircle2 className="mr-1 size-3" />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => onStatus(p.id, "rejected")}><XCircle className="mr-1 size-3" />Reject</Button>
                  </>
                )}
                {p.status === "approved" && <Button size="sm" variant="outline" onClick={() => onStatus(p.id, "scheduled")}><Clock className="mr-1 size-3" />Mark scheduled</Button>}
                {p.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => onStatus(p.id, "published")}>Mark published</Button>}
                <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Post dialog with AI buttons ---------- */

function PostDialog({
  initial, clients, campaigns, onClose, onSave, onDelete, saving,
}: {
  initial: Partial<PostRow>;
  clients: { id: string; business_name: string }[];
  campaigns: { id: string; name: string; client_id: string | null }[];
  onClose: () => void;
  onSave: (p: Partial<PostRow>) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [p, setP] = useState<Partial<PostRow>>(initial);
  const genFn = useServerFn(generateSnippet);
  const [busy, setBusy] = useState<string | null>(null);

  const aiCall = async (kind: "caption"|"hashtags"|"cta"|"video_title"|"seo_description"|"thumbnail_prompt") => {
    if (!p.caption && !p.notes && kind !== "thumbnail_prompt") {
      toast.error("Add a topic/caption or notes first");
      return;
    }
    setBusy(kind);
    try {
      const r = await genFn({ data: {
        kind,
        platform: p.platform ?? "",
        topic: p.notes || p.caption || "",
        tone: "Professional",
        audience: "",
      }});
      if (kind === "caption") setP((x) => ({ ...x, caption: r.text }));
      else if (kind === "hashtags") setP((x) => ({ ...x, hashtags: r.text }));
      else if (kind === "cta") setP((x) => ({ ...x, cta: r.text }));
      else if (kind === "video_title") setP((x) => ({ ...x, caption: r.text }));
      else if (kind === "seo_description") setP((x) => ({ ...x, notes: (x.notes ?? "") + "\n\nSEO: " + r.text }));
      else if (kind === "thumbnail_prompt") setP((x) => ({ ...x, notes: (x.notes ?? "") + "\n\nThumbnail prompt: " + r.text }));
      toast.success("Generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setBusy(null); }
  };

  const scheduled = p.scheduled_at ? new Date(p.scheduled_at) : new Date();
  const dateStr = isoDate(scheduled);
  const timeStr = scheduled.toTimeString().slice(0, 5);

  const filteredCampaigns = p.client_id
    ? campaigns.filter((c) => c.client_id === p.client_id) : campaigns;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{p.id ? "Edit post" : "New post"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={p.platform ?? "instagram"} onValueChange={(v) => setP((x) => ({ ...x, platform: v as PostRow["platform"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((pl) => <SelectItem key={pl.value} value={pl.value}>{pl.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={p.status ?? "draft"} onValueChange={(v) => setP((x) => ({ ...x, status: v as PostRow["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={p.client_id ?? "none"} onValueChange={(v) => setP((x) => ({ ...x, client_id: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={p.campaign_id ?? "none"} onValueChange={(v) => setP((x) => ({ ...x, campaign_id: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {filteredCampaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scheduled date</Label>
            <Input type="date" value={dateStr} onChange={(e) => {
              const t = new Date(e.target.value + "T" + timeStr + ":00");
              setP((x) => ({ ...x, scheduled_at: t.toISOString() }));
            }} />
          </div>
          <div className="space-y-2">
            <Label>Scheduled time</Label>
            <Input type="time" value={timeStr} onChange={(e) => {
              const t = new Date(dateStr + "T" + e.target.value + ":00");
              setP((x) => ({ ...x, scheduled_at: t.toISOString() }));
            }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Caption</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("caption")}>
                {busy === "caption" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="mr-1 size-3" />} Caption
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("video_title")}>
                <Sparkles className="mr-1 size-3" /> Video title
              </Button>
            </div>
          </div>
          <Textarea rows={4} value={p.caption ?? ""} onChange={(e) => setP((x) => ({ ...x, caption: e.target.value }))} placeholder="Write or generate a caption" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Hashtags</Label>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("hashtags")}>
                {busy === "hashtags" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="mr-1 size-3" />} Generate
              </Button>
            </div>
            <Textarea rows={2} value={p.hashtags ?? ""} onChange={(e) => setP((x) => ({ ...x, hashtags: e.target.value }))} placeholder="#brand #launch" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Call to action</Label>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("cta")}>
                {busy === "cta" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="mr-1 size-3" />} Generate
              </Button>
            </div>
            <Input value={p.cta ?? ""} onChange={(e) => setP((x) => ({ ...x, cta: e.target.value }))} placeholder="Shop now" />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input value={p.link ?? ""} onChange={(e) => setP((x) => ({ ...x, link: e.target.value }))} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label>Media URL</Label>
            <Input value={p.media_url ?? ""} onChange={(e) => setP((x) => ({ ...x, media_url: e.target.value }))} placeholder="Paste from Media Library" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Notes / topic (used by AI)</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("seo_description")}>
                <Sparkles className="mr-1 size-3" /> SEO desc
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => aiCall("thumbnail_prompt")}>
                <Sparkles className="mr-1 size-3" /> Thumbnail prompt
              </Button>
            </div>
          </div>
          <Textarea rows={3} value={p.notes ?? ""} onChange={(e) => setP((x) => ({ ...x, notes: e.target.value }))} placeholder="Describe what this post is about so AI can help." />
        </div>

        {p.media_url && (
          <div className="overflow-hidden rounded-md border border-border">
            <img src={p.media_url} alt="" className="max-h-64 w-full object-contain" />
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {p.id && <Button variant="ghost" onClick={() => onDelete(p.id!)}><Trash2 className="mr-1 size-4" />Delete</Button>}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={() => onSave(p)}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- AI 30-day plan generator ---------- */

function PlanGeneratorDialog({ onSaved, defaultPlatform }: { onSaved: () => void; defaultPlatform: string }) {
  const [open, setOpen] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [platforms, setPlatforms] = useState<string[]>([defaultPlatform || "instagram"]);
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("");
  const [preview, setPreview] = useState<PlannedPost[] | null>(null);
  const planFn = useServerFn(generateContentPlan);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (v: string) => setPlatforms((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const run = async () => {
    if (!businessType.trim() || !goal.trim()) { toast.error("Add business type and goal"); return; }
    if (!platforms.length) { toast.error("Pick at least one platform"); return; }
    setLoading(true);
    try {
      const r = await planFn({ data: {
        businessType, goal, postsPerWeek, tone, audience,
        platforms: platforms as ("instagram"|"facebook"|"x"|"tiktok"|"youtube")[],
      }});
      setPreview(r.posts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not signed in");
      const rows = preview.map((p) => ({
        user_id: userId,
        platform: p.platform as PostRow["platform"],
        caption: p.caption,
        hashtags: p.hashtags,
        cta: p.cta,
        notes: `${p.category} — ${p.idea}`,
        scheduled_at: new Date(`${p.date}T${String(p.hour).padStart(2,"0")}:00:00`).toISOString(),
        status: "draft" as PostRow["status"],
      }));
      const { error } = await supabase.from("social_posts").insert(rows as never);
      if (error) throw error;
      toast.success(`${rows.length} posts added to calendar`);
      setOpen(false);
      setPreview(null);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Wand2 className="mr-2 size-4" />AI 30-day plan</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Content Calendar Generator</DialogTitle>
        </DialogHeader>
        {!preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1"><Label>Business type</Label><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. Boutique skincare brand" /></div>
              <div className="space-y-1"><Label>Goal</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Drive sign-ups for launch" /></div>
              <div className="space-y-1"><Label>Posts per week</Label><Input type="number" min={1} max={21} value={postsPerWeek} onChange={(e) => setPostsPerWeek(Number(e.target.value) || 1)} /></div>
              <div className="space-y-1"><Label>Tone</Label><Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Target audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Women 25-40 interested in clean beauty" /></div>
            </div>
            <div>
              <Label>Platforms</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const on = platforms.includes(p.value);
                  return (
                    <button key={p.value} onClick={() => toggle(p.value)}
                      className={cn("rounded-full px-3 py-1 text-xs", on ? `${p.color} ${p.text}` : "border border-border bg-card")}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={run} disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Generate plan
              </Button>
            </DialogFooter>
          </div>
        )}
        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{preview.length} posts ready. Save to add as drafts.</p>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded-md border border-border p-2">
              {preview.map((p, i) => {
                const pm = platformMeta(p.platform);
                return (
                  <div key={i} className="rounded p-2 text-xs hover:bg-accent">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={cn(pm.color, pm.text, "border-transparent")}>{pm.label}</Badge>
                      <span className="text-muted-foreground">{p.date} · {String(p.hour).padStart(2,"0")}:00</span>
                      <span className="text-muted-foreground">· {p.category}</span>
                    </div>
                    <div className="font-medium">{p.caption}</div>
                    <div className="text-muted-foreground">{p.hashtags}</div>
                    <div className="text-muted-foreground italic">CTA: {p.cta}</div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>Back</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save all as drafts
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Media Library ---------- */

function MediaLibrary() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState<"upload"|"ai"|"brand">("upload");
  const [type, setType] = useState<"image"|"video"|"logo"|"other">("image");

  const mediaQ = useQuery({
    queryKey: ["media-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });

  const onUpload = async (f: File) => {
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not signed in");
      if (f.size > 15 * 1024 * 1024) throw new Error("Max 15 MB");
      const ext = f.name.split(".").pop() ?? "bin";
      const path = `${userId}/media/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ai-images").upload(path, f, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("ai-images").getPublicUrl(path);
      const { error } = await supabase.from("media_assets").insert({
        user_id: userId, name: f.name, file_url: pub.publicUrl,
        file_type: type, source,
      } as never);
      if (error) throw error;
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["media-assets"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><CardTitle>Media Library</CardTitle><p className="text-xs text-muted-foreground">Uploads, AI images, brand assets and logos</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="logo">Logo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
              </SelectContent>
            </Select>
            <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />} Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!mediaQ.data?.length ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No assets yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {mediaQ.data.map((m) => (
              <div key={m.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  {m.file_type === "video" ? (
                    <video src={m.file_url} className="size-full object-cover" />
                  ) : (
                    <img src={m.file_url} alt={m.name} className="size-full object-cover" />
                  )}
                </div>
                <div className="space-y-1 p-2">
                  <div className="truncate text-xs font-medium">{m.name}</div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{m.source}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(m.file_url); toast.success("URL copied"); }}>Copy URL</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Analytics ---------- */

function AnalyticsPanel() {
  const q = useQuery({
    queryKey: ["calendar-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_posts").select("status,platform,scheduled_at");
      if (error) throw error;
      const rows = data ?? [];
      const byStatus: Record<string, number> = {};
      const byPlatform: Record<string, number> = {};
      const byHour: Record<number, number> = {};
      for (const r of rows) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        byPlatform[r.platform] = (byPlatform[r.platform] ?? 0) + 1;
        const h = new Date(r.scheduled_at).getHours();
        byHour[h] = (byHour[h] ?? 0) + 1;
      }
      const bestHours = Object.entries(byHour)
        .sort((a,b) => b[1]-a[1]).slice(0,3)
        .map(([h,c]) => `${h.padStart(2,"0")}:00 (${c})`);
      return { total: rows.length, byStatus, byPlatform, bestHours };
    },
  });
  const a = q.data;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total posts</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{a?.total ?? 0}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{a?.byStatus?.scheduled ?? 0}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Published</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{a?.byStatus?.published ?? 0}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Failed</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{a?.byStatus?.failed ?? 0}</div></CardContent></Card>

      <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">By platform</CardTitle></CardHeader><CardContent className="space-y-2">
        {PLATFORMS.map((p) => {
          const c = a?.byPlatform?.[p.value] ?? 0;
          const max = Math.max(1, ...Object.values(a?.byPlatform ?? {}));
          return (
            <div key={p.value} className="space-y-1">
              <div className="flex justify-between text-xs"><span>{p.label}</span><span className="text-muted-foreground">{c}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full", p.color)} style={{ width: `${(c/max)*100}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent></Card>

      <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">Best posting hours</CardTitle></CardHeader><CardContent>
        {a?.bestHours?.length ? (
          <ul className="space-y-1 text-sm">{a.bestHours.map((h) => <li key={h}>{h}</li>)}</ul>
        ) : <p className="text-sm text-muted-foreground">Not enough data yet.</p>}
        <p className="mt-3 text-xs text-muted-foreground">Engagement, reach and clicks will populate here once a publishing connector is connected.</p>
      </CardContent></Card>
    </div>
  );
}
