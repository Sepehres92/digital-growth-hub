
-- 1. blog-images upload restriction
DROP POLICY IF EXISTS "blog images public upload" ON storage.objects;

CREATE POLICY "blog images owner upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "blog images owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "blog images owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. chat presence scoped to shared channels
CREATE OR REPLACE FUNCTION public.shares_chat_channel(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _a = _b OR EXISTS (
    SELECT 1
    FROM public.chat_channel_members m1
    JOIN public.chat_channel_members m2 ON m1.channel_id = m2.channel_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  );
$$;

DROP POLICY IF EXISTS "anyone authed views presence" ON public.chat_presence;

CREATE POLICY "shared channel members view presence"
ON public.chat_presence FOR SELECT TO authenticated
USING (public.shares_chat_channel(auth.uid(), user_id));

-- 3. meeting_notes: restrict policies to authenticated role, owner-only writes
DROP POLICY IF EXISTS "own select" ON public.meeting_notes;
DROP POLICY IF EXISTS "own insert" ON public.meeting_notes;
DROP POLICY IF EXISTS "own update" ON public.meeting_notes;
DROP POLICY IF EXISTS "own delete" ON public.meeting_notes;

CREATE POLICY "own select" ON public.meeting_notes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "own insert" ON public.meeting_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own update" ON public.meeting_notes FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own delete" ON public.meeting_notes FOR DELETE TO authenticated
USING (auth.uid() = user_id);
