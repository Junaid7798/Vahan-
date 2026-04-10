# HANDOFF

## Current Snapshot

Use this section as the source of truth. Older notes below are retained for history and may be stale.

### Goal

Continue the private used-vehicle portal as a mobile-first bilingual app with Supabase-backed production flows, blurred user-facing vehicle media, and a future-safe path to PWA or thin-wrapper packaging.

### Current Progress

- Auth JSON failure handling is fixed. `/api/auth/*` now falls back to JSON errors, and auth forms no longer crash on unexpected non-JSON bodies.
- Supabase is the primary read and write path in code when configured for:
  - inventory
  - requests
  - chat
  - profile
  - settings
  - seller submissions
- Vehicle media now uses paired original and blurred variants:
  - staff reads original media
  - approved user-facing inventory and detail reads blurred media
- Seller submissions are now migrated in code to the Supabase path:
  - create, edit, delete, status update, and listing conversion all go through `seller_submissions`
  - submission media is stored under submission-owned paths
  - submission-to-listing conversion clones media into listing-owned uploads instead of path-sharing
- The offline queue is now wired for the main user portal create flows:
  - `create_inquiry`
  - `create_reservation`
  - `create_resale`
  - `send_chat_message`
  - queued actions replay through `/api/portal` in Supabase mode and `/api/demo/portal` in demo mode
- The PWA readiness checklist now exists in `docs/PWA_READINESS.md`.
- Lower-priority localization cleanup was partially advanced on the seller-submissions and my-requests routes.

### What Worked

- Keeping demo fallback at the portal client and route layer still makes local work safe while letting Supabase stay primary when configured.
- Treating blurred listing media and submission media as different ownership domains avoided destructive cross-flow deletes.
- Queueing only the user-safe create flows kept offline behavior simple enough to ship without inventing unreliable staff moderation semantics.
- Using route-level `/api/portal` actions for replay avoided maintaining a separate offline-only transport layer.

### What Didn't Work

- Earlier docs became stale and started contradicting the implementation.
- Vitest startup can fail inside the sandbox with `spawn EPERM`; the same test commands passed when rerun with elevated permissions.
- The local worktree still has noise files that were intentionally not deleted in this session.

### Next Steps

1. Validate live Supabase flows with admin, manager, and user test accounts once the env vars and credentials are available in the local shell or another accessible validation environment.
2. Finish the lower-priority admin localization pass.
3. Add offline E2E coverage plus a visible queued-action history or retry surface.
4. Add a legacy-image blur backfill job if old inventory needs user-facing coverage without manual re-save.
5. Delete local noise files only if explicitly approved: `.server-5000.*` and `nul`.

### External Follow-up Required

- User reported that the real Supabase migrations have been applied, including `20260411_001_seller_submission_upgrade.sql`.
- Live Supabase validation is still blocked in this local shell because the Supabase env vars and admin, manager, and user test credentials are not available here.
- Packaged-shell validation for Android or iOS has not been run.
- Destructive cleanup of local noise files was intentionally not performed without explicit approval.

### Verification

- `npm test` passed: 14 files, 22 tests.
- `npm run typecheck` passed.
- Targeted `eslint` on the touched files passed.
- `npm run build` passed.

### Practical Restart Prompt

`Continue from HANDOFF.md current snapshot: validate live Supabase flows with admin, manager, and user accounts once env vars and credentials are available, then finish offline E2E coverage and the remaining admin localization cleanup without reopening the completed auth, plate-blur, seller-submission, or queue wiring work.`

## Archived Older Notes

## Goal

Continue the private used-vehicle portal with these active priorities:

- fully working user, manager, and admin workflows
- mobile-first UI because expected usage is 95%+ on phones
- bilingual English and Hindi coverage
- a premium but readable theme system across auth and app surfaces
- future-safe architecture for PWA and eventual Android or iOS packaging
- eventual replacement of demo persistence with Supabase-backed production data

## Current Progress

The app is implemented and deployable as a preview build. It now includes:

- locale-aware auth and app routing
- role-aware app shell and dashboards
- inventory, reserved, sold, detail, inquiries, chat, my requests, and profile routes
- staff routes for users, vehicles, seller submissions, reservation requests, waitlist, resale requests, chat, and settings
- demo-backed create, edit, and delete flows for listings and seller uploads
- topbar language, appearance, and notification controls
- shared theme-safe shell surfaces across the app layout and topbar controls
- mobile-first vehicle and seller-upload forms with sticky actions and grouped sections
- predictive search pickers for make, model, variant, location, city, and inventory make filters
- mobile-safe seller submission queue cards instead of the earlier table-heavy layout
- image compression before upload
- improved Hindi coverage on the highest-traffic routes
- an auth contrast fix so login, signup, and forgot-password stay readable under saved theme state
- passing `typecheck`, `lint`, `test`, and `build` verification in the current workspace

Important current limitation:

- the app is still largely demo-store backed and is not a safe public production system yet

## What Worked

