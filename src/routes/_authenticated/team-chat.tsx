import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { chatAiAssist } from "@/lib/chat-ai.functions";
import {
  Plus, Hash, Lock, Send, Search, Sparkles, Paperclip, Pin, BellOff, Bell,
  MessageSquare, Users, Phone, Video as VideoIcon, MonitorUp, CornerDownRight, X, Loader2,
  RotateCw, Check, CheckCheck, WifiOff, ListTodo, CalendarPlus, CalendarDays, Building2, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/team-chat")({
  ssr: false,
  component: TeamChatPage,
});

type Channel = {
  id: string; name: string; description: string; channel_type: "public" | "private" | "invite" | "dm";
  created_by: string; created_at: string; is_archived: boolean;
};
type Member = { id: string; channel_id: string; user_id: string; role: string; muted: boolean; pinned: boolean; last_read_at: string };
type Message = {
  id: string; channel_id: string; user_id: string; parent_id: string | null; content: string;
  message_type: string; attachments: Array<{ url: string; name: string; type: string }>;
  mentions: string[]; ai_generated: boolean; edited: boolean; created_at: string;
};
type Presence = { user_id: string; status: "online" | "away" | "busy" | "offline"; last_seen: string };

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀", "👀", "🔥", "✅"];

function TeamChatPage() {
  const qc = useQueryClient();
  const aiAssist = useServerFn(chatAiAssist);
  const [me, setMe] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [threadDraft, setThreadDraft] = useState("");
  const [newChanOpen, setNewChanOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState<"summarize" | "captions" | "campaign_ideas" | "client_reply" | "tasks" | "meeting_notes" | "calendar">("summarize");
  const [aiResult, setAiResult] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [failedMessages, setFailedMessages] = useState<Array<{ tempId: string; content: string; parentId: string | null; attachments?: Message["attachments"]; type?: string }>>([]);
  const [connState, setConnState] = useState<"connecting" | "connected" | "reconnecting">("connecting");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentTypingRef = useRef<number>(0);
  const notifEnabledRef = useRef(false);
  const activeChannelNameRef = useRef<string>("");
  const PAGE = 30;

  type ConvertAction = "task" | "meeting" | "calendar" | "client_note" | "ai_campaign";
  const [convertMsg, setConvertMsg] = useState<Message | null>(null);
  const [convertAction, setConvertAction] = useState<ConvertAction>("task");
  const [convertClientId, setConvertClientId] = useState<string>("");
  const [convertPlatform, setConvertPlatform] = useState<string>("instagram");
  const [convertDate, setConvertDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [convertBusy, setConvertBusy] = useState(false);
  const openConvert = (m: Message, a: ConvertAction) => {
    setConvertMsg(m); setConvertAction(a);
    setConvertClientId(""); setConvertPlatform("instagram");
    setConvertDate(new Date().toISOString().slice(0, 10));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!me) return;
    const beat = async () => {
      await (supabase.from("chat_presence") as any).upsert(
        { user_id: me, status: "online", last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    };
    beat();
    const t = setInterval(beat, 30000);
    const off = () => (supabase.from("chat_presence") as any).upsert({ user_id: me, status: "offline", last_seen: new Date().toISOString() }, { onConflict: "user_id" });
    window.addEventListener("beforeunload", off);
    return () => { clearInterval(t); window.removeEventListener("beforeunload", off); off(); };
  }, [me]);

  const { data: channels = [] } = useQuery({
    queryKey: ["chat-channels"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chat_channels") as any)
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Channel[];
    },
    enabled: !!me,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["chat-members", me],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chat_channel_members") as any).select("*").eq("user_id", me!);
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!me,
  });

  const { data: presence = [] } = useQuery({
    queryKey: ["chat-presence"],
    queryFn: async () => {
      const { data } = await (supabase.from("chat_presence") as any).select("*");
      return (data ?? []) as Presence[];
    },
    enabled: !!me,
    refetchInterval: 30000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["chat-clients", me],
    queryFn: async () => {
      const { data } = await (supabase.from("clients") as any)
        .select("id,business_name,notes").eq("user_id", me!).order("business_name");
      return (data ?? []) as Array<{ id: string; business_name: string; notes: string | null }>;
    },
    enabled: !!me,
  });

  const runConvert = async () => {
    if (!convertMsg || !me) return;
    const content = (convertMsg.content || "").trim();
    const title = content.slice(0, 80) || "From team chat";
    setConvertBusy(true);
    try {
      if (convertAction === "task") {
        const { error } = await (supabase.from("tasks") as any).insert({
          user_id: me, title, notes: content, status: "todo", priority: "medium",
          client_id: convertClientId || null,
        });
        if (error) throw error;
        toast.success("Task created");
      } else if (convertAction === "meeting") {
        const { error } = await (supabase.from("meetings") as any).insert({
          user_id: me, title, description: content,
          meeting_date: convertDate, status: "scheduled",
          client_id: convertClientId || null,
        });
        if (error) throw error;
        toast.success("Meeting scheduled");
      } else if (convertAction === "calendar") {
        const { data: post, error: pe } = await (supabase.from("content_posts") as any).insert({
          user_id: me, platform: convertPlatform, caption: content,
          status: "scheduled", scheduled_for: new Date(convertDate).toISOString(),
          client_id: convertClientId || null,
        }).select("id").single();
        if (pe) throw pe;
        const { error: ce } = await (supabase.from("content_calendar") as any).insert({
          user_id: me, post_id: post.id, platform: convertPlatform,
          calendar_date: convertDate, status: "scheduled",
        });
        if (ce) throw ce;
        toast.success("Added to content calendar");
      } else if (convertAction === "client_note") {
        if (!convertClientId) { toast.error("Pick a client"); setConvertBusy(false); return; }
        const c = clients.find((x) => x.id === convertClientId);
        const prev = c?.notes ? c.notes + "\n\n" : "";
        const stamp = new Date().toLocaleString();
        const { error } = await (supabase.from("clients") as any)
          .update({ notes: `${prev}[${stamp}] ${content}` }).eq("id", convertClientId);
        if (error) throw error;
        toast.success("Saved to client notes");
      } else if (convertAction === "ai_campaign") {
        let ideas = "";
        try {
          const r = await aiAssist({ data: { channelId: convertMsg.channel_id, action: "campaign_ideas", extra: content } });
          ideas = (r as any)?.reply ?? "";
        } catch {}
        const { error } = await (supabase.from("campaigns") as any).insert({
          user_id: me, name: title, type: "seo", status: "planned",
          goal: content, results_notes: ideas || "",
          client_id: convertClientId || null,
        });
        if (error) throw error;
        toast.success("AI campaign created");
      }
      try {
        await (supabase.from("chat_audit_log") as any).insert({
          user_id: me, channel_id: convertMsg.channel_id, message_id: convertMsg.id,
          action: `convert_${convertAction}`, details: { client_id: convertClientId || null },
        });
      } catch {}
      setConvertMsg(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setConvertBusy(false);
    }
  };


  const myChannelIds = new Set(members.map((m) => m.channel_id));
  const visible = channels.filter((c) =>
    (c.channel_type === "public" || myChannelIds.has(c.id)) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );
  const pinnedIds = new Set(members.filter((m) => m.pinned).map((m) => m.channel_id));
  const sorted = [...visible].sort((a, b) => {
    const ap = pinnedIds.has(a.id) ? 0 : 1;
    const bp = pinnedIds.has(b.id) ? 0 : 1;
    return ap - bp || a.name.localeCompare(b.name);
  });

  useEffect(() => { if (!activeId && sorted.length) setActiveId(sorted[0].id); }, [sorted, activeId]);

  // Infinite scroll: load PAGE newest first, fetch older as user scrolls up.
  const messagesQuery = useInfiniteQuery({
    queryKey: ["chat-messages", activeId],
    enabled: !!activeId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let q = (supabase.from("chat_messages") as any)
        .select("*")
        .eq("channel_id", activeId!)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (pageParam) q = q.lt("created_at", pageParam);
      const { data, error } = await q;
      if (error) throw error;
      return data as Message[];
    },
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE ? undefined : lastPage[lastPage.length - 1].created_at,
  });

  const serverMessages = useMemo(() => {
    const flat = messagesQuery.data?.pages.flat() ?? [];
    return [...flat].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [messagesQuery.data]);

  const messages = useMemo(() => {
    const seen = new Set(serverMessages.map((m) => m.id));
    return [...serverMessages, ...pendingMessages.filter((p) => !seen.has(p.id))];
  }, [serverMessages, pendingMessages]);

  // All members of the active channel (for read receipts)
  const { data: channelMembers = [] } = useQuery({
    queryKey: ["chat-channel-members", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("chat_channel_members") as any)
        .select("user_id,last_read_at").eq("channel_id", activeId!);
      if (error) throw error;
      return (data ?? []) as Array<{ user_id: string; last_read_at: string }>;
    },
    refetchInterval: 15000,
  });

  const { data: threadMsgs = [] } = useQuery({
    queryKey: ["chat-thread", threadParent?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chat_messages") as any)
        .select("*")
        .eq("parent_id", threadParent!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!threadParent,
  });

  // Notification permission
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "granted") notifEnabledRef.current = true;
    else if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => { notifEnabledRef.current = p === "granted"; }).catch(() => {});
    }
  }, []);

  // Realtime: messages + typing broadcasts + reconnect state
  useEffect(() => {
    if (!activeId) return;
    setConnState("connecting");
    const ch = supabase
      .channel(`chat-${activeId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeId}` },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["chat-messages", activeId] });
          if (threadParent) qc.invalidateQueries({ queryKey: ["chat-thread", threadParent.id] });
          if (payload?.eventType === "INSERT" && payload?.new?.user_id !== me) {
            if (document.hidden && notifEnabledRef.current) {
              try { new Notification(`New message in #${activeChannelNameRef.current || "channel"}`, { body: String(payload.new.content ?? "").slice(0, 140) }); } catch {}
            }
            if (soundOn) try { new Audio("data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_channel_members", filter: `channel_id=eq.${activeId}` },
        () => qc.invalidateQueries({ queryKey: ["chat-channel-members", activeId] }))
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: { user_id: string } }) => {
        if (!payload?.user_id || payload.user_id === me) return;
        setTypingUsers((prev) => (prev.includes(payload.user_id) ? prev : [...prev, payload.user_id]));
        window.setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u !== payload.user_id)), 4000);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnState("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnState("reconnecting");
      });
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [activeId, qc, threadParent, soundOn, me]);

  // Auto-reconnect refresh on tab visibility return
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && activeId) {
        qc.invalidateQueries({ queryKey: ["chat-messages", activeId] });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [activeId, qc]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el || !messagesQuery.hasNextPage) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !messagesQuery.isFetchingNextPage) {
        messagesQuery.fetchNextPage();
      }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [messagesQuery.hasNextPage, messagesQuery.isFetchingNextPage, messagesQuery]);


  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, activeId]);

  const createChannel = useMutation({
    mutationFn: async (v: { name: string; description: string; type: "public" | "private" | "invite" }) => {
      if (!me) throw new Error("no user");
      const { data: ch, error } = await (supabase.from("chat_channels") as any)
        .insert({ name: v.name.trim(), description: v.description, channel_type: v.type, created_by: me })
        .select().single();
      if (error) throw error;
      await (supabase.from("chat_channel_members") as any).insert({ channel_id: ch.id, user_id: me, role: "owner" });
      return ch as Channel;
    },
    onSuccess: (ch) => {
      qc.invalidateQueries({ queryKey: ["chat-channels"] });
      qc.invalidateQueries({ queryKey: ["chat-members", me] });
      setActiveId(ch.id);
      setNewChanOpen(false);
      toast.success("Channel created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const joinChannel = useMutation({
    mutationFn: async (channelId: string) => {
      if (!me) throw new Error("no user");
      const { error } = await (supabase.from("chat_channel_members") as any).insert({ channel_id: channelId, user_id: me, role: "member" });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-members", me] }),
  });

  type SendVars = { content: string; parentId?: string | null; attachments?: Message["attachments"]; type?: string; tempId?: string };

  const sendMessage = useMutation({
    mutationFn: async (v: SendVars) => {
      if (!me || !activeId) throw new Error("no channel");
      const mentions = Array.from(v.content.matchAll(/@([0-9a-f-]{8,})/g)).map((m) => m[1]);
      const { error } = await (supabase.from("chat_messages") as any).insert({
        channel_id: activeId, user_id: me, parent_id: v.parentId ?? null,
        content: v.content.trim(), message_type: v.type ?? "text",
        attachments: v.attachments ?? [], mentions,
      });
      if (error) throw error;
      await (supabase.from("chat_audit_log") as any).insert({ user_id: me, channel_id: activeId, action: "message.send" });
    },
    onMutate: async (v) => {
      if (!me || !activeId || v.parentId) return { tempId: v.tempId };
      const tempId = v.tempId ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: tempId, channel_id: activeId, user_id: me, parent_id: null,
        content: v.content.trim(), message_type: v.type ?? "text",
        attachments: v.attachments ?? [], mentions: [], ai_generated: false, edited: false,
        created_at: new Date().toISOString(),
      };
      setPendingMessages((prev) => [...prev, optimistic]);
      setFailedMessages((prev) => prev.filter((f) => f.tempId !== tempId));
      return { tempId };
    },
    onSuccess: (_d, _v, ctx) => {
      if (ctx?.tempId) setPendingMessages((prev) => prev.filter((p) => p.id !== ctx.tempId));
      qc.invalidateQueries({ queryKey: ["chat-messages", activeId] });
    },
    onError: (e, v, ctx) => {
      if (ctx?.tempId) {
        setPendingMessages((prev) => prev.filter((p) => p.id !== ctx.tempId));
        setFailedMessages((prev) => [...prev, { tempId: ctx.tempId!, content: v.content, parentId: v.parentId ?? null, attachments: v.attachments, type: v.type }]);
      }
      toast.error(e instanceof Error ? e.message : "Send failed — tap retry");
    },
  });

  const retryFailed = (f: { tempId: string; content: string; parentId: string | null; attachments?: Message["attachments"]; type?: string }) => {
    setFailedMessages((prev) => prev.filter((x) => x.tempId !== f.tempId));
    sendMessage.mutate({ content: f.content, parentId: f.parentId, attachments: f.attachments, type: f.type, tempId: f.tempId });
  };

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !me) return;
    const now = Date.now();
    if (now - lastSentTypingRef.current < 2000) return;
    lastSentTypingRef.current = now;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: me } });
  }, [me]);



  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("chat_messages") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages", activeId] }),
  });

  const hideForMe = useMutation({
    mutationFn: async (m: Message) => {
      if (!me) return;
      const { error } = await (supabase.from("chat_messages") as any)
        .update({ deleted_for: [...(m as any).deleted_for ?? [], me] }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages", activeId] }),
  });

  const toggleMute = useMutation({
    mutationFn: async (channelId: string) => {
      const mem = members.find((m) => m.channel_id === channelId);
      if (!mem) return;
      const { error } = await (supabase.from("chat_channel_members") as any).update({ muted: !mem.muted }).eq("id", mem.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-members", me] }),
  });

  const togglePin = useMutation({
    mutationFn: async (channelId: string) => {
      const mem = members.find((m) => m.channel_id === channelId);
      if (!mem) return;
      const { error } = await (supabase.from("chat_channel_members") as any).update({ pinned: !mem.pinned }).eq("id", mem.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-members", me] }),
  });

  const markRead = useMutation({
    mutationFn: async (channelId: string) => {
      const mem = members.find((m) => m.channel_id === channelId);
      if (!mem) return;
      await (supabase.from("chat_channel_members") as any).update({ last_read_at: new Date().toISOString() }).eq("id", mem.id);
    },
  });

  const handleSend = async (parent?: Message) => {
    const text = parent ? threadDraft : draft;
    if (!text.trim()) return;
    if (!myChannelIds.has(activeId!)) await joinChannel.mutateAsync(activeId!);
    await sendMessage.mutateAsync({ content: text, parentId: parent?.id ?? null });
    if (parent) setThreadDraft(""); else setDraft("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !me || !activeId) return;
    if (file.size > 25 * 1024 * 1024) return toast.error("Max 25MB");
    const path = `${me}/${activeId}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("chat-files").upload(path, file);
    if (up.error) return toast.error(up.error.message);
    const { data: signed } = await supabase.storage.from("chat-files").createSignedUrl(path, 60 * 60 * 24 * 7);
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "voice" : "file";
    await sendMessage.mutateAsync({
      content: file.name, type,
      attachments: [{ url: signed?.signedUrl ?? "", name: file.name, type: file.type }],
    });
    await (supabase.from("chat_audit_log") as any).insert({ user_id: me, channel_id: activeId, action: "file.upload", details: { name: file.name, size: file.size } });
    if (fileRef.current) fileRef.current.value = "";
  };

  const runAi = async () => {
    if (!activeId) return;
    setAiBusy(true); setAiResult("");
    try {
      const res = await aiAssist({ data: { channelId: activeId, action: aiAction } });
      setAiResult(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setAiBusy(false); }
  };

  const insertAiToChat = async () => {
    if (!aiResult || !activeId || !me) return;
    await (supabase.from("chat_messages") as any).insert({
      channel_id: activeId, user_id: me, content: aiResult, message_type: "ai", ai_generated: true,
    });
    setAiOpen(false); setAiResult("");
  };

  const presenceFor = (uid: string) => presence.find((p) => p.user_id === uid);
  const activeChannel = channels.find((c) => c.id === activeId);
  const activeMember = members.find((m) => m.channel_id === activeId);

  useEffect(() => { activeChannelNameRef.current = activeChannel?.name ?? ""; }, [activeChannel]);

  const unreadCount = (cid: string) => {
    const mem = members.find((m) => m.channel_id === cid);
    if (!mem) return 0;
    return messages.filter((m) => m.channel_id === cid && new Date(m.created_at) > new Date(mem.last_read_at) && m.user_id !== me).length;
  };

  // Read receipts: how many OTHER members have last_read_at >= message.created_at
  const readByCount = (m: Message) => {
    if (m.user_id !== me) return 0;
    return channelMembers.filter((cm) => cm.user_id !== me && new Date(cm.last_read_at) >= new Date(m.created_at)).length;
  };

  useEffect(() => { if (activeId && myChannelIds.has(activeId)) markRead.mutate(activeId); /* eslint-disable-next-line */ }, [activeId, messages.length]);


  const filteredMsgs = useMemo(() => {
    if (!search || !activeChannel) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()));
  }, [messages, search, activeChannel]);

  return (
    <div className="mx-auto -m-4 h-[calc(100vh-4rem)] max-w-[1600px] md:-m-8">
      <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
        {/* Sidebar */}
        <aside className="hidden flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="font-semibold">Team Chat</div>
            <Button size="icon" variant="ghost" onClick={() => setNewChanOpen(true)}><Plus className="size-4" /></Button>
          </div>
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search channels & messages" className="h-8 pl-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <ScrollArea className="flex-1 px-2 pb-3">
            <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</div>
            {sorted.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No channels yet. Create one →</p>}
            {sorted.map((c) => {
              const isMember = myChannelIds.has(c.id);
              const u = unreadCount(c.id);
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeId === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                  {c.channel_type === "private" || c.channel_type === "invite" ? <Lock className="size-3.5 shrink-0" /> : <Hash className="size-3.5 shrink-0" />}
                  <span className="truncate">{c.name}</span>
                  {pinnedIds.has(c.id) && <Pin className="ml-auto size-3 text-amber-500" />}
                  {!isMember && c.channel_type === "public" && <span className="ml-auto text-[9px] uppercase text-muted-foreground/70">join</span>}
                  {u > 0 && <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">{u}</span>}
                </button>
              );
            })}
          </ScrollArea>
          <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs">
            <span className="size-2 rounded-full bg-emerald-500" /> Online
            <Switch className="ml-auto" checked={soundOn} onCheckedChange={setSoundOn} aria-label="Sound" />
            {soundOn ? <Bell className="size-3" /> : <BellOff className="size-3" />}
          </div>
        </aside>

        {/* Main */}
        <section className="flex min-w-0 flex-col">
          {activeChannel ? (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {activeChannel.channel_type === "private" ? <Lock className="size-4" /> : <Hash className="size-4" />}
                  <h2 className="truncate font-semibold">{activeChannel.name}</h2>
                  <span className="hidden truncate text-xs text-muted-foreground md:inline">{activeChannel.description}</span>
                  {connState !== "connected" && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                      <WifiOff className="size-3" /> {connState === "reconnecting" ? "Reconnecting…" : "Connecting…"}
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled title="Voice call (coming soon)"><Phone className="size-4" /></Button>
                  <Button size="icon" variant="ghost" disabled title="Video call (coming soon)"><VideoIcon className="size-4" /></Button>
                  <Button size="icon" variant="ghost" disabled title="Screen share (coming soon)"><MonitorUp className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => activeMember && togglePin.mutate(activeId!)} title="Pin">
                    <Pin className={cn("size-4", activeMember?.pinned && "fill-amber-500 text-amber-500")} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => activeMember && toggleMute.mutate(activeId!)} title="Mute">
                    {activeMember?.muted ? <BellOff className="size-4" /> : <Bell className="size-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}><Sparkles className="size-3.5" /> AI</Button>
                </div>
              </header>

              <ScrollArea className="flex-1 px-4">
                <div className="mx-auto max-w-4xl py-4">
                  <div ref={topSentinelRef} className="flex h-6 items-center justify-center text-[10px] text-muted-foreground">
                    {messagesQuery.isFetchingNextPage ? <><Loader2 className="size-3 animate-spin" /> Loading older…</> : messagesQuery.hasNextPage ? "Scroll up for more" : ""}
                  </div>
                  {filteredMsgs.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
                  )}
                  {filteredMsgs.map((m) => {
                    const pres = presenceFor(m.user_id);
                    const isPending = m.id.startsWith("temp-");
                    const reads = readByCount(m);
                    return (
                      <div key={m.id} className={cn("group flex gap-3 rounded-md px-2 py-2 hover:bg-accent/40", isPending && "opacity-60")}>
                        <div className="relative">
                          <div className="grid size-9 place-items-center rounded-md bg-primary/15 text-xs font-medium text-primary">
                            {m.user_id.slice(0, 2).toUpperCase()}
                          </div>
                          <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card",
                            pres?.status === "online" ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold">{m.user_id === me ? "You" : m.user_id.slice(0, 8)}</span>
                            <span className="text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {m.ai_generated && <span className="rounded bg-primary/10 px-1.5 text-[10px] text-primary">AI</span>}
                            {m.edited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
                            {isPending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                          </div>
                          <div className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.content}</div>
                          {m.attachments?.map((a, i) => (
                            <div key={i} className="mt-2">
                              {a.type.startsWith("image/") && <img src={a.url} alt={a.name} className="max-h-64 rounded-md border border-border" />}
                              {a.type.startsWith("video/") && <video src={a.url} controls className="max-h-64 rounded-md border border-border" />}
                              {a.type.startsWith("audio/") && <audio src={a.url} controls />}
                              {!a.type.match(/^(image|video|audio)\//) && (
                                <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs hover:bg-accent">
                                  <Paperclip className="size-3" /> {a.name}
                                </a>
                              )}
                            </div>
                          ))}
                          <div className="mt-1 flex flex-wrap items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setThreadParent(m)}>
                              <CornerDownRight className="size-3" /> Reply
                            </Button>
                            <span className="mx-1 h-3 w-px bg-border" />
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" title="Create Task" onClick={() => openConvert(m, "task")}>
                              <ListTodo className="size-3" /> Task
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" title="Create Meeting" onClick={() => openConvert(m, "meeting")}>
                              <CalendarPlus className="size-3" /> Meeting
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" title="Add to Calendar" onClick={() => openConvert(m, "calendar")}>
                              <CalendarDays className="size-3" /> Calendar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" title="Generate AI Content" onClick={() => openConvert(m, "ai_campaign")}>
                              <Wand2 className="size-3" /> AI Content
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" title="Save to Client" onClick={() => openConvert(m, "client_note")}>
                              <Building2 className="size-3" /> Save
                            </Button>
                            {m.user_id === me ? (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-destructive" onClick={() => deleteMessage.mutate(m.id)}>Delete</Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => hideForMe.mutate(m)}>Hide</Button>
                            )}
                          </div>

                          {m.user_id === me && !isPending && reads > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <CheckCheck className="size-3 text-primary" /> Seen by {reads}
                            </div>
                          )}
                          {m.user_id === me && !isPending && reads === 0 && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Check className="size-3" /> Sent
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {failedMessages.map((f) => (
                    <div key={f.tempId} className="mx-2 mt-1 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs">
                      <span className="flex-1 truncate text-destructive">Failed: {f.content}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => retryFailed(f)}>
                        <RotateCw className="size-3" /> Retry
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setFailedMessages((p) => p.filter((x) => x.tempId !== f.tempId))}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  {typingUsers.length > 0 && (
                    <div className="mt-2 px-2 text-xs italic text-muted-foreground">
                      {typingUsers.length === 1
                        ? `${typingUsers[0].slice(0, 8)} is typing…`
                        : `${typingUsers.length} people are typing…`}
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </ScrollArea>


              <div className="border-t border-border bg-card p-3">
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                  <input ref={fileRef} type="file" hidden onChange={handleFile} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                  <Button size="icon" variant="outline" onClick={() => fileRef.current?.click()} title="Attach"><Paperclip className="size-4" /></Button>
                  <div className="relative flex-1">
                    <Textarea
                      placeholder={`Message #${activeChannel.name}  •  Use @ to mention, /ai for assistant`}
                      rows={1}
                      value={draft}
                      onChange={(e) => { setDraft(e.target.value); broadcastTyping(); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      className="max-h-40 min-h-10 resize-none pr-20"
                    />
                    <div className="absolute right-1 top-1 flex gap-0.5">
                      {EMOJIS.slice(0, 3).map((e) => (
                        <button key={e} type="button" onClick={() => setDraft((d) => d + e)} className="rounded p-1 text-sm hover:bg-accent">{e}</button>
                      ))}
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setAiOpen(true)} title="AI"><Sparkles className="size-3.5" /></Button>
                    </div>
                  </div>
                  <Button onClick={() => handleSend()} disabled={!draft.trim() || sendMessage.isPending}>
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto size-10 opacity-40" />
                <p className="mt-2">Select or create a channel to start chatting</p>
                <Button className="mt-3" onClick={() => setNewChanOpen(true)}><Plus className="size-4" /> New channel</Button>
              </div>
            </div>
          )}
        </section>

        {/* Right: thread / members */}
        <aside className="hidden flex-col border-l border-border bg-card xl:flex">
          {threadParent ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="font-semibold text-sm">Thread</div>
                <Button size="icon" variant="ghost" onClick={() => setThreadParent(null)}><X className="size-4" /></Button>
              </div>
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="rounded-md border border-border bg-background p-2 text-xs">
                  <div className="font-medium">{threadParent.user_id.slice(0, 8)}</div>
                  <div className="whitespace-pre-wrap">{threadParent.content}</div>
                </div>
                <div className="mt-3 space-y-2">
                  {threadMsgs.map((m) => (
                    <div key={m.id} className="rounded-md bg-accent/30 p-2 text-xs">
                      <div className="font-medium">{m.user_id === me ? "You" : m.user_id.slice(0, 8)}</div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-3">
                <Textarea rows={2} placeholder="Reply…" value={threadDraft} onChange={(e) => setThreadDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(threadParent); } }} />
                <Button size="sm" className="mt-2 w-full" onClick={() => handleSend(threadParent)} disabled={!threadDraft.trim()}>
                  <Send className="size-3.5" /> Reply
                </Button>
              </div>
            </>
          ) : (
            <Tabs defaultValue="members" className="flex flex-1 flex-col">
              <TabsList className="m-3 grid grid-cols-2">
                <TabsTrigger value="members"><Users className="size-3.5" /> Members</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="flex-1 px-4 pb-4">
                <p className="mb-2 text-xs text-muted-foreground">Online ({presence.filter((p) => p.status === "online").length})</p>
                <div className="space-y-1.5">
                  {presence.map((p) => (
                    <div key={p.user_id} className="flex items-center gap-2 text-xs">
                      <span className={cn("size-2 rounded-full", p.status === "online" ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                      <span className="truncate">{p.user_id === me ? "You" : p.user_id.slice(0, 8)}</span>
                      <span className="ml-auto text-muted-foreground">{p.status}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="activity" className="px-4 pb-4 text-xs text-muted-foreground">
                Last seen, read receipts and typing indicators stream in real time as your team becomes active.
              </TabsContent>
            </Tabs>
          )}
        </aside>
      </div>

      {/* New channel dialog */}
      <Dialog open={newChanOpen} onOpenChange={setNewChanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New channel</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") || "").trim();
            if (!name) return toast.error("Name required");
            createChannel.mutate({
              name, description: String(f.get("description") || ""),
              type: String(f.get("type") || "public") as "public" | "private" | "invite",
            });
          }} className="space-y-3">
            <div><Label>Name</Label><Input name="name" placeholder="marketing" required className="mt-1.5" /></div>
            <div><Label>Description</Label><Input name="description" placeholder="What's this channel about?" className="mt-1.5" /></div>
            <div>
              <Label>Visibility</Label>
              <Select name="type" defaultValue="public">
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — anyone can join</SelectItem>
                  <SelectItem value="private">Private — members only</SelectItem>
                  <SelectItem value="invite">Invite-only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewChanOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createChannel.isPending}>{createChannel.isPending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI Assistant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Action</Label>
              <Select value={aiAction} onValueChange={(v) => setAiAction(v as typeof aiAction)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summarize">Summarize conversation</SelectItem>
                  <SelectItem value="campaign_ideas">Generate campaign ideas</SelectItem>
                  <SelectItem value="captions">Generate captions</SelectItem>
                  <SelectItem value="client_reply">Draft client reply</SelectItem>
                  <SelectItem value="tasks">Extract action items</SelectItem>
                  <SelectItem value="meeting_notes">Create meeting notes</SelectItem>
                  <SelectItem value="calendar">Suggest content calendar entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runAi} disabled={aiBusy} className="w-full">
              {aiBusy ? <><Loader2 className="size-4 animate-spin" /> Thinking…</> : <><Sparkles className="size-4" /> Run</>}
            </Button>
            {aiResult && (
              <div className="space-y-2">
                <Textarea rows={10} value={aiResult} onChange={(e) => setAiResult(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(aiResult)}>Copy</Button>
                  <Button onClick={insertAiToChat}>Post to channel</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert message dialog */}
      <Dialog open={!!convertMsg} onOpenChange={(o) => !o && setConvertMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {convertAction === "task" && <><ListTodo className="size-4" /> Create Task</>}
              {convertAction === "meeting" && <><CalendarPlus className="size-4" /> Create Meeting</>}
              {convertAction === "calendar" && <><CalendarDays className="size-4" /> Add to Content Calendar</>}
              {convertAction === "client_note" && <><Building2 className="size-4" /> Save to Client</>}
              {convertAction === "ai_campaign" && <><Wand2 className="size-4" /> Generate AI Campaign</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Message</Label>
              <Textarea rows={3} value={convertMsg?.content ?? ""} readOnly className="mt-1.5 bg-muted/30" />
            </div>
            {(convertAction === "task" || convertAction === "meeting" || convertAction === "calendar" || convertAction === "client_note" || convertAction === "ai_campaign") && (
              <div>
                <Label>Client {convertAction === "client_note" ? "(required)" : "(optional)"}</Label>
                <Select value={convertClientId || "none"} onValueChange={(v) => setConvertClientId(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {convertAction === "meeting" && (
              <div>
                <Label>Date</Label>
                <Input type="date" value={convertDate} onChange={(e) => setConvertDate(e.target.value)} className="mt-1.5" />
              </div>
            )}
            {convertAction === "calendar" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={convertDate} onChange={(e) => setConvertDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={convertPlatform} onValueChange={setConvertPlatform}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube", "blog"].map((p) =>
                        <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {convertAction === "ai_campaign" && (
              <p className="text-xs text-muted-foreground">AI will generate campaign ideas from this message and save them as a new campaign draft.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertMsg(null)}>Cancel</Button>
            <Button onClick={runConvert} disabled={convertBusy}>
              {convertBusy ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
