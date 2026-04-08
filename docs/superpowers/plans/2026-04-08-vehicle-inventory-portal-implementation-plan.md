# Vehicle Inventory Portal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-first, bilingual, private vehicle inventory portal for one used-vehicle reseller with approval-gated access, role-based financial visibility, seller submission review, chat with text and voice notes, reservation workflows, waitlists, sold showcases, resale requests, and private image storage with plate blur.

**Architecture:** Use a single Next.js App Router codebase with locale-aware routing, Supabase Auth/Postgres/Storage, and role-gated server-side reads and writes. Keep the app modular by business domain: auth, users, inventory, inquiries, chat, reservations, resale, media, and settings.

**Tech Stack:** 
- Next.js App Router 16 with Turbopack
- TypeScript (strict mode)
- next-intl for localization
- Supabase Auth, Postgres, Storage
- shadcn/ui (Radix primitives + Tailwind CSS)
- Zod + React Hook Form for validation
- Vitest for unit tests
- Playwright for E2E + visual regression tests
- **PWA:** @serwist/next for offline support
- **Offline Storage:** idb (IndexedDB wrapper)
- **Code Quality:** ESLint, Prettier, lint-staged, husky

**Offline Architecture:**
- App shell cached via Serwist service worker
- IndexedDB for offline data (inventory cache, pending sync queue)
- Network-first with fallback for API data
- Cache-first for static assets
- Background sync when connection restored

---

## Planned File Structure

### Root

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `proxy.ts`
- Create: `.env.example`
- Create: `.env.local`
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `.lintstagedrc`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `public/manifest.json`
- Create: `public/icons/` (PWA icons)
- Create: `app/sw.ts` (Service worker)

### Source

- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/globals.css`
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/not-found.tsx`
- Create: `src/app/[locale]/(auth)/layout.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/app/[locale]/(auth)/signup/page.tsx`
- Create: `src/app/[locale]/(auth)/forgot-password/page.tsx`
- Create: `src/app/[locale]/pending-approval/page.tsx`
- Create: `src/app/[locale]/access-denied/page.tsx`
- Create: `src/app/[locale]/(app)/app/layout.tsx`
- Create: `src/app/[locale]/(app)/app/page.tsx`
- Create: `src/app/[locale]/(app)/app/inventory/page.tsx`
- Create: `src/app/[locale]/(app)/app/reserved/page.tsx`
- Create: `src/app/[locale]/(app)/app/sold/page.tsx`
- Create: `src/app/[locale]/(app)/app/vehicles/[listingId]/page.tsx`
- Create: `src/app/[locale]/(app)/app/inquiries/page.tsx`
- Create: `src/app/[locale]/(app)/app/chat/page.tsx`
- Create: `src/app/[locale]/(app)/app/chat/[threadId]/page.tsx`
- Create: `src/app/[locale]/(app)/app/my-requests/page.tsx`
- Create: `src/app/[locale]/(app)/app/profile/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/users/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/vehicles/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/seller-submissions/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/reservation-requests/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/waitlist/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/resale-requests/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/chat/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/settings/page.tsx`

### Shared Libraries

- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/messages/en.json`
- Create: `src/messages/hi.json`
- Create: `src/lib/env.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/permissions.ts`
- Create: `src/lib/errors.ts`
- Create: `src/lib/formatters.ts`
- Create: `src/lib/cn.ts`
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/storage/plate-blur-provider.ts`
- Create: `src/lib/storage/image-pipeline.ts`
- Create: `src/lib/storage/voice-note-pipeline.ts`
- Create: `src/lib/offline/db.ts` (IndexedDB for offline data)
- Create: `src/lib/offline/sync.ts` (Background sync logic)
- Create: `src/lib/offline/queue.ts` (Pending actions queue)

### Custom Hooks

- Create: `src/hooks/useOnlineStatus.ts`
- Create: `src/hooks/usePWA.ts`
- Create: `src/hooks/useOfflineQueue.ts`

### Types

- Create: `src/types/global.ts`
- Create: `src/types/supabase.ts`

### Components

- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-topbar.tsx`
- Create: `src/components/layout/language-switcher.tsx`
- Create: `src/components/layout/command-menu.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/data-table.tsx`
- Create: `src/components/shared/filter-toolbar.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/error-state.tsx`
- Create: `src/components/shared/loading-state.tsx`

### Domain Modules

- Create: `src/modules/auth/schemas/login-schema.ts`
- Create: `src/modules/auth/schemas/signup-schema.ts`
- Create: `src/modules/auth/server/actions.ts`
- Create: `src/modules/auth/server/queries.ts`
- Create: `src/modules/auth/components/login-form.tsx`
- Create: `src/modules/auth/components/signup-form.tsx`
- Create: `src/modules/auth/components/pending-approval-card.tsx`

- Create: `src/modules/users/server/actions.ts`
- Create: `src/modules/users/server/queries.ts`
- Create: `src/modules/users/components/users-table.tsx`
- Create: `src/modules/users/components/user-detail-drawer.tsx`

- Create: `src/modules/inventory/schemas/vehicle-schema.ts`
- Create: `src/modules/inventory/server/actions.ts`
- Create: `src/modules/inventory/server/queries.ts`
- Create: `src/modules/inventory/components/inventory-grid.tsx`
- Create: `src/modules/inventory/components/inventory-filters.tsx`
- Create: `src/modules/inventory/components/vehicle-card.tsx`
- Create: `src/modules/inventory/components/vehicle-detail.tsx`
- Create: `src/modules/inventory/components/vehicle-form.tsx`
- Create: `src/modules/inventory/components/financial-panel.tsx`

- Create: `src/modules/inquiries/schemas/inquiry-schema.ts`
- Create: `src/modules/inquiries/server/actions.ts`
- Create: `src/modules/inquiries/server/queries.ts`
- Create: `src/modules/inquiries/components/inquiry-modal.tsx`
- Create: `src/modules/inquiries/components/inquiries-table.tsx`

- Create: `src/modules/chat/schemas/chat-message-schema.ts`
- Create: `src/modules/chat/server/actions.ts`
- Create: `src/modules/chat/server/queries.ts`
- Create: `src/modules/chat/components/chat-thread-list.tsx`
- Create: `src/modules/chat/components/chat-thread-view.tsx`
- Create: `src/modules/chat/components/chat-composer.tsx`
- Create: `src/modules/chat/components/voice-note-recorder.tsx`
- Create: `src/modules/chat/components/voice-note-player.tsx`
- Create: `src/modules/chat/components/chat-inbox-table.tsx`

- Create: `src/modules/reservations/schemas/reservation-schema.ts`
- Create: `src/modules/reservations/server/actions.ts`
- Create: `src/modules/reservations/server/queries.ts`
- Create: `src/modules/reservations/components/reserve-interest-modal.tsx`
- Create: `src/modules/reservations/components/reservation-requests-table.tsx`
- Create: `src/modules/reservations/components/waitlist-table.tsx`

- Create: `src/modules/resale/schemas/resale-schema.ts`
- Create: `src/modules/resale/server/actions.ts`
- Create: `src/modules/resale/server/queries.ts`
- Create: `src/modules/resale/components/resale-request-modal.tsx`
- Create: `src/modules/resale/components/resale-requests-table.tsx`

- Create: `src/modules/seller-submissions/schemas/submission-schema.ts`
- Create: `src/modules/seller-submissions/server/actions.ts`
- Create: `src/modules/seller-submissions/server/queries.ts`
- Create: `src/modules/seller-submissions/components/submission-form.tsx`
- Create: `src/modules/seller-submissions/components/submissions-table.tsx`

- Create: `src/modules/settings/server/actions.ts`
- Create: `src/modules/settings/server/queries.ts`
- Create: `src/modules/settings/components/settings-form.tsx`

### Database

- Create: `supabase/migrations/20260408_001_initial_schema.sql`
- Create: `supabase/migrations/20260408_002_rls_policies.sql`
- Create: `supabase/migrations/20260408_003_storage_buckets.sql`
- Create: `supabase/migrations/20260408_004_seed_roles.sql`
- Create: `src/types/database.ts`

### Tests

**Unit Tests:**
- Create: `src/lib/permissions.test.ts`
- Create: `src/lib/locale.test.ts`
- Create: `src/modules/auth/server/actions.test.ts`
- Create: `src/modules/inventory/server/actions.test.ts`
- Create: `src/modules/chat/server/actions.test.ts`
- Create: `src/modules/reservations/server/actions.test.ts`
- Create: `src/modules/resale/server/actions.test.ts`

**E2E Tests:**
- Create: `tests/e2e/auth-approval.spec.ts`
- Create: `tests/e2e/inventory-browse.spec.ts`
- Create: `tests/e2e/chat-flow.spec.ts`
- Create: `tests/e2e/reservation-flow.spec.ts`
- Create: `tests/e2e/staff-ops.spec.ts`

**Visual Regression Tests:**
- Create: `tests/visual/auth-pages.spec.ts` - Login, signup, pending approval
- Create: `tests/visual/inventory.spec.ts` - Grid, cards, detail page
- Create: `tests/visual/responsive.spec.ts` - Mobile/tablet/desktop layouts
- Configure: Playwright screenshot matching with threshold tolerance
- Setup: CI workflow for baseline snapshot updates

---

## Chunk 1: Project Foundation

### Task 1: Bootstrap the Next.js workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json` (strict mode enabled)
- Create: `next.config.ts` (with Serwist PWA)
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `.lintstagedrc`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/globals.css`
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/not-found.tsx`
- Create: `public/manifest.json`
- Create: `public/icons/icon-192x192.svg`
- Create: `public/icons/icon-512x512.svg`
- Create: `app/sw.ts` (Service worker)