- Using the product docs as the source of truth kept route and permission decisions stable
- Building a JSON-backed demo domain made it possible to validate the intended workflows quickly
- Treating mobile-first and predictive-input rules as product constraints clarified later UI decisions
- Using theme tokens and document-level theme state worked well for global shell controls
- Fixing contrast at shared auth-shell and shared-form level was better than patching one page
- A reusable searchable sheet picker built from existing UI primitives was enough to unlock the current long-list input needs without adding dependencies

## What Didn't Work

- Fixed light backgrounds mixed with theme-token text caused unreadable auth screens after deployment
- Piecemeal localization led to drift and made Hindi bugs harder to diagnose
- Treating theme issues as page-specific polish instead of system work created regressions
- The old `HANDOFF.md` became stale enough to mislead future sessions
- The Vitest setup referenced `@testing-library/jest-dom/vitest` even though that package is not installed in this repo

## Locked Decisions

- Inventory is private and visible only after login and approval
- Anyone can sign up, but access requires admin approval
- Roles remain `Admin`, `Manager`, and `User`
- Admin and manager can perform all staff-side operational edits
- Users can add, edit, and delete only their own pending or changes-requested uploads
- Once staff converts a user upload into live inventory, it becomes staff-controlled only
- Price and financial details stay hidden from normal users
- Sold listings remain visible as showcase inventory
- English and Hindi both remain required
- Theme changes must stay token-based and readable across mobile screens first
- Large option sets should move toward predictive inputs
- Small fixed enums should stay simple pickers
- Future mobile packaging should follow responsive web -> PWA -> wrapper before any native rewrite

## Important Product Rules

- `Available` listings:
  - inquiry allowed
  - reserve-interest allowed
  - user action creates a request, not a listing status change

- `Reserved` listings:
  - still visible
  - inquiry allowed
  - reserve-interest allowed
  - reserve-interest becomes a waitlist entry

- `Sold` listings:
  - still visible
  - inquiry allowed
  - resale request allowed

- Chat:
  - includes general support and vehicle-specific threads
  - supports text and demo-mode voice notes
  - users can access only their own chat threads
  - admin and manager can handle replies

## Technical Direction

- Next.js App Router
- TypeScript
- next-intl
- shadcn/ui primitives
- Vercel deployment
- current persistence in local JSON-backed demo stores
- future target is Supabase Auth, Postgres, and private Storage

## Next Steps

The next session should not reopen the completed mobile-first form and shell pass. The priority has narrowed to the remaining production and lower-priority audit work.

Execution order:

1. Finish the remaining lower-priority mobile and localization audit:
   - admin settings sub-surfaces
   - any remaining English-only helper text on staff routes
   - any long-list selector that still uses plain text input

2. Define the PWA readiness checklist for future APK and IPA packaging:
   - offline behavior
   - icon and splash readiness
   - deep-link expectations
   - notification approach

3. Start the production data track:
   - replace demo persistence with Supabase-backed flows
   - add signed private media delivery
   - implement the number-plate blur pipeline
   - wire the offline queue into active mutations

4. Keep these docs updated:
   - `SESSION.md`
   - `HANDOFF.md`
   - `docs/superpowers/plans/2026-04-09-mobile-first-inputs-and-app-roadmap.md`

## Known Gaps

- Some lower-priority pages still need localization cleanup
- Some admin surfaces still need the same mobile density audit that the main flows now have
- Demo persistence still needs to be replaced with production data flows
- Private media, signed URLs, and plate blur are still pending
- Automated end-to-end coverage is still missing
- The predictive option catalog is still local seed data rather than production reference data

## Practical Start Point

If continuing in a fresh session, the best opening instruction is:

`Continue from the remaining production track in HANDOFF.md: audit the remaining admin/mobile gaps, then start Supabase-backed persistence and private media delivery without reopening the completed mobile form and shell pass.`

## 2026-04-09 Latest Update

- Supabase is now the primary read and write path in code for the active portal when it is configured.
- Real route handlers exist for:
  - `/api/portal`
  - `/api/vehicles`
  - `/api/vehicles/[listingId]`
  - `/api/inquiries`
  - `/api/reservations`
  - `/api/resale`
  - `/api/chat/messages`
- Inventory reads, dashboard reads, requests, support queues, chat reads, profile reads, and shell notifications now go through the Supabase wrapper layer in `src/lib/portal/*`.
- Vehicle create, edit, and delete now target the real inventory routes when `NEXT_PUBLIC_SUPABASE_URL` is present.
- Private vehicle images and voice notes now resolve through signed URLs or private storage uploads on the server path.
- Existing Supabase auth users get a `user_profiles` row automatically on read if one is missing.
- `SUPABASE_ADMIN_EMAIL` can auto-promote the configured account to approved admin on first read.

What still must happen before this works against your real project:

- Apply migrations:
  - `20260408_001_initial_schema.sql`
  - `20260408_002_rls_policies.sql`
  - `20260408_003_storage_buckets.sql`
  - `20260408_004_seed_data.sql`
  - `20260408_005_security_and_chat_fixes.sql`
  - `20260409_001_portal_primary_extensions.sql`
