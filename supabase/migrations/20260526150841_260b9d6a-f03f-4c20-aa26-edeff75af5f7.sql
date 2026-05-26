-- Add meeting reference to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS meeting_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS campaign_id uuid;
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON public.tasks(meeting_id);

-- Trigger: auto-create a task when a meeting action item is inserted
CREATE OR REPLACE FUNCTION public.create_task_from_action_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  task_title text;
BEGIN
  SELECT id, title, client_id, campaign_id, user_id
    INTO m
    FROM public.meetings
   WHERE id = NEW.meeting_id;

  IF m.id IS NULL THEN
    RETURN NEW;
  END IF;

  task_title := COALESCE(NULLIF(NEW.description, ''), 'Action item from ' || COALESCE(m.title, 'meeting'));

  INSERT INTO public.tasks (
    user_id, client_id, campaign_id, meeting_id,
    title, notes, assigned_to, due_date, status, priority
  ) VALUES (
    NEW.user_id,
    m.client_id,
    m.campaign_id,
    m.id,
    task_title,
    'From meeting: ' || COALESCE(m.title, '') || ' (' || m.id::text || ')',
    NULLIF(NEW.assigned_to, ''),
    NEW.due_date,
    'todo'::task_status,
    'medium'::task_priority
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_action_item_to_task ON public.meeting_action_items;
CREATE TRIGGER trg_action_item_to_task
AFTER INSERT ON public.meeting_action_items
FOR EACH ROW
EXECUTE FUNCTION public.create_task_from_action_item();