- [ ] Initialize Next.js app with TypeScript, `src/` directory, and App Router
- [ ] Add core dependencies:
  - `next-intl` - internationalization
  - `@supabase/supabase-js`, `@supabase/ssr` - Supabase client
  - `zod`, `react-hook-form`, `@hookform/resolvers` - forms & validation
  - `lucide-react` - icons
  - `clsx`, `tailwind-merge` - class utilities
- [ ] Add PWA dependencies:
  - `@serwist/next` - service worker generation
  - `@serwist/precaching`
  - `@serwist/sw`
  - `idb` - IndexedDB wrapper for offline data
- [ ] Add dev dependencies:
  - `vitest`, `@testing-library/react`, `@vitejs/plugin-react`, `jsdom`
  - `playwright`, `@playwright/test`
  - `eslint`, `@eslint/eslintrc`, `eslint-config-next`
  - `prettier`, `eslint-config-prettier`
  - `lint-staged`, `husky` - git hooks
- [ ] Initialize shadcn/ui:
  - `npx shadcn@latest init -d`
  - Add components: button, card, dialog, input, label, textarea, select, badge, avatar, table, tabs, dropdown-menu, popover, tooltip, sheet, toast, skeleton, separator, scroll-area, form, alert
- [ ] Configure Serwist in `next.config.ts` for offline support
- [ ] Create PWA manifest with app name, icons, theme color
- [ ] Create service worker with caching strategies
- [ ] Set up CSS variables for typography, spacing, status colors, surfaces
- [ ] Create root locale layout with error/not-found boundaries
- [ ] Configure ESLint and Prettier
- [ ] Set up husky pre-commit hooks with lint-staged
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`

Run:

```bash
npm install
npx shadcn@latest init -d
npx shadcn@latest add button card dialog input label textarea select badge avatar table tabs dropdown-menu popover tooltip sheet toast skeleton separator scroll-area form alert
npm run lint
npm run typecheck
```

Expected:

- dependencies install successfully
- shadcn/ui initialized with components
- PWA manifest and service worker configured
- lint exits 0
- typecheck exits 0

### Task 1B: Configure PWA and offline support

**Files:**
- Create: `src/lib/offline/db.ts`
- Create: `src/lib/offline/sync.ts`
- Create: `src/lib/offline/queue.ts`
- Create: `src/hooks/useOnlineStatus.ts`
- Create: `src/hooks/usePWA.ts`
- Create: `src/hooks/useOfflineQueue.ts`
- Modify: `src/app/[locale]/layout.tsx` (add offline indicator)

- [ ] Create IndexedDB schema for cached data and sync queue
- [ ] Implement offline detection hook (`useOnlineStatus`)
- [ ] Implement PWA install prompt hook (`usePWA`)
- [ ] Implement offline queue for pending actions
- [ ] Create sync logic that runs when connection restores
- [ ] Add online/offline indicator to layout
- [ ] Configure service worker caching strategies
- [ ] Test offline mode functionality
- [ ] Run tests

### Task 2: Set up locale-aware routing and dictionaries

**Files:**
- Create: `proxy.ts`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/messages/en.json`
- Create: `src/messages/hi.json`