- Ensure env vars exist locally:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ADMIN_EMAIL=Junaid557722@gmail.com`

Known remaining gaps after this pass:

- Seller submissions are still demo-backed, though converting a submission now creates a Supabase listing.
- Plate blur is still deferred.
- PWA readiness and APK or IPA packaging work have not started.
- `docs/APP_STRUCTURE.md` is still stale.
- Repo cleanup noise still exists: `.server-5000.*` and `nul`.

Verification status for the current workspace:

- `typecheck`: passed
- `lint`: passed
- `test`: passed
- `build`: passed

## 2026-04-10 Session Close Update

- GitHub push is complete:
  - branch: `master`
  - remote: `origin`
  - commit: `6ce8754`
  - message: `Complete Supabase portal migration and fixes`

- Local-only files intentionally not pushed:
  - `.server-5000.err.log`
  - `.server-5000.out.log`
  - `nul`

- New unresolved issue reported after the push:
  - Browser error: `Unexpected token '<', "<div class"... is not valid JSON`

- Most likely source area:
  - auth client forms still parse JSON directly:
    - `src/modules/auth/components/login-form.tsx`
    - `src/modules/auth/components/signup-form.tsx`
    - `src/modules/auth/components/forgot-password-form.tsx`
  - if `/api/auth/login`, `/api/auth/signup`, or `/api/auth/reset-password` returns an HTML error page, these forms will throw exactly that parse error before showing a useful message
  - `src/lib/demo/portal-client.ts` already guards failed JSON parsing, so it is less likely to be the source of the raw browser error string

- Best next debugging step:
  1. Reproduce the issue and check which request returns HTML in the browser Network tab
  2. Compare that request with local server logs
  3. If the failing request is under `/api/auth/*`, inspect `src/app/api/auth/[...path]/route.ts` and any route imports it depends on
  4. Harden the auth forms to avoid direct `response.json()` assumptions once the failing route is confirmed

## 2026-04-10 Follow-up Update

- The auth JSON parse issue is now fixed in code.
- What changed:
  - `src/app/api/auth/[...path]/route.ts` now catches unexpected auth-route failures and returns a JSON `500` payload instead of letting Next.js fall through to an HTML error page.
  - `src/modules/auth/lib/read-response-json.ts` was added and is now used by:
    - `src/modules/auth/components/login-form.tsx`
    - `src/modules/auth/components/signup-form.tsx`
    - `src/modules/auth/components/forgot-password-form.tsx`
  - Targeted regressions were added for both the route fallback and the response parser.
- What this means:
  - If demo signup persistence or another auth-route dependency throws, the client now receives a normal JSON error response.
  - If a non-JSON body still slips through for any reason, the auth forms now fall back to their existing generic error UI instead of throwing `Unexpected token '<'`.
- Verification completed for this fix:
  - `npm test -- src/app/api/auth/[...path]/route.test.ts`
  - `npm test -- src/modules/auth/lib/read-response-json.test.ts`
  - `npm run typecheck`
  - targeted `eslint` on the touched auth files
- Updated practical start point:
  - resume from the remaining roadmap in the existing execution order:
    1. lower-priority admin/mobile/localization audit
    2. PWA readiness checklist for future APK or IPA packaging
    3. remaining production-track work including seller-submission migration, offline queue wiring, and plate blur

## 2026-04-10 Media Update

- The vehicle plate-blur pipeline is now implemented for the Supabase listing flow.
- What changed:
  - New uploads create two stored variants in `vehicle-images`:
    - original image for staff surfaces
    - blurred derivative for approved user-facing inventory and detail routes
  - The pairing logic lives in:
    - `src/lib/media/plate-blur.ts`
    - `src/lib/supabase/vehicle-media-variants.ts`
    - `src/lib/supabase/portal-storage.ts`
  - The read path now chooses variants by viewer capability:
    - staff pages resolve original media
    - approved non-staff inventory and detail pages resolve blurred media
  - The staff vehicle edit page now reads from the shared portal catalog instead of the demo catalog path, so paired media survives edits in Supabase mode.
- Important project rule:
  - In Supabase mode, vehicle photos must preserve both `originalStoragePath` and `blurredStoragePath` through edit flows. Do not collapse them back to one path.
- Important limitation:
  - Existing legacy images that were saved before this change do not have a full automatic backfill job yet. They pick up the paired-media model when a staff user re-saves the listing.
- Verification completed:
  - focused media regressions
  - full `npm test`
  - `npm run typecheck`
  - targeted `eslint`
  - `npm run build`

## Remaining Priorities

1. Seller submission persistence still needs a full Supabase migration.
2. The offline queue still needs wiring into active mutation flows.
3. The PWA readiness checklist for future APK or IPA packaging is still pending.
4. Lower-priority admin localization cleanup still remains.
5. Local repo cleanup noise still exists: `.server-5000.*` and `nul`.
