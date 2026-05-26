import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateAgenda, processMeetingNotes } from "@/lib/meetings-ai.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Users, Video, MapPin, Sparkles, Loader2, Trash2, FileText, Paperclip, CheckSquare, Mail, ListTodo, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings")({
  component: MeetingsPage,
});

type Meeting = {
  id: string;
  title: string;
  meeting_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  video_link: string | null;
  agenda: string | null;
  goal: string | null;
  notes: string | null;
  status: string;
  client_id: string | null;
  campaign_id: string | null;
};

type AgendaItem = { id: string; topic: string; owner: string; time_estimate: number; priority: string; notes: string };
type ActionItem = { id: string; description: string; assigned_to: string; due_date: string | null; status: string };
type Attendee = { id: string; name: string; email: string; role: string };
type Attachment = { id: string; file_name: string; file_url: string; file_type: string };

const STATUSES = ["scheduled", "live", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  live: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 animate-pulse",
  completed: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
};

function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Meeting | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: m }, { data: c }, { data: cp }] = await Promise.all([
      supabase.from("meetings").select("*").order("meeting_date", { ascending: false }),
      supabase.from("clients").select("id,business_name"),
      supabase.from("campaigns").select("id,name"),
    ]);
    setMeetings((m as Meeting[]) || []);
    setClients((c as { id: string; business_name: string }[]) || []);
    setCampaigns((cp as { id: string; name: string }[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = meetings.filter((m) => m.meeting_date > today && m.status !== "cancelled");
  const todays = meetings.filter((m) => m.meeting_date === today);
  const past = meetings.filter((m) => m.meeting_date < today);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team Meetings</h1>
          <p className="text-sm text-muted-foreground">Schedule, run, and follow up on team meetings.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="size-4 mr-1" /> New meeting</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today" value={todays.length} icon={<Calendar className="size-4" />} />
        <StatCard label="Upcoming" value={upcoming.length} icon={<Clock className="size-4" />} />
        <StatCard label="Completed" value={meetings.filter(m=>m.status==="completed").length} icon={<CheckSquare className="size-4" />} />
        <StatCard label="Total" value={meetings.length} icon={<Users className="size-4" />} />
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today ({todays.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="today"><MeetingList list={todays} loading={loading} onOpen={setSelected} /></TabsContent>
        <TabsContent value="upcoming"><MeetingList list={upcoming} loading={loading} onOpen={setSelected} /></TabsContent>
        <TabsContent value="past"><MeetingList list={past} loading={loading} onOpen={setSelected} /></TabsContent>
      </Tabs>

      <CreateMeetingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        campaigns={campaigns}
        onCreated={loadAll}
      />

      {selected && (
        <MeetingDetailDialog
          meeting={selected}
          onClose={() => setSelected(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

function MeetingList({ list, loading, onOpen }: { list: Meeting[]; loading: boolean; onOpen: (m: Meeting) => void }) {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (list.length === 0) return <div className="text-center py-10 text-sm text-muted-foreground">No meetings here.</div>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((m) => (
        <Card key={m.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onOpen(m)}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium">{m.title}</div>
              <Badge variant="outline" className={STATUS_COLORS[m.status] || ""}>{m.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="size-3" />{m.meeting_date}</span>
              {m.start_time && <span className="flex items-center gap-1"><Clock className="size-3" />{m.start_time.slice(0,5)}{m.end_time ? `–${m.end_time.slice(0,5)}` : ""}</span>}
              {m.video_link ? <span className="flex items-center gap-1"><Video className="size-3" />Video</span> : m.location ? <span className="flex items-center gap-1"><MapPin className="size-3" />{m.location}</span> : null}
            </div>
            {m.goal && <p className="text-xs line-clamp-2">{m.goal}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreateMeetingDialog({ open, onOpenChange, clients, campaigns, onCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: { id: string; business_name: string }[];
  campaigns: { id: string; name: string }[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "", client_id: "", campaign_id: "", meeting_date: new Date().toISOString().slice(0,10),
    start_time: "10:00", end_time: "11:00", location: "", video_link: "", agenda: "", goal: "", notes: "",
  });
  const [members, setMembers] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ title:"", client_id:"", campaign_id:"", meeting_date:new Date().toISOString().slice(0,10), start_time:"10:00", end_time:"11:00", location:"", video_link:"", agenda:"", goal:"", notes:"" });

  const submit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase.from("meetings").insert({
      user_id: user.id,
      title: form.title.trim(),
      client_id: form.client_id || null,
      campaign_id: form.campaign_id || null,
      meeting_date: form.meeting_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location || null,
      video_link: form.video_link || null,
      agenda: form.agenda,
      goal: form.goal,
      notes: form.notes,
      status: "scheduled",
    }).select().single();
    if (error || !data) { toast.error(error?.message || "Failed"); setSaving(false); return; }

    const names = members.split(",").map(s=>s.trim()).filter(Boolean);
    if (names.length) {
      await supabase.from("meeting_attendees").insert(names.map((n) => ({
        meeting_id: data.id, user_id: user.id, name: n, role: "team",
      })));
    }
    toast.success("Meeting created");
    setSaving(false);
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New meeting</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Title"><Input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} placeholder="Weekly sync" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <Select value={form.client_id} onValueChange={(v)=>setForm({...form, client_id:v==="__none"?"":v})}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {clients.map(c=> <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Campaign">
              <Select value={form.campaign_id} onValueChange={(v)=>setForm({...form, campaign_id:v==="__none"?"":v})}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {campaigns.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Team members (comma-separated)">
            <Input value={members} onChange={(e)=>setMembers(e.target.value)} placeholder="Alex, Sam, Jordan" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date"><Input type="date" value={form.meeting_date} onChange={(e)=>setForm({...form, meeting_date:e.target.value})} /></Field>
            <Field label="Start"><Input type="time" value={form.start_time} onChange={(e)=>setForm({...form, start_time:e.target.value})} /></Field>
            <Field label="End"><Input type="time" value={form.end_time} onChange={(e)=>setForm({...form, end_time:e.target.value})} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location"><Input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} placeholder="Office / room" /></Field>
            <Field label="Video link"><Input value={form.video_link} onChange={(e)=>setForm({...form, video_link:e.target.value})} placeholder="https://..." /></Field>
          </div>
          <Field label="Goal"><Input value={form.goal} onChange={(e)=>setForm({...form, goal:e.target.value})} placeholder="What success looks like" /></Field>
          <Field label="Agenda summary"><Textarea rows={3} value={form.agenda} onChange={(e)=>setForm({...form, agenda:e.target.value})} /></Field>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function MeetingDetailDialog({ meeting, onClose, onChanged }: { meeting: Meeting; onClose: () => void; onChanged: () => void }) {
  const [tab, setTab] = useState("overview");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState({ discussion: "", decisions: "", notes: "" });
  const [notesId, setNotesId] = useState<string | null>(null);
  const [status, setStatus] = useState(meeting.status);
  const [aiOutput, setAiOutput] = useState("");
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  const genAgenda = useServerFn(generateAgenda);
  const procNotes = useServerFn(processMeetingNotes);

  const load = async () => {
    const [{ data: ag }, { data: ai }, { data: at }, { data: af }, { data: nt }] = await Promise.all([
      supabase.from("meeting_agenda_items").select("*").eq("meeting_id", meeting.id).order("sort_order"),
      supabase.from("meeting_action_items").select("*").eq("meeting_id", meeting.id).order("created_at"),
      supabase.from("meeting_attendees").select("*").eq("meeting_id", meeting.id),
      supabase.from("meeting_attachments").select("*").eq("meeting_id", meeting.id),
      supabase.from("meeting_notes").select("*").eq("meeting_id", meeting.id).maybeSingle(),
    ]);
    setAgendaItems((ag as AgendaItem[]) || []);
    setActionItems((ai as ActionItem[]) || []);
    setAttendees((at as Attendee[]) || []);
    setAttachments((af as Attachment[]) || []);
    if (nt) { setNotes({ discussion: nt.discussion || "", decisions: nt.decisions || "", notes: nt.notes || "" }); setNotesId(nt.id); }
  };

  useEffect(() => { load(); }, [meeting.id]);

  const updateStatus = async (s: string) => {
    setStatus(s);
    await supabase.from("meetings").update({ status: s }).eq("id", meeting.id);
    onChanged();
  };

  const addAgendaItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("meeting_agenda_items").insert({
      meeting_id: meeting.id, user_id: user.id, topic: "New topic", priority: "medium", time_estimate: 10, sort_order: agendaItems.length,
    }).select().single();
    if (data) setAgendaItems([...agendaItems, data as AgendaItem]);
  };

  const updateAgendaItem = async (id: string, patch: Partial<AgendaItem>) => {
    setAgendaItems(agendaItems.map(i => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("meeting_agenda_items").update(patch).eq("id", id);
  };

  const deleteAgendaItem = async (id: string) => {
    setAgendaItems(agendaItems.filter(i => i.id !== id));
    await supabase.from("meeting_agenda_items").delete().eq("id", id);
  };

  const saveNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (notesId) {
      await supabase.from("meeting_notes").update(notes).eq("id", notesId);
    } else {
      const { data } = await supabase.from("meeting_notes").insert({ ...notes, meeting_id: meeting.id, user_id: user.id }).select().single();
      if (data) setNotesId(data.id);
    }
    toast.success("Notes saved");
  };

  const addActionItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("meeting_action_items").insert({
      meeting_id: meeting.id, user_id: user.id, description: "New action item", status: "open",
    }).select().single();
    if (data) setActionItems([...actionItems, data as ActionItem]);
  };

  const updateActionItem = async (id: string, patch: Partial<ActionItem>) => {
    setActionItems(actionItems.map(a => a.id === id ? { ...a, ...patch } : a));
    await supabase.from("meeting_action_items").update(patch).eq("id", id);
  };

  const deleteActionItem = async (id: string) => {
    setActionItems(actionItems.filter(a => a.id !== id));
    await supabase.from("meeting_action_items").delete().eq("id", id);
  };

  const uploadFile = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/${meeting.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("meeting-files").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { data: url } = await supabase.storage.from("meeting-files").createSignedUrl(path, 60 * 60 * 24 * 7);
    const { data } = await supabase.from("meeting_attachments").insert({
      meeting_id: meeting.id, user_id: user.id, file_name: file.name, file_url: url?.signedUrl || "", file_type: file.type, storage_path: path,
    }).select().single();
    if (data) setAttachments([...attachments, data as Attachment]);
    toast.success("File uploaded");
  };

  const deleteAttachment = async (a: Attachment) => {
    setAttachments(attachments.filter(x => x.id !== a.id));
    await supabase.from("meeting_attachments").delete().eq("id", a.id);
  };

  const aiGenAgenda = async () => {
    setAiBusy("agenda");
    try {
      const { items } = await genAgenda({ data: { title: meeting.title, goal: meeting.goal || "", context: meeting.agenda || "" } });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = items.map((it, idx) => ({
        meeting_id: meeting.id, user_id: user.id, topic: it.topic, owner: it.owner, time_estimate: it.time_estimate, priority: it.priority, notes: it.notes, sort_order: agendaItems.length + idx,
      }));
      const { data } = await supabase.from("meeting_agenda_items").insert(rows).select();
      if (data) setAgendaItems([...agendaItems, ...(data as AgendaItem[])]);
      toast.success("Agenda generated");
    } catch (e) { toast.error((e as Error).message); } finally { setAiBusy(null); }
  };

  const aiProcess = async (kind: "summary" | "action_items" | "followup_email" | "task_list") => {
    const allNotes = [notes.discussion, notes.decisions, notes.notes].filter(Boolean).join("\n\n");
    if (allNotes.length < 5) { toast.error("Add some notes first"); return; }
    setAiBusy(kind);
    try {
      const { text } = await procNotes({ data: { notes: allNotes, kind, title: meeting.title } });
      if (kind === "action_items") {
        try {
          const parsed = JSON.parse(text);
          const items = (parsed.items || []) as Array<{ description: string; assigned_to?: string; due_date?: string }>;
          const { data: { user } } = await supabase.auth.getUser();
          if (user && items.length) {
            const rows = items.map(i => ({
              meeting_id: meeting.id, user_id: user.id, description: i.description, assigned_to: i.assigned_to || "", due_date: i.due_date || null, status: "open",
            }));
            const { data } = await supabase.from("meeting_action_items").insert(rows).select();
            if (data) setActionItems([...actionItems, ...(data as ActionItem[])]);
          }
          setAiOutput(`Added ${items.length} action item(s).`);
        } catch { setAiOutput(text); }
      } else {
        setAiOutput(text);
      }
    } catch (e) { toast.error((e as Error).message); } finally { setAiBusy(null); }
  };

  return (
    <Dialog open onOpenChange={(v)=>!v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <DialogTitle>{meeting.title}</DialogTitle>
            <Select value={status} onValueChange={updateStatus}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="size-3" />{meeting.meeting_date}</span>
            {meeting.start_time && <span className="flex items-center gap-1"><Clock className="size-3" />{meeting.start_time.slice(0,5)}{meeting.end_time ? `–${meeting.end_time.slice(0,5)}` : ""}</span>}
            {meeting.video_link && <a href={meeting.video_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary"><Video className="size-3" />Join</a>}
            {meeting.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{meeting.location}</span>}
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agenda">Agenda ({agendaItems.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="actions">Actions ({actionItems.length})</TabsTrigger>
            <TabsTrigger value="files">Files ({attachments.length})</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="size-3 mr-1" />AI</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-3">
            <DetailRow label="Goal" value={meeting.goal} />
            <DetailRow label="Agenda" value={meeting.agenda} />
            <DetailRow label="Notes" value={meeting.notes} />
            <div>
              <Label className="text-xs">Attendees</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {attendees.length === 0 ? <span className="text-xs text-muted-foreground">No attendees</span>
                  : attendees.map(a => <Badge key={a.id} variant="secondary"><Users className="size-3 mr-1" />{a.name}</Badge>)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="space-y-3 pt-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={addAgendaItem}><Plus className="size-3 mr-1" />Add item</Button>
              <Button size="sm" variant="outline" onClick={aiGenAgenda} disabled={aiBusy==="agenda"}>
                {aiBusy==="agenda" ? <Loader2 className="size-3 animate-spin mr-1" /> : <Sparkles className="size-3 mr-1" />}AI generate
              </Button>
            </div>
            {agendaItems.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No agenda items yet.</div>}
            {agendaItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Input value={item.topic} onChange={e=>updateAgendaItem(item.id,{topic:e.target.value})} className="font-medium" />
                    <Button variant="ghost" size="icon" onClick={()=>deleteAgendaItem(item.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Owner" value={item.owner} onChange={e=>updateAgendaItem(item.id,{owner:e.target.value})} />
                    <Input type="number" placeholder="Minutes" value={item.time_estimate} onChange={e=>updateAgendaItem(item.id,{time_estimate:Number(e.target.value)})} />
                    <Select value={item.priority} onValueChange={(v)=>updateAgendaItem(item.id,{priority:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea rows={2} placeholder="Notes" value={item.notes} onChange={e=>updateAgendaItem(item.id,{notes:e.target.value})} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 pt-3">
            <Field label="Discussion notes"><Textarea rows={5} value={notes.discussion} onChange={e=>setNotes({...notes, discussion:e.target.value})} /></Field>
            <Field label="Decisions made"><Textarea rows={3} value={notes.decisions} onChange={e=>setNotes({...notes, decisions:e.target.value})} /></Field>
            <Field label="Other notes"><Textarea rows={3} value={notes.notes} onChange={e=>setNotes({...notes, notes:e.target.value})} /></Field>
            <Button onClick={saveNotes}><FileText className="size-4 mr-1" />Save notes</Button>
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 pt-3">
            <Button size="sm" onClick={addActionItem}><Plus className="size-3 mr-1" />Add action item</Button>
            {actionItems.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No action items yet.</div>}
            {actionItems.map(a => (
              <Card key={a.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input value={a.description} onChange={e=>updateActionItem(a.id,{description:e.target.value})} />
                    <Button variant="ghost" size="icon" onClick={()=>deleteActionItem(a.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Assigned to" value={a.assigned_to} onChange={e=>updateActionItem(a.id,{assigned_to:e.target.value})} />
                    <Input type="date" value={a.due_date || ""} onChange={e=>updateActionItem(a.id,{due_date:e.target.value || null})} />
                    <Select value={a.status} onValueChange={(v)=>updateActionItem(a.id,{status:v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="files" className="space-y-3 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Button size="sm" asChild><span><Paperclip className="size-3 mr-1" />Upload file</span></Button>
              <input type="file" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadFile(f); e.target.value=""; }} />
            </label>
            {attachments.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No files yet.</div>}
            {attachments.map(a => (
              <Card key={a.id}><CardContent className="p-3 flex items-center justify-between gap-2">
                <a href={a.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:underline truncate">
                  <Paperclip className="size-4 text-muted-foreground shrink-0" />{a.file_name}
                </a>
                <Button variant="ghost" size="icon" onClick={()=>deleteAttachment(a)}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">Uses your saved notes (Discussion + Decisions + Other).</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={()=>aiProcess("summary")} disabled={!!aiBusy}>{aiBusy==="summary" ? <Loader2 className="size-3 animate-spin mr-1" /> : <FileText className="size-3 mr-1" />}Summarize</Button>
              <Button variant="outline" onClick={()=>aiProcess("action_items")} disabled={!!aiBusy}>{aiBusy==="action_items" ? <Loader2 className="size-3 animate-spin mr-1" /> : <CheckSquare className="size-3 mr-1" />}Extract actions</Button>
              <Button variant="outline" onClick={()=>aiProcess("followup_email")} disabled={!!aiBusy}>{aiBusy==="followup_email" ? <Loader2 className="size-3 animate-spin mr-1" /> : <Mail className="size-3 mr-1" />}Follow-up email</Button>
              <Button variant="outline" onClick={()=>aiProcess("task_list")} disabled={!!aiBusy}>{aiBusy==="task_list" ? <Loader2 className="size-3 animate-spin mr-1" /> : <ListTodo className="size-3 mr-1" />}Task list</Button>
            </div>
            {aiOutput && (
              <Card><CardContent className="p-3"><pre className="whitespace-pre-wrap text-xs">{aiOutput}</pre></CardContent></Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="destructive" onClick={async ()=>{ await supabase.from("meetings").delete().eq("id", meeting.id); toast.success("Deleted"); onClose(); onChanged(); }}>
            <Trash2 className="size-4 mr-1" />Delete meeting
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <p className="text-sm mt-1 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