- [ ] Configure locale routing for `en` and `hi`
- [ ] Add browser-language auto-detection on first visit
- [ ] Add locale persistence via cookie and user preference
- [ ] Restrict language switching to onboarding/auth screens and settings/profile only
- [ ] Create initial English and Hindi dictionaries for auth shell, layout labels, and common statuses
- [ ] Add translated navigation labels and status badges
- [ ] Write a unit test for locale fallback logic
- [ ] Run unit tests

Run:

```bash
npm run test -- src/lib/locale.test.ts
npm run lint
npm run typecheck
```

Expected:

- locale fallback test passes
- lint exits 0
- typecheck exits 0

### Task 3: Build the app shell and shared navigation

**Files:**
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-topbar.tsx`
- Create: `src/components/layout/language-switcher.tsx`
- Create: `src/components/layout/command-menu.tsx`
- Create: `src/app/[locale]/(app)/app/layout.tsx`

- [ ] Build the sidebar with role-aware items
- [ ] Build the top bar with command trigger, notifications stub, and profile menu
- [ ] Add the command menu with placeholder search groups
- [ ] Make the shell desktop-first with responsive sidebar collapse
- [ ] Add translated navigation labels for both languages
- [ ] Add snapshot or render tests for role-aware navigation
- [ ] Run tests, lint, and typecheck

---

## Chunk 2: Data Model and Access Control

### Task 4: Create the Supabase schema

**Files:**
- Create: `supabase/migrations/20260408_001_initial_schema.sql`
- Create: `supabase/migrations/20260408_004_seed_roles.sql`
- Create: `src/types/database.ts`

- [ ] Create tables for user profiles, role permissions, vehicles, vehicle listings, vehicle media, vehicle documents, seller submissions, inquiries, chat threads, chat participants, chat messages, chat voice notes, reservation requests, waitlist, sales, resale requests, and activity logs
- [ ] Seed core roles: admin, manager, user
- [ ] Add indexes for listing status, user approval status, and request queues
- [ ] Generate database types from the schema
- [ ] Document any columns that intentionally hide data from normal users
- [ ] Run migration locally

Run:

```bash
supabase db reset
npm run typecheck
```

Expected:

- migrations apply successfully
- generated types compile

### Task 5: Add row-level security and bucket policies

**Files:**
- Create: `supabase/migrations/20260408_002_rls_policies.sql`
- Create: `supabase/migrations/20260408_003_storage_buckets.sql`

- [ ] Add RLS policies for approved-user inventory reads
- [ ] Add role-based restrictions for financial fields, user approvals, and status changes
- [ ] Create private buckets: `vehicle-originals`, `vehicle-blurred`, `vehicle-documents`, `chat-voice-notes`
- [ ] Add storage access rules so normal users never see original images
- [ ] Add SQL comments describing each policy
- [ ] Verify policies with SQL assertions or documented manual checks

Run:

```bash
supabase db reset
```

Expected:

- migrations apply without policy errors

### Task 6: Implement auth, approval gating, and permission helpers

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/permissions.ts`
- Create: `src/modules/auth/server/actions.ts`
- Create: `src/modules/auth/server/queries.ts`
- Create: `src/modules/auth/schemas/login-schema.ts`
- Create: `src/modules/auth/schemas/signup-schema.ts`
- Create: `src/lib/permissions.test.ts`
- Create: `src/modules/auth/server/actions.test.ts`

- [ ] Implement login, signup, logout, and password reset helpers
- [ ] Ensure signup creates `pending_approval` profile records
- [ ] Add server-side helper functions for `isAdmin`, `isManager`, `canViewFinancials`, and `isApprovedUser`
- [ ] Redirect unapproved users to `/pending-approval`
- [ ] Redirect rejected or disabled users to `/access-denied`
- [ ] Write tests for permission helper rules
- [ ] Write tests for signup side effects
- [ ] Run unit tests, lint, and typecheck

---

## Chunk 3: Auth Screens and Core User App

### Task 7: Build the auth shell screens

**Files:**
- Create: `src/modules/auth/components/login-form.tsx`
- Create: `src/modules/auth/components/signup-form.tsx`
- Create: `src/modules/auth/components/pending-approval-card.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/app/[locale]/(auth)/signup/page.tsx`
- Create: `src/app/[locale]/(auth)/forgot-password/page.tsx`
- Create: `src/app/[locale]/pending-approval/page.tsx`
- Create: `src/app/[locale]/access-denied/page.tsx`
- Create: `tests/e2e/auth-approval.spec.ts`

