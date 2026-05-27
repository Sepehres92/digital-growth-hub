import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listCampaignFolders,
  getCampaignFolder,
  updateCampaignFolderStatus,
  createCampaignFolder,
} from "@/lib/campaign-folders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, UserCheck, Users, FolderOpen, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/campaign-folders")({
  component: CampaignFoldersPage,
});

const SOURCE_META = {
  ai: { label: "AI-Generated", icon: Sparkles, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  human: { label: "Human-Assisted", icon: UserCheck, color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  ai_human_review: { label: "AI + Human Review", icon: Users, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
} as const;

const STATUS_OPTIONS = [
  "draft", "ai_generating", "pending_client_approval", "pending_human_review",
  "human_review_required", "approved", "scheduled", "active", "completed", "paused", "rejected",
] as const;

function CampaignFoldersPage() {
  const list = useServerFn(listCampaignFolders);
  const create = useServerFn(createCampaignFolder);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["campaign-folders"],
    queryFn: () => list({ data: {} }),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof create>[0]["data"]) => create({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-folders"] });
      setCreateOpen(false);
      toast.success("Campaign folder created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (selected) {
    return <CampaignFolderDetail folderId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8" /> Campaign Folders
          </h1>
          <p className="text-muted-foreground">All your campaigns, assets, and approvals in one place.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
          </DialogTrigger>
          <CreateFolderDialog onSubmit={(v) => createMutation.mutate(v)} loading={createMutation.isPending} />
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (data?.folders?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No campaign folders yet. Create one to get started.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data!.folders.map((f) => {
            const meta = SOURCE_META[f.source_type as keyof typeof SOURCE_META] ?? SOURCE_META.ai;
            const Icon = meta.icon;
            return (
              <Card key={f.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelected(f.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{f.name}</CardTitle>
                    <Badge variant="outline" className={meta.color}>
                      <Icon className="h-3 w-3 mr-1" /> {meta.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{(f.folder_type as string).replace(/_/g, " ")}</Badge>
                    <Badge>{(f.status as string).replace(/_/g, " ")}</Badge>
                  </div>
                  {f.goal && <p className="text-sm text-muted-foreground line-clamp-2">{f.goal}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateFolderDialog({
  onSubmit,
  loading,
}: {
  onSubmit: (v: { name: string; folderType: "social_media" | "seo" | "ppc" | "combined" | "human_assisted" | "ai_generated" | "ai_human_review"; sourceType: "ai" | "human" | "ai_human_review"; goal?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [folderType, setFolderType] = useState<"social_media" | "seo" | "ppc" | "combined">("social_media");
  const [sourceType, setSourceType] = useState<"ai" | "human" | "ai_human_review">("ai");
  const [goal, setGoal] = useState("");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Campaign Folder</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 Holiday Push" />
        </div>
        <div className="space-y-2">
          <Label>Campaign Type</Label>
          <Select value={folderType} onValueChange={(v) => setFolderType(v as typeof folderType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="seo">SEO</SelectItem>
              <SelectItem value="ppc">PPC</SelectItem>
              <SelectItem value="combined">Combined Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>How would you like this campaign to be created?</Label>
          <Select value={sourceType} onValueChange={(v) => setSourceType(v as typeof sourceType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI-Generated Campaign</SelectItem>
              <SelectItem value="human">Human-Assisted Campaign</SelectItem>
              <SelectItem value="ai_human_review">AI + Human Review</SelectItem>
            </SelectContent>
          </Select>
          {sourceType === "human" && (
            <p className="text-xs text-muted-foreground">
              Your first human consultation is limited to 1 hour and available one time only. Future human consultations require paid booking.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Goal (optional)</Label>
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What success looks like…" />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit({ name, folderType, sourceType, goal: goal || undefined })}
          disabled={loading || !name.trim()}
        >
          {loading ? "Creating…" : "Create Folder"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CampaignFolderDetail({ folderId, onBack }: { folderId: string; onBack: () => void }) {
  const getFolder = useServerFn(getCampaignFolder);
  const updateStatus = useServerFn(updateCampaignFolderStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campaign-folder", folderId],
    queryFn: () => getFolder({ data: { folderId } }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: (typeof STATUS_OPTIONS)[number]) =>
      updateStatus({ data: { folderId, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign-folder", folderId] });
      qc.invalidateQueries({ queryKey: ["campaign-folders"] });
      toast.success("Status updated");
    },
  });

  const allContent = useMemo(() => {
    if (!data) return [];
    return [
      ...data.contentPosts.map((p) => ({ ...p, _kind: "post" as const })),
      ...data.socialPosts.map((p) => ({ ...p, _kind: "social" as const })),
      ...data.strategyContent.map((p) => ({ ...p, _kind: "strategy" as const })),
    ];
  }, [data]);

  if (isLoading || !data) {
    return <div className="container mx-auto p-6">Loading…</div>;
  }
  const f = data.folder;
  if (!f) return <div className="container mx-auto p-6">Folder not found.</div>;
  const meta = SOURCE_META[f.source_type as keyof typeof SOURCE_META] ?? SOURCE_META.ai;
  const Icon = meta.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-2xl">{f.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={meta.color}>
                  <Icon className="h-3 w-3 mr-1" /> {meta.label}
                </Badge>
                <Badge variant="secondary">{(f.folder_type as string).replace(/_/g, " ")}</Badge>
              </div>
            </div>
            <div className="min-w-[220px]">
              <Label className="text-xs">Status</Label>
              <Select value={f.status as string} onValueChange={(v) => statusMutation.mutate(v as (typeof STATUS_OPTIONS)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        {f.goal && <CardContent><p className="text-sm text-muted-foreground">{f.goal}</p></CardContent>}
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="copy">AI Copy</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Content Posts" value={data.contentPosts.length + data.socialPosts.length + data.strategyContent.length} />
            <StatCard label="Images" value={data.images.length} />
            <StatCard label="Videos" value={data.videos.length} />
            <StatCard label="AI Copy" value={data.copies.length} />
            <StatCard label="Tasks" value={data.tasks.length} />
            <StatCard label="Meetings" value={data.meetings.length} />
          </div>
        </TabsContent>

        <TabsContent value="strategy">
          {f.strategy_summary ? (
            <Card><CardContent className="pt-6 whitespace-pre-wrap">{f.strategy_summary}</CardContent></Card>
          ) : (
            <p className="text-muted-foreground">No strategy summary yet.</p>
          )}
        </TabsContent>

        <TabsContent value="content">
          <ListBlock
            items={allContent}
            empty="No content yet."
            render={(item) => {
              const i = item as { _kind: string; id: string; title?: string | null; caption?: string | null; platform?: string | null; status?: string | null };
              return (
                <Card key={`${i._kind}-${i.id}`}>
                  <CardContent className="pt-4 space-y-1">
                    {i.title && <p className="font-medium">{i.title}</p>}
                    {i.caption && <p className="text-sm line-clamp-3">{i.caption}</p>}
                    <div className="flex gap-2 text-xs">
                      {i.platform && <Badge variant="secondary">{i.platform}</Badge>}
                      {i.status && <Badge>{i.status}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="images">
          <ListBlock items={data.images} empty="No images yet." render={(i) => {
            const img = i as { id: string; image_url?: string | null; prompt?: string | null };
            return (
              <Card key={img.id}><CardContent className="pt-4">
                {img.image_url && <img src={img.image_url} alt="" className="rounded mb-2 max-h-48 object-cover w-full" />}
                {img.prompt && <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>}
              </CardContent></Card>
            );
          }} />
        </TabsContent>

        <TabsContent value="videos">
          <ListBlock items={data.videos} empty="No videos yet." render={(i) => {
            const v = i as { id: string; title?: string | null; status?: string | null };
            return (
              <Card key={v.id}><CardContent className="pt-4">
                <p className="font-medium">{v.title ?? "Untitled"}</p>
                {v.status && <Badge className="mt-1">{v.status}</Badge>}
              </CardContent></Card>
            );
          }} />
        </TabsContent>

        <TabsContent value="copy">
          <ListBlock items={data.copies} empty="No AI copy yet." render={(i) => {
            const c = i as { id: string; title?: string | null; body?: string | null; copy_type?: string | null };
            return (
              <Card key={c.id}><CardContent className="pt-4 space-y-1">
                {c.title && <p className="font-medium">{c.title}</p>}
                {c.copy_type && <Badge variant="secondary">{c.copy_type}</Badge>}
                {c.body && <p className="text-sm line-clamp-3 whitespace-pre-wrap">{c.body}</p>}
              </CardContent></Card>
            );
          }} />
        </TabsContent>

        <TabsContent value="tasks">
          <ListBlock items={data.tasks} empty="No tasks yet." render={(i) => {
            const t = i as { id: string; title: string; status?: string | null; due_date?: string | null };
            return (
              <Card key={t.id}><CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.title}</p>
                  {t.due_date && <p className="text-xs text-muted-foreground">Due {t.due_date}</p>}
                </div>
                {t.status && <Badge>{t.status}</Badge>}
              </CardContent></Card>
            );
          }} />
        </TabsContent>

        <TabsContent value="meetings">
          <ListBlock items={data.meetings} empty="No meetings yet." render={(i) => {
            const m = i as { id: string; title: string; meeting_date: string; status?: string | null };
            return (
              <Card key={m.id}><CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.meeting_date}</p>
                </div>
                {m.status && <Badge>{m.status}</Badge>}
              </CardContent></Card>
            );
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="pt-6">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </CardContent></Card>
  );
}

function ListBlock<T>({ items, empty, render }: { items: T[]; empty: string; render: (item: T) => React.ReactNode }) {
  if (items.length === 0) return <p className="text-muted-foreground py-4">{empty}</p>;
  return <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">{items.map(render)}</div>;
}
