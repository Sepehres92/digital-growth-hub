import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/blog")({
  component: BlogPage,
});

type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  author_name: string | null;
  created_at: string;
};

function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>("");

  const load = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPosts((data ?? []) as Post[]);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: p } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", uid)
          .maybeSingle();
        setAuthorName(p?.display_name ?? data.user?.email ?? "Anonymous");
      }
    });
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return toast.error("Sign in required");
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    setLoading(true);
    const { error } = await supabase.from("blog_posts").insert({
      user_id: userId,
      title: title.trim().slice(0, 200),
      content: content.trim().slice(0, 10000),
      author_name: authorName,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setContent("");
    toast.success("Posted");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily Blog</h1>
        <p className="text-sm text-muted-foreground">Share updates, ideas, and wins with the team.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Write a new post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={10000}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Posting…" : "Publish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to publish.</p>
        )}
        {posts.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">{p.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.author_name ?? "Anonymous"} · {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              {p.user_id === userId && (
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{p.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