- [ ] Build login UI
- [ ] Build signup UI
- [ ] Build forgot-password UI
- [ ] Build pending approval screen
- [ ] Build access denied screen
- [ ] Add the language switcher only on auth/onboarding screens
- [ ] Translate all labels and validation messages
- [ ] Add end-to-end coverage for signup -> pending approval
- [ ] Run auth e2e, lint, and typecheck

### Task 8: Build the user dashboard and profile

**Files:**
- Create: `src/app/[locale]/(app)/app/page.tsx`
- Create: `src/app/[locale]/(app)/app/profile/page.tsx`
- Create: `src/modules/settings/components/profile-form.tsx`

- [ ] Build the user dashboard with available/reserved/sold counts and recent activity cards
- [ ] Build the profile screen with language preference
- [ ] Persist language preference to the user profile and ensure settings/profile is the only in-app place to change it
- [ ] Add translated status labels and toasts
- [ ] Run lint and typecheck

---

## Chunk 4: Inventory Domain

### Task 9: Build listing read models and inventory queries

**Files:**
- Create: `src/modules/inventory/server/queries.ts`
- Create: `src/modules/inventory/schemas/vehicle-schema.ts`
- Create: `src/modules/inventory/server/actions.test.ts`

- [ ] Implement server queries for available, reserved, sold, and detail views
- [ ] Add filter parsing for make, model, year, fuel, transmission, body type, and location
- [ ] Add role-aware field masking so normal users never receive hidden financial fields
- [ ] Write tests for visibility and filtering rules
- [ ] Run tests, lint, and typecheck

### Task 10: Build user inventory pages and detail page

**Files:**
- Create: `src/modules/inventory/components/inventory-grid.tsx`
- Create: `src/modules/inventory/components/inventory-filters.tsx`
- Create: `src/modules/inventory/components/vehicle-card.tsx`
- Create: `src/modules/inventory/components/vehicle-detail.tsx`
- Create: `src/components/shared/status-badge.tsx`
- Create: `src/components/shared/filter-toolbar.tsx`
- Create: `src/components/shared/empty-state.tsx`
- Create: `src/components/shared/error-state.tsx`
- Create: `src/components/shared/loading-state.tsx`
- Create: `src/app/[locale]/(app)/app/inventory/page.tsx`
- Create: `src/app/[locale]/(app)/app/reserved/page.tsx`
- Create: `src/app/[locale]/(app)/app/sold/page.tsx`
- Create: `src/app/[locale]/(app)/app/vehicles/[listingId]/page.tsx`
- Create: `tests/e2e/inventory-browse.spec.ts`

- [ ] Build available listings screen
- [ ] Build reserved listings screen
- [ ] Build sold listings screen
- [ ] Build listing detail page
- [ ] Add search, filters, and sort controls
- [ ] Add responsive desktop/mobile behavior
- [ ] Verify price and source fields are hidden from user role
- [ ] Add e2e coverage for browsing and opening details
- [ ] Run e2e, lint, and typecheck

### Task 11: Build staff vehicle management

**Files:**
- Create: `src/app/[locale]/(app)/app/admin/vehicles/page.tsx`
- Create: `src/modules/inventory/components/vehicle-form.tsx`
- Create: `src/modules/inventory/components/financial-panel.tsx`
- Create: `src/modules/inventory/server/actions.ts`

- [ ] Build the management page with tabs for draft, available, reserved, sold, archived
- [ ] Build create/edit vehicle form
- [ ] Add hidden financial panel with role-aware visibility
- [ ] Add actions for save draft, publish, update, archive, and status change
- [ ] Add activity log entries for every status change
- [ ] Add unit tests for status transition rules
- [ ] Run tests, lint, and typecheck

---

## Chunk 5: Seller Intake and Media

### Task 12: Build seller submission intake and review flow

**Files:**
- Create: `src/modules/seller-submissions/schemas/submission-schema.ts`
- Create: `src/modules/seller-submissions/server/actions.ts`
- Create: `src/modules/seller-submissions/server/queries.ts`
- Create: `src/modules/seller-submissions/components/submission-form.tsx`
- Create: `src/modules/seller-submissions/components/submissions-table.tsx`
- Create: `src/app/[locale]/(app)/app/admin/seller-submissions/page.tsx`

