# Smart Onboarding System

A large, multi-area feature. Below is a focused, shippable plan that delivers the full intent in clear phases.

## 1. Data model (one migration)

New table `marketing_profiles` (1 row per user, optionally per client):
- business: `business_name`, `website_url`, `industry`, `location`, `services`, `target_audience`, `main_goal`, `budget_range`
- brand: `brand_tone`, `brand_colors` (jsonb), `logo_url`, `media_urls` (jsonb), `competitors`, `usps`, `offers`
- marketing: `platforms` (text[]), `posting_frequency`, `content_types` (text[]), `approval_required` (bool), `creation_mode` ('ai'|'human'|'ai_human')
- seo_ppc: `target_keywords` (text[]), `seo_competitors`, `target_locations` (text[]), `ppc_budget`, `lead_type`, `landing_page_url`, `conversion_goal`
- team: `client_portal_enabled`, `human_consultation_requested`
- meta: `onboarding_completed` (bool), `onboarding_step` (int), `is_demo` (bool), `demo_template` (text), `client_id` (nullable fk)

New table `workspace_mode` (1 row per user): `mode` enum `real`|`demo`, `demo_template`, `created_at`. Drives the global demo banner + safety guards.

RLS: own-row only. GRANTs to authenticated + service_role.

## 2. Server functions (`src/lib/onboarding.functions.ts`)

- `getMarketingProfile()` → current profile (or null)
- `saveMarketingProfile(partial)` → upsert by user_id
- `completeOnboarding()` → marks done, creates a `clients` row from profile, links it
- `getWorkspaceMode()` / `setWorkspaceMode({mode, template})`
- `seedDemoWorkspace({template})` → inserts fake client, campaign folder, calendar entries, posts, SEO/PPC campaign, meeting, chat msgs, report placeholder, chatbot convo — all tagged `is_demo=true` where the column exists, otherwise prefixed with "[DEMO]"
- `convertDemoToReal({keepDemoAsExamples})` → flips mode, optionally purges `[DEMO]` rows

## 3. UI routes

- `src/routes/_authenticated/onboarding.tsx` — entry chooser ("Create My Real Workspace" / "Try Demo Workspace") + multi-step wizard (Business → Brand → Marketing → SEO/PPC → Team) with progress bar, "Save & continue later", "Skip optional".
- `src/routes/_authenticated/demo-templates.tsx` — pick a sample business (Roofing, Real Estate, Restaurant, Fitness, Contractor, Agency) → calls `seedDemoWorkspace`.
- Auto-redirect in `_authenticated.tsx`: if `onboarding_completed=false` and not on `/onboarding`, push to `/onboarding`.

## 4. Demo banner + safety

- `<DemoBanner />` mounted in `_authenticated.tsx` layout; visible only when `workspace_mode.mode='demo'`. Copy: "You are in Demo Mode. Data is fake. Publishing, payments, and external integrations are disabled."
- Add helper `useIsDemoMode()` and guard server fns that publish/pay/email/connect: short-circuit with a friendly toast error when in demo.
- "Convert to Real Workspace" button in banner → opens conversion dialog.

## 5. Smart profile reuse (replace repeated forms)

Build a shared `<ProfileAutofillCard />` that shows "Using saved profile · Edit details · Add campaign-specific only" and seeds form state from `getMarketingProfile()`. Wire into:
- AI Writer, AI Strategy Consultant, SEO/PPC Consultant, AI Image Studio, AI Video Studio, Campaign Wizard, Content Calendar auto-campaign, Social Scheduler.

Each tool keeps only feature-specific fields (e.g. Image Studio asks just "What image?" + "Which campaign?"; SEO asks only "Any new keywords / campaign-specific budget?").

## 6. Sidebar / nav

Add nav entries: "Onboarding" and "Demo Templates" under a new "Setup" group. Add "Edit Marketing Profile" in Settings.

## Technical notes

- New `marketing_profiles` rows are auto-fed into `clients` on completion so existing campaign/folder flows keep working unchanged.
- Demo-seeded rows reuse existing tables (no schema fork) — tagged via name prefix `[DEMO]` + new `is_demo bool default false` column added to: `clients`, `campaigns`, `campaign_folders`, `content_posts`, `social_posts`. (Trigger copies `is_demo` from campaign → folder so cascade tagging works.)
- Demo guards live in client + server: client hides destructive buttons, server fns throw if `workspace_mode='demo'` for `publishSocialPost`, payment intents, email sends, and OAuth connect handlers.
- All wizard steps are independent — `saveMarketingProfile` is called on every "Next" so users can resume.

## Out of scope for this turn (logged for follow-up)

- Per-step animations / polish pass
- Multi-client profiles (this turn does 1 profile per user, scoped per `client_id` ready for later)
- Backfill UI to retrofit pre-existing accounts into the wizard

## Files to touch

- migration: `marketing_profiles`, `workspace_mode`, `is_demo` columns + grants/RLS
- `src/lib/onboarding.functions.ts` (new)
- `src/routes/_authenticated/onboarding.tsx` (new)
- `src/routes/_authenticated/demo-templates.tsx` (new)
- `src/components/DemoBanner.tsx` (new)
- `src/components/ProfileAutofillCard.tsx` (new)
- `src/routes/_authenticated.tsx` (banner mount + nav + redirect)
- Light wiring in AI Writer / Image / Video / SEO-PPC / Campaign Wizard to consume profile
