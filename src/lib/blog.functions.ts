import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeRichText } from "./sanitize";

const MAX_CONTENT = 20000;

const createInput = z.object({
  title: z.string().trim().min(1).max(200),
  authorName: z.string().trim().min(1).max(80),
  html: z.string().min(1).max(200000),
});

export const createBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const clean = sanitizeRichText(data.html).trim();
    const textOnly = clean.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!textOnly) throw new Error("Post content is empty after sanitizing.");
    if (clean.length > MAX_CONTENT) {
      throw new Error("Post is too long. Please shorten it and try again.");
    }

    const { data: row, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: userId,
        title: data.title,
        content: clean,
        author_name: data.authorName,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("blog_posts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
