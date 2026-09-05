REVOKE ALL ON FUNCTION public.shares_chat_channel(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_chat_channel(uuid, uuid) TO authenticated;