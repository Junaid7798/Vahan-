# HANDOFF

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
