-- Regression checks for RLS on blog_posts, meeting_notes and social_account_tokens.
-- Run with: psql "$SUPABASE_DB_URL" -f supabase/tests/security_regression.sql
\set ON_ERROR_STOP on

BEGIN;

-- Test fixtures (rolled back at the end).
CREATE TEMP TABLE ids(k text primary key, v uuid);
INSERT INTO ids VALUES
  ('author', gen_random_uuid()),
  ('other',  gen_random_uuid());

SET LOCAL row_security = on;

-- ---------- blog_posts ----------
INSERT INTO public.blog_posts (user_id, title, content, author_name, published, published_at)
SELECT v, 'Published post', '<p>ok</p>', 'A', true, now() - interval '1 day' FROM ids WHERE k='author';
INSERT INTO public.blog_posts (user_id, title, content, author_name, published, published_at)
SELECT v, 'Draft post', '<p>draft</p>', 'A', false, now() FROM ids WHERE k='author';
INSERT INTO public.blog_posts (user_id, title, content, author_name, published, published_at)
SELECT v, 'Future post', '<p>later</p>', 'A', true, now() + interval '5 days' FROM ids WHERE k='author';

-- anonymous reader: only the published, already-dated post
SET LOCAL role anon;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.blog_posts WHERE title IN ('Draft post','Future post');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon can read % unpublished/future posts', n; END IF;
  SELECT count(*) INTO n FROM public.blog_posts WHERE title = 'Published post';
  IF n < 1 THEN RAISE EXCEPTION 'FAIL: anon cannot read published post'; END IF;
END $$;
RESET role;

-- signed-in non-author: same visibility as anonymous
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.blog_posts WHERE title IN ('Draft post','Future post');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: other user can read drafts'; END IF;
END $$;
RESET role;

-- ---------- social_account_tokens ----------
SET LOCAL role anon;
DO $$ DECLARE n int; BEGIN
  BEGIN
    SELECT count(*) INTO n FROM public.social_account_tokens;
    RAISE EXCEPTION 'FAIL: anon can query social_account_tokens';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET role;

SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}';
DO $$ DECLARE n int; BEGIN
  BEGIN
    SELECT count(*) INTO n FROM public.social_account_tokens;
    RAISE EXCEPTION 'FAIL: authenticated can query social_account_tokens';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET role;

-- service role can still use tokens
SET LOCAL role service_role;
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.social_account_tokens;
END $$;
RESET role;

-- ---------- meeting_notes ----------
DO $$
DECLARE owner_id uuid; invitee_id uuid; m_id uuid; n int;
BEGIN
  SELECT v INTO owner_id FROM ids WHERE k='author';
  SELECT v INTO invitee_id FROM ids WHERE k='other';
  INSERT INTO public.meetings (user_id, title) VALUES (owner_id, 'Regression meeting') RETURNING id INTO m_id;
  INSERT INTO public.meeting_attendees (meeting_id, user_id, name) VALUES (m_id, invitee_id, 'Invitee');
  INSERT INTO public.meeting_notes (meeting_id, user_id, content) VALUES (m_id, owner_id, 'secret notes');

  -- invitee can read via can_access_meeting
  IF NOT public.can_access_meeting(m_id, invitee_id) THEN
    RAISE EXCEPTION 'FAIL: invitee not recognised for meeting access';
  END IF;
  -- unrelated user cannot
  IF public.can_access_meeting(m_id, '00000000-0000-0000-0000-0000000000ff') THEN
    RAISE EXCEPTION 'FAIL: unrelated user has meeting access';
  END IF;
END $$;

SELECT 'ALL SECURITY REGRESSION CHECKS PASSED' AS result;

ROLLBACK;
