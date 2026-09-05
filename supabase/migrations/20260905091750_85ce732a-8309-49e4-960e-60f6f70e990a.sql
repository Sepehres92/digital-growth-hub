CREATE OR REPLACE FUNCTION public.export_my_storage_objects()
RETURNS TABLE (
  bucket_id text,
  name text,
  size bigint,
  mime_type text,
  created_at timestamptz,
  updated_at timestamptz,
  last_accessed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    o.bucket_id,
    o.name,
    NULLIF(o.metadata->>'size', '')::bigint AS size,
    o.metadata->>'mimetype' AS mime_type,
    o.created_at,
    o.updated_at,
    o.last_accessed_at
  FROM storage.objects o
  WHERE auth.uid() IS NOT NULL AND o.owner = auth.uid()
  ORDER BY o.bucket_id, o.name
$$;

REVOKE ALL ON FUNCTION public.export_my_storage_objects() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_my_storage_objects() TO authenticated;