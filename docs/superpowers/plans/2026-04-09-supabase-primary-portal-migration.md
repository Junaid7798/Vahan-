# Supabase Primary Portal Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase the primary backend for the portal while preserving the existing demo fallback path.

**Architecture:** Keep auth and role resolution on the existing Supabase session path, then replace the active demo-backed portal reads and writes with a Supabase domain layer used by Server Components and Route Handlers. Preserve the current JSON demo layer behind the existing configuration checks, and add signed private media URLs plus real mutation endpoints so the UI and offline queue stop depending on `/api/demo/*`.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Auth/Postgres/Storage, next-intl, shadcn/ui, IndexedDB offline queue.

---

## Chunk 1: Schema, bootstrap, and Supabase domain boundary

### Task 1: Add migration and bootstrap documentation for Supabase-first mode

**Files:**
- Create: `supabase/migrations/20260409_001_portal_primary_extensions.sql`
- Modify: `.env.example`
- Modify: `docs/superpowers/plans/2026-04-09-mobile-first-inputs-and-app-roadmap.md`

- [ ] Add any missing schema pieces needed by the current UI to the follow-up migration without rewriting older migrations.
- [ ] Add an RPC or bootstrap-safe path for promoting `Junaid557722@gmail.com` to approved `admin`.
- [ ] Add env placeholders needed for signed URL generation and deferred plate-blur toggling.
- [ ] Record that plate blur is intentionally deferred behind a no-op hook for now.

### Task 2: Create a focused Supabase portal data layer

**Files:**
- Create: `src/lib/supabase/portal-types.ts`
- Create: `src/lib/supabase/portal-media.ts`
- Create: `src/lib/supabase/portal-catalog.ts`
- Create: `src/lib/supabase/portal-operations.ts`
- Create: `src/lib/supabase/portal-mutations.ts`
- Modify: `src/lib/auth/viewer.ts`

- [ ] Define explicit Supabase-backed shapes for vehicles, listings, media, requests, and dashboard aggregates.
- [ ] Implement signed media URL helpers for `vehicle-images` and `voice-notes`.
- [ ] Implement read helpers for inventory, vehicle detail, dashboard, requests, inquiries, and notifications.
- [ ] Keep the viewer resolution logic unchanged except where profile access needs shared helpers.

## Chunk 2: Replace active read paths with Supabase-primary reads

### Task 3: Switch active app pages off demo readers

**Files:**
- Modify: `src/app/[locale]/(app)/app/page.tsx`
- Modify: `src/app/[locale]/(app)/app/inventory/page.tsx`
- Modify: `src/app/[locale]/(app)/app/reserved/page.tsx`
- Modify: `src/app/[locale]/(app)/app/sold/page.tsx`
- Modify: `src/app/[locale]/(app)/app/vehicles/[listingId]/page.tsx`
- Modify: `src/app/[locale]/(app)/app/admin/vehicles/page.tsx`
- Modify: `src/app/[locale]/(app)/app/inquiries/page.tsx`
- Modify: `src/app/[locale]/(app)/app/my-requests/page.tsx`
- Modify: `src/app/[locale]/(app)/app/layout.tsx`
- Modify: `src/app/[locale]/(app)/app/profile/page.tsx`

- [ ] Replace `src/lib/demo/portal-catalog` and `src/lib/demo/portal-operations` imports with the new Supabase data layer where Supabase is configured.
- [ ] Preserve demo fallback when Supabase config is missing.
- [ ] Keep output shapes compatible with the existing UI to avoid unnecessary component rewrites.

### Task 4: Make media rendering work with private storage

**Files:**
- Modify: `src/components/vehicle/vehicle-card.tsx`
- Modify: `src/components/vehicle/vehicle-detail.tsx`
- Modify: `src/modules/inventory/components/vehicle-detail-screen.tsx`
- Modify: `src/components/chat/chat-window.tsx`

- [ ] Stop assuming `storage_path` is a public URL.
- [ ] Render signed URLs returned by the Supabase layer for private images and voice notes.
- [ ] Keep placeholder behavior intact for missing media and demo mode.

## Chunk 3: Replace active write paths with Supabase-primary mutations

### Task 5: Move vehicle create, update, delete, and media upload to Supabase

**Files:**
- Create: `src/app/api/vehicles/route.ts`
- Create: `src/app/api/vehicles/[listingId]/route.ts`
- Create: `src/app/api/media/upload/route.ts`
- Modify: `src/modules/inventory/components/vehicle-form.tsx`
- Modify: `src/modules/inventory/components/photo-upload-field.tsx`
- Modify: `src/modules/admin/components/vehicle-management-table.tsx`

- [ ] Upload compressed images to Supabase Storage instead of embedding data URLs in app state.
- [ ] Persist vehicles, listings, and media rows to Supabase.
- [ ] Delete storage objects and related rows safely on listing removal.
- [ ] Keep demo endpoints untouched as fallback paths.

### Task 6: Replace request and profile mutation paths

**Files:**
- Create: `src/app/api/inquiries/route.ts`
- Create: `src/app/api/reservations/route.ts`
- Create: `src/app/api/resale/route.ts`
- Create: `src/app/api/profile/route.ts`
- Modify: `src/modules/profile/components/profile-form.tsx`
- Modify: `src/components/inquiry/inquiry-form.tsx`
- Modify: `src/components/reservation/reservation-form.tsx`
- Modify: `src/components/reservation/waitlist-button.tsx`
- Modify: `src/components/seller/resale-request-form.tsx`
- Modify: `src/lib/offline/sync.ts`

- [ ] Add real Supabase-backed mutation routes for the offline queue action types.
- [ ] Move profile updates off `/api/demo/portal`.
- [ ] Reuse viewer permissions and Supabase session identity on the server.

## Chunk 4: Chat cleanup and verification

### Task 7: Make the active chat workspace use Supabase-primary mutations

**Files:**
- Create: `src/app/api/chat/threads/route.ts`
- Create: `src/app/api/chat/messages/route.ts`
- Create: `src/app/api/chat/threads/[threadId]/close/route.ts`
- Modify: `src/modules/chat/components/chat-workspace.tsx`
- Modify: `src/components/chat/chat-provider.tsx`

- [ ] Stop routing active chat UI through demo portal actions when Supabase is configured.
- [ ] Reuse existing Supabase chat tables and storage policies.
- [ ] Keep demo chat behavior as the fallback path.

### Task 8: Verify, document, and hand off

**Files:**
- Modify: `SESSION.md`
- Modify: `HANDOFF.md`

- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Run `npm.cmd test`.
- [ ] Add a session log entry with completed work, remaining gaps, and any deferred items.