- [ ] Build seller submission form flow
- [ ] Persist submissions in pending state
- [ ] Build staff review table and preview drawer
- [ ] Add approve-and-create-listing action with prefill
- [ ] Add reject and request-changes actions
- [ ] Run lint and typecheck

### Task 13: Build private image storage and plate blur pipeline

**Files:**
- Create: `src/lib/storage/plate-blur-provider.ts`
- Create: `src/lib/storage/image-pipeline.ts`
- Modify: `src/modules/inventory/server/actions.ts`
- Modify: `src/modules/seller-submissions/server/actions.ts`

- [ ] Create a provider interface for plate blur requests
- [ ] Implement the first provider adapter for the chosen blur API
- [ ] Store originals in `vehicle-originals`
- [ ] Generate and store blurred variants in `vehicle-blurred`
- [ ] Attach only blurred URLs to user-facing listing galleries
- [ ] Add fallback state for failed blur processing
- [ ] Add tests for gallery visibility rules
- [ ] Run tests, lint, and typecheck

---

## Chunk 6: Inquiry, Reservation, Waitlist, and Resale

### Task 14: Build inquiry workflow

**Files:**
- Create: `src/modules/inquiries/schemas/inquiry-schema.ts`
- Create: `src/modules/inquiries/server/actions.ts`
- Create: `src/modules/inquiries/server/queries.ts`
- Create: `src/modules/inquiries/components/inquiry-modal.tsx`
- Create: `src/modules/inquiries/components/inquiries-table.tsx`
- Create: `src/app/[locale]/(app)/app/inquiries/page.tsx`

- [ ] Build inquiry modal
- [ ] Persist inquiries linked to listing and user
- [ ] Build user inquiry history view
- [ ] Build staff inquiry queue view
- [ ] Add open/contacted/closed status handling
- [ ] Translate all form and queue labels
- [ ] Run lint and typecheck

### Task 14A: Build chat and voice-note workflow

**Files:**
- Create: `src/modules/chat/schemas/chat-message-schema.ts`
- Create: `src/modules/chat/server/actions.ts`
- Create: `src/modules/chat/server/queries.ts`
- Create: `src/modules/chat/components/chat-thread-list.tsx`
- Create: `src/modules/chat/components/chat-thread-view.tsx`
- Create: `src/modules/chat/components/chat-composer.tsx`
- Create: `src/modules/chat/components/voice-note-recorder.tsx`
- Create: `src/modules/chat/components/voice-note-player.tsx`
- Create: `src/modules/chat/components/chat-inbox-table.tsx`
- Create: `src/lib/storage/voice-note-pipeline.ts`
- Create: `src/app/[locale]/(app)/app/chat/page.tsx`
- Create: `src/app/[locale]/(app)/app/chat/[threadId]/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/chat/page.tsx`
- Create: `src/modules/chat/server/actions.test.ts`
- Create: `tests/e2e/chat-flow.spec.ts`

- [ ] Build general support chat thread creation
- [ ] Build vehicle-specific chat thread creation from listing detail
- [ ] Persist text messages in thread timeline
- [ ] Implement browser voice recording for supported browsers
- [ ] Upload voice notes to the private `chat-voice-notes` bucket
- [ ] Persist voice-note message records linked to thread and sender
- [ ] Build user chat list and thread view
- [ ] Build admin/manager chat inbox and reply workflow
- [ ] Enforce participant authorization for thread reads and voice-note access
- [ ] Add e2e coverage for user text message, user voice note, and staff reply flow
- [ ] Run tests, lint, and typecheck

### Task 15: Build reservation request and waitlist workflow

**Files:**
- Create: `src/modules/reservations/schemas/reservation-schema.ts`
- Create: `src/modules/reservations/server/actions.ts`
- Create: `src/modules/reservations/server/queries.ts`
- Create: `src/modules/reservations/components/reserve-interest-modal.tsx`
- Create: `src/modules/reservations/components/reservation-requests-table.tsx`
- Create: `src/modules/reservations/components/waitlist-table.tsx`
- Create: `src/app/[locale]/(app)/app/admin/reservation-requests/page.tsx`
- Create: `src/app/[locale]/(app)/app/admin/waitlist/page.tsx`
- Create: `tests/e2e/reservation-flow.spec.ts`

