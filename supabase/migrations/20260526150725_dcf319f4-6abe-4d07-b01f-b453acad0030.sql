-- Add missing columns to meeting tables to match requested schema
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.meeting_attendees ADD COLUMN IF NOT EXISTS attendance_status text NOT NULL DEFAULT 'invited';
ALTER TABLE public.meeting_agenda_items ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.meeting_action_items ADD COLUMN IF NOT EXISTS task_title text NOT NULL DEFAULT '';
ALTER TABLE public.meeting_action_items ADD COLUMN IF NOT EXISTS task_description text DEFAULT '';
ALTER TABLE public.meeting_attachments ADD COLUMN IF NOT EXISTS uploaded_by uuid;

-- Backfill uploaded_by from user_id where missing
UPDATE public.meeting_attachments SET uploaded_by = user_id WHERE uploaded_by IS NULL;

-- Ensure grants (RLS + policies already exist from prior migration, scoped to auth.uid() = user_id)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_agenda_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_action_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attachments TO authenticated;
GRANT ALL ON public.meetings, public.meeting_attendees, public.meeting_agenda_items, public.meeting_notes, public.meeting_action_items, public.meeting_attachments TO service_role;

-- Extend visibility: meeting owners AND invited attendees (matched by user_id) can view the meeting and its children
CREATE OR REPLACE FUNCTION public.can_access_meeting(_meeting_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meetings m WHERE m.id = _meeting_id AND m.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.meeting_attendees a WHERE a.meeting_id = _meeting_id AND a.user_id = _user_id
  );
$$;

-- Add invitee SELECT policies (owner policies remain unchanged)
DROP POLICY IF EXISTS "invitees can view meeting" ON public.meetings;
CREATE POLICY "invitees can view meeting" ON public.meetings
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(id, auth.uid()));

DROP POLICY IF EXISTS "invitees view agenda" ON public.meeting_agenda_items;
CREATE POLICY "invitees view agenda" ON public.meeting_agenda_items
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "invitees view notes" ON public.meeting_notes;
CREATE POLICY "invitees view notes" ON public.meeting_notes
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "invitees view action items" ON public.meeting_action_items;
CREATE POLICY "invitees view action items" ON public.meeting_action_items
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "invitees view attachments" ON public.meeting_attachments;
CREATE POLICY "invitees view attachments" ON public.meeting_attachments
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(meeting_id, auth.uid()));

DROP POLICY IF EXISTS "invitees view attendees" ON public.meeting_attendees;
CREATE POLICY "invitees view attendees" ON public.meeting_attendees
  FOR SELECT TO authenticated
  USING (public.can_access_meeting(meeting_id, auth.uid()));