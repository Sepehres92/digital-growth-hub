
# Security, Privacy & Legal Hardening — Phased Plan

Your request covers ~15 distinct security/compliance domains. Shipping all of them in one pass would mean shallow implementations of each (which is worse than none). I'm proposing 3 phases. **Phase 1 covers everything that's high-impact + achievable now on this stack.** Phases 2–3 are optional follow-ups.

Some items in your list are **already done** or **not applicable** — flagged below.

---

## Already in place ✅

- **Password hashing, email verification, password reset, session management** — handled by Lovable Cloud Auth.
- **RLS on every user-data table** — verified: `clients`, `campaigns`, `tasks`, `leads`, `ai_copies`, `ai_images`, `generated_images`, `client_images`, `creative_projects`, `profiles` all have owner-scoped policies.
- **API keys server-side only** — `LOVABLE_API_KEY` lives in server env, called from `createServerFn` only.
- **HTTPS, secure cookies, SQL-injection protection** — provided by Lovable Cloud + Supabase client (parameterized queries).
- **Content policy banner** on AI Studio (added earlier).
- **Private storage bucket** `client-uploads` (owner-only folder policies).

## Not applicable on this stack ❌

- **CSRF tokens** — not needed; serverFn uses bearer-token auth, not cookies.
- **"Scan uploads for malicious files"** — requires an AV service (ClamAV/VirusTotal). Out of scope unless you want me to wire a third-party API.
- **"Encrypt sensitive fields"** at the column level — Postgres already encrypts at rest; column-level encryption (pgsodium) is overkill for the data you currently store (no SSNs/payment info).
- **Backup/recovery system** — managed automatically by Lovable Cloud.

---

## Phase 1 — Ship now (recommended)

**Goal:** close real gaps, add legal pages, add audit logging foundation.

### A. Database & RLS
1. Create `user_roles` table + `app_role` enum (`admin`, `member`) + `has_role()` SECURITY DEFINER function — required for any admin features and prevents privilege escalation (per Lovable security rules).
2. Create `audit_logs` table (user_id, action, resource_type, resource_id, metadata jsonb, ip, created_at) with RLS: users see own logs, admins see all.
3. Add file-size + MIME-type CHECK constraints on `client_images` (max 10 MB, image/* only).
4. Tighten `blog_posts` policy — currently `anon` can INSERT; restrict to authenticated.

### B. Server functions — validation & rate limiting
5. Add Zod input validation to every existing `createServerFn` that doesn't have it (`ai-writer`, `ai-studio`, `generate-ai-image`).
6. Add a simple in-DB rate limiter table (`rate_limits`: user_id, action, window_start, count) + helper called from AI server fns (e.g. 30 AI generations / hour).
7. Log every AI generation and file upload to `audit_logs`.

### C. File upload hardening
8. Client-side: validate MIME type + size before upload; reject anything that isn't `image/png|jpeg|webp` ≤ 10 MB.
9. Server-side: re-validate MIME from the storage object metadata after upload.

### D. Legal & privacy pages (public routes)
10. `/privacy` — Privacy Policy (GDPR/PIPEDA/CCPA-aligned template, customized to this app).
11. `/terms` — Terms of Service incl. AI-content disclaimers (user owns inputs, must have rights, must review AI output, no liability for misuse, no medical/legal/financial advice).
12. `/cookies` — Cookie Policy (this app uses only essential auth cookies).
13. Footer links to all three on every page.
14. Signup form: required consent checkbox ("I agree to Terms & Privacy Policy").

### E. Account self-service (GDPR / PIPEDA right-to-erasure & portability)
15. **Settings → Privacy** page with:
    - **Export my data** button → server fn returns JSON of all user rows across tables.
    - **Delete my account** button → server fn deletes all user rows + auth user (confirmation modal).

### F. Frontend protection
16. Audit codebase for `dangerouslySetInnerHTML` — sanitize with DOMPurify if any user content is rendered as HTML.
17. Add Zod schemas to all user-facing forms that don't have them (length limits, format checks).

---

## Phase 2 — Follow-up (ask separately)

- Admin role UI + admin-only routes (requires Phase 1 §A.1).
- Security Dashboard page (recent logins, active sessions, audit log viewer, AI generation history).
- Team invites + multi-role permissions (significant feature work — really a separate product area).
- AI prompt moderation (call a moderation model before generation; logs flagged prompts).
- Brute-force lockout (track failed logins, lock after N attempts).
- MFA (TOTP) — requires Supabase MFA enrollment UI.
- Email notifications to admins for suspicious activity.

## Phase 3 — Ops / infra

- Custom security headers (CSP, X-Frame-Options) via TanStack response middleware.
- Error monitoring (Sentry integration).
- Cookie consent banner (only meaningful if you add analytics/marketing cookies — currently not needed).

---

## What I need from you

**Reply with one of:**

1. **"Ship Phase 1"** — I'll implement A–F above. Estimated: 1 migration + ~6 new files + edits to ~8 existing files. Will deliver as a single coherent change.
2. **"Ship Phase 1 + specific Phase 2 items: [list]"** — pick the Phase 2 items you want included.
3. **"Different scope"** — tell me what to prioritize / drop.

I'd strongly recommend option 1. Trying to do all 15 sections at once on a single turn would produce surface-level work and likely break things.
