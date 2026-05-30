import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Smile,
  Trash2,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Daily Blog – Digital Agency OS" },
      {
        name: "description",
        content:
          "Share daily updates, ideas, and stories on the Digital Agency OS community blog.",
      },
      { property: "og:title", content: "Daily Blog – Digital Agency OS" },
      {
        property: "og:description",
        content:
          "Daily updates, ideas, and stories from the Digital Agency OS community.",
      },
      { property: "og:type", content: "article" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Daily Blog – Digital Agency OS",
          url: "https://impact-reach-tool.lovable.app/blog",
          author: { "@type": "Organization", name: "Digital Agency OS" },
          publisher: { "@type": "Organization", name: "Digital Agency OS" },
        }),
      },
    ],
  }),
});

type Post = {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  author_name: string | null;
  created_at: string;
};

const FONTS = [
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, monospace" },
  { label: "Display", value: "'Georgia', 'Times New Roman', serif" },
  { label: "Handwritten", value: "'Comic Sans MS', cursive" },
];

const EMOJIS = [
  "😀","😂","😍","🥳","🤩","😎","🤔","😢","😡","👍","👏","🙏","🔥","✨","💡","🚀","🎉","❤️","💯","✅","📈","📌","💼","📝","🌟","☕","🍕","🌈","🎯","🏆",
];

function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    else setPosts((data ?? []) as Post[]);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      if (data.user?.email && !authorName) {
        setAuthorName(data.user.email.split("@")[0]);
      }
    });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const insertHTML = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
  };

  const onUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be <5MB");
    const ext = file.name.split(".").pop() || "png";
    const path = `public/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    insertHTML(
      `<img src="${data.publicUrl}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;" />`,
    );
  };

  const sanitize = (html: string) => {
    // Strip scripts and inline event handlers
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/ on\w+="[^"]*"/gi, "")
      .replace(/ on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  };

  const submit = async () => {
    const html = sanitize(editorRef.current?.innerHTML ?? "").trim();
    const plain = (editorRef.current?.innerText ?? "").trim();
    if (!title.trim()) return toast.error("Title required");
    if (!authorName.trim()) return toast.error("Your name is required");
    if (!plain) return toast.error("Write something");
    setLoading(true);
    const { error } = await supabase.from("blog_posts").insert({
      user_id: userId,
      title: title.trim().slice(0, 200),
      content: html.slice(0, 20000),
      author_name: authorName.trim().slice(0, 80),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    toast.success("Posted!");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Home
          </Link>
          <h1 className="text-lg font-semibold">Daily Blog</h1>
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Write a post</CardTitle>
            <p className="text-xs text-muted-foreground">
              Open to everyone — no account required.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={80}
              />
              <Input
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-2">
              <Button type="button" variant="ghost" size="icon" aria-label="Bold" onClick={() => exec("bold")}>
                <Bold className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Italic" onClick={() => exec("italic")}>
                <Italic className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Underline" onClick={() => exec("underline")}>
                <Underline className="size-4" />
              </Button>

              <Select onValueChange={(v) => exec("fontName", v)}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f.label} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(v) => exec("fontSize", v)}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {["2", "3", "4", "5", "6", "7"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                type="color"
                onChange={(e) => exec("foreColor", e.target.value)}
                className="size-8 cursor-pointer rounded border border-border bg-background"
                title="Text color"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Insert emoji">
                    <Smile className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded p-1 text-xl hover:bg-accent"
                        onClick={() => insertHTML(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                title="Insert image"
              >
                <ImageIcon className="size-4" />
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-40 rounded-md border border-border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-placeholder="What's on your mind?"
            />

            <Button onClick={submit} disabled={loading}>
              {loading ? "Posting…" : "Publish"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          )}
          {posts.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.author_name ?? "Anonymous"} ·{" "}
                    {new Date(p.created_at).toLocaleString()}
                  </p>
                </div>
                {p.user_id && p.user_id === userId && (
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitize(p.content) }}
                />

              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