- [ ] Build reserve-interest modal with available/reserved variants
- [ ] Create reservation request records for available listings
- [ ] Create waitlist entries for reserved listings
- [ ] Build staff review queue for reservation requests
- [ ] Build staff waitlist management table
- [ ] Add approve, reject, promote, and remove actions
- [ ] Enforce that only manager/admin can change listing status
- [ ] Add e2e coverage for request -> approve -> reserved and reserved -> waitlist
- [ ] Run e2e, lint, and typecheck

### Task 16: Build sold showcase and resale request flow

**Files:**
- Create: `src/modules/resale/schemas/resale-schema.ts`
- Create: `src/modules/resale/server/actions.ts`
- Create: `src/modules/resale/server/queries.ts`
- Create: `src/modules/resale/components/resale-request-modal.tsx`
- Create: `src/modules/resale/components/resale-requests-table.tsx`
- Create: `src/app/[locale]/(app)/app/admin/resale-requests/page.tsx`
- Modify: `src/modules/inventory/server/actions.ts`
- Modify: `src/app/[locale]/(app)/app/sold/page.tsx`

- [ ] Build resale request modal on sold listings
- [ ] Persist resale requests linked to sold listing and user
- [ ] Build staff resale queue
- [ ] Add approval flow that creates a new linked listing instead of mutating the original sold listing
- [ ] Add tests for relisting behavior
- [ ] Run tests, lint, and typecheck

### Task 17: Build user request center

**Files:**
- Create: `src/app/[locale]/(app)/app/my-requests/page.tsx`

- [ ] Build a tabbed page for reservation requests, waitlist entries, and resale requests
- [ ] Add current status badges and last update timestamps
- [ ] Add links back to vehicle detail
- [ ] Translate all status labels and empty states
- [ ] Run lint and typecheck

---

## Chunk 7: Staff Operations and Settings

### Task 18: Build admin user approvals and role management

**Files:**
- Create: `src/modules/users/server/actions.ts`
- Create: `src/modules/users/server/queries.ts`
- Create: `src/modules/users/components/users-table.tsx`
- Create: `src/modules/users/components/user-detail-drawer.tsx`
- Create: `src/app/[locale]/(app)/app/admin/users/page.tsx`

- [ ] Build pending/approved/rejected/disabled tabs
- [ ] Add approve, reject, disable, enable, and edit-role actions
- [ ] Add bulk approve/reject support
- [ ] Add user detail drawer with request and inquiry summary
- [ ] Add audit log writes for approval and role changes
- [ ] Run lint and typecheck

### Task 19: Build staff dashboards and queue summaries

**Files:**
- Modify: `src/app/[locale]/(app)/app/page.tsx`

- [ ] Add role-aware dashboard variants
- [ ] Add queue summary cards for pending approvals, reservations, submissions, and resale requests
- [ ] Add recent activity and quick actions
- [ ] Ensure user role sees a simpler version without staff metrics
- [ ] Run lint and typecheck

### Task 20: Build settings and permission switches

**Files:**
- Create: `src/modules/settings/server/actions.ts`
- Create: `src/modules/settings/server/queries.ts`
- Create: `src/modules/settings/components/settings-form.tsx`
- Create: `src/app/[locale]/(app)/app/admin/settings/page.tsx`

- [ ] Add admin-controlled manager financial visibility setting
- [ ] Add notification preference placeholders
- [ ] Add localization defaults and profile language override behavior
- [ ] Add tests for permission switch effects
- [ ] Run tests, lint, and typecheck

---

## Chunk 8: Polish, Accessibility, and Launch Readiness

