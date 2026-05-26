import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateOrEditImage } from "@/lib/ai-studio.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageIcon, Wand2, Upload, Loader2, Download, Link2, Trash2, Briefcase, Megaphone, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-studio")({
  component: AIStudioPage,
});

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "product_ad", label: "Product ad" },
  { value: "social_media_ad", label: "Social media ad" },
  { value: "cartoon", label: "Cartoon" },
  { value: "luxury_brand", label: "Luxury brand" },
  { value: "construction_industry", label: "Construction industry" },
  { value: "real_estate", label: "Real estate" },
];

const SIZES = [
  { value: "square", label: "Square (1:1)" },
  { value: "portrait", label: "Portrait (3:4)" },
  { value: "landscape", label: "Landscape (16:9)" },
];

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

function AIStudioPage() {
  const qc = useQueryClient();
  const call = useServerFn(generateOrEditImage);

  const [mode, setMode] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [size, setSize] = useState<"square" | "portrait" | "landscape">("square");
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [assignOpen, setAssignOpen] = useState<null | { id: string; kind: "client" | "campaign" }>(null);
  const [assignTarget, setAssignTarget] = useState<string>("");

  const gallery = useQuery({
    queryKey: ["ai_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_images")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const clientsQ = useQuery({
    queryKey: ["clients", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,business_name").order("business_name");
      if (error) throw error;
      return data;
    },
  });

  const campaignsQ = useQuery({
    queryKey: ["campaigns", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const gen = useMutation({
    mutationFn: async () =>
      call({
        data: {
          mode,
          prompt,
          style,
          size,
          sourceDataUrl: mode === "edit" ? sourceDataUrl ?? undefined : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Image saved to gallery");
      qc.invalidateQueries({ queryKey: ["ai_images"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_UPLOAD_BYTES) return toast.error("Image too large (max 8 MB)");
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file");
    setSourceDataUrl(await fileToDataUrl(f));
  };

  const submit = () => {
    if (!prompt.trim()) return toast.error("Please enter a prompt");
    if (mode === "edit" && !sourceDataUrl) return toast.error("Please upload an image to edit");
    gen.mutate();
  };

  const remove = async (id: string, storagePath: string | null) => {
    const { error } = await supabase.from("ai_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (storagePath) await supabase.storage.from("ai-images").remove([storagePath]);
    qc.invalidateQueries({ queryKey: ["ai_images"] });
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  const download = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop() ?? "image.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  const assign = async () => {
    if (!assignOpen || !assignTarget) return;
    const patch = assignOpen.kind === "client" ? { client_id: assignTarget } : { campaign_id: assignTarget };
    const { error } = await supabase.from("ai_images").update(patch).eq("id", assignOpen.id);
    if (error) return toast.error(error.message);
    toast.success(`Saved to ${assignOpen.kind}`);
    setAssignOpen(null);
    setAssignTarget("");
    qc.invalidateQueries({ queryKey: ["ai_images"] });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
          <ImageIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Creative Studio</h1>
          <p className="text-sm text-muted-foreground">Generate or edit on-brand visuals in seconds.</p>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Content Policy</AlertTitle>
        <AlertDescription>
          Only upload images you own or have permission to use. Do not generate copyrighted logos, celebrity likenesses, fake documents, or misleading before-and-after claims.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Create</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "generate" | "edit")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate"><Wand2 className="size-4" /> Generate</TabsTrigger>
                <TabsTrigger value="edit"><Upload className="size-4" /> Edit upload</TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Prompt</Label>
                  <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A modern construction site at golden hour with workers reviewing blueprints…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Size</Label>
                    <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Source image</Label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
                    className="group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50"
                  >
                    {sourceDataUrl ? (
                      <>
                        <img src={sourceDataUrl} alt="Upload preview" className="h-full w-full object-contain" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setSourceDataUrl(null); }}
                          className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
                          aria-label="Remove upload"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        <Upload className="mx-auto mb-2 size-6" />
                        Click or drop an image (max 8 MB)
                      </div>
                    )}
                    <input
                      ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Instructions</Label>
                  <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Remove the background, add construction workers, turn this into a Facebook ad creative…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Style (optional)</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <Button className="mt-4 w-full" disabled={gen.isPending} onClick={submit}>
              {gen.isPending
                ? <><Loader2 className="size-4 animate-spin" /> {mode === "edit" ? "Editing…" : "Generating…"}</>
                : <><Wand2 className="size-4" /> {mode === "edit" ? "Edit image" : "Generate image"}</>}
            </Button>
            {gen.isError && (
              <p className="mt-2 text-sm text-destructive">{(gen.error as Error).message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Project gallery</CardTitle></CardHeader>
          <CardContent>
            {gallery.isLoading && (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
            {gallery.data && gallery.data.length === 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Generated images will appear here.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.data?.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
                  <img src={img.image_url} alt={img.prompt} loading="lazy" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="secondary" className="size-7" onClick={() => download(img.image_url)} title="Download">
                        <Download className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="secondary" className="size-7" onClick={() => copyUrl(img.image_url)} title="Copy URL">
                        <Link2 className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" className="size-7" onClick={() => remove(img.id, img.storage_path)} title="Delete">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" className="h-7 flex-1 text-xs" onClick={() => { setAssignTarget(""); setAssignOpen({ id: img.id, kind: "client" }); }}>
                        <Briefcase className="size-3" /> Client
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 flex-1 text-xs" onClick={() => { setAssignTarget(""); setAssignOpen({ id: img.id, kind: "campaign" }); }}>
                        <Megaphone className="size-3" /> Campaign
                      </Button>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 max-w-[80%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {img.style ?? img.mode}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!assignOpen} onOpenChange={(o) => !o && setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to {assignOpen?.kind}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{assignOpen?.kind === "client" ? "Client" : "Campaign"}</Label>
            <Select value={assignTarget} onValueChange={setAssignTarget}>
              <SelectTrigger><SelectValue placeholder={`Pick a ${assignOpen?.kind}…`} /></SelectTrigger>
              <SelectContent>
                {assignOpen?.kind === "client"
                  ? clientsQ.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)
                  : campaignsQ.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
            <Button disabled={!assignTarget} onClick={assign}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