### Task 21: Finish bilingual coverage and translation QA

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/hi.json`

- [ ] Audit every screen for untranslated labels
- [ ] Add missing validation, empty state, and toast translations
- [ ] Verify manager/admin financial labels are translated
- [ ] Run through both languages manually and fix layout overflow issues

### Task 22: Finish accessibility and responsive QA

**Files:**
- Modify: impacted pages and components from earlier tasks

- [ ] Verify all forms have labels
- [ ] Verify dialogs trap focus
- [ ] Verify keyboard navigation for primary actions
- [ ] Verify responsive behavior for inventory, detail, and admin tables
- [ ] Fix any mobile overflow or unusable controls
- [ ] Run lint and typecheck

### Task 23: Run full regression and prepare launch checklist

**Files:**
- Modify: `HANDOFF.md`
- Modify: `SESSION.md`

- [ ] Run unit tests
- [ ] Run e2e tests
- [ ] Run visual regression tests
- [ ] Run lint
- [ ] Run typecheck
- [ ] Document environment variables
- [ ] Document known gaps and post-MVP items

### Task 24: Visual regression testing setup and execution

**Files:**
- Create: `tests/visual/auth-pages.spec.ts`
- Create: `tests/visual/inventory.spec.ts`
- Create: `tests/visual/responsive.spec.ts`
- Modify: `playwright.config.ts`

- [ ] Configure Playwright for visual testing:
  - Add `toHaveScreenshot()` assertions
  - Configure `screenshot: { fullPage: true }` for key pages
  - Set threshold tolerance for cross-platform differences
  - Configure CI to update baselines on approved changes
- [ ] Create visual tests for auth pages (login, signup, pending-approval)
- [ ] Create visual tests for inventory pages (grid, cards, filters)
- [ ] Create visual tests for responsive behavior (mobile, tablet, desktop)
- [ ] Run visual tests and generate baseline screenshots
- [ ] Document visual testing workflow

### Task 25: PWA verification and offline testing

**Files:**
- Modify: Service worker configuration
- Create: `tests/e2e/offline.spec.ts`

- [ ] Test service worker registration
- [ ] Test offline navigation between cached pages
- [ ] Test IndexedDB data persistence
- [ ] Test pending sync queue when offline
- [ ] Test automatic sync on reconnection
- [ ] Test PWA installability (manifest, icons)
- [ ] Verify offline indicator displays correctly
- [ ] Test iOS Safari PWA behavior

Run:

```bash
npm run test
npm run test:e2e
npm run lint
npm run typecheck
```

Expected:

- all configured checks pass

---

## Environment Variables To Prepare

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Plate Blur (for image privacy)
PLATE_BLUR_API_KEY=
PLATE_BLUR_API_URL=

# PWA (optional)
PWA_ENABLED=true

# Error Tracking (optional - recommended for production)
SENTRY_DSN=
```

### Required .env.local Template

Create `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PLATE_BLUR_API_KEY=your_plateblur_key
PLATE_BLUR_API_URL=https://api.plateblurprovider.com
PWA_ENABLED=true
```

---

## Notes For Execution

### Core Principles

- Keep files under 200 lines where practical by splitting UI, schemas, server queries, and server actions
- Use server components for reads by default
- Use server actions for authenticated form mutations unless a route handler is clearly better

### Security Rules

- Do not expose original image URLs to normal users
- Do not expose voice-note files outside authorized thread participants
- Do not expose financial fields to `User` role
- Do not let user actions directly mutate listing status
- Always keep sold history immutable when creating resale listings

### Offline Support

- Cache app shell (HTML, CSS, JS) for instant offline load
- Use IndexedDB for offline data storage
- Queue user actions (inquiry, reservation, message) when offline
- Sync queued actions automatically when connection restores
- Display clear offline indicator to users
- Test on real mobile devices, especially iOS Safari

### Visual Regression Testing

- Use Playwright's `toHaveScreenshot()` for key UI components
- Configure acceptable threshold (0.1-0.3) for cross-platform differences
- Store baselines in `tests/snapshots/` directory
- Run visual tests in CI with manual approval for baseline updates
- Test responsive layouts (mobile, tablet, desktop widths)

### Long-term Maintenance

- Use ESLint + Prettier for consistent code style
- Configure husky pre-commit hooks to prevent bad code from entering
- Write unit tests for all server actions and utility functions
- Document all environment variables in `.env.example`
- Use TypeScript strict mode for better type safety
- Keep dependencies updated (security patches monthly)

### Shadcn/ui Usage

- Use existing components before building custom ones
- Prefer `new-york` style for product/dashboard surfaces
- Default to dark mode for admin/operational interfaces
- Use theme tokens (`bg-background`, `text-foreground`) over hardcoded colors
- Keep icons consistent (Lucide, `h-4 w-4` or `h-5 w-5`)

---

Plan complete and saved to `docs/superpowers/plans/2026-04-08-vehicle-inventory-portal-implementation-plan.md`. Ready to execute?
