# Vahan - App Structure Snapshot

## Route Tree

### Public and auth-facing routes
| Route | Purpose | Main surface |
|---|---|---|
| `/` | Locale redirect | Root redirect |
| `/{locale}` | Locale landing redirect | Locale entry |
| `/{locale}/login` | Login | `LoginForm` |
| `/{locale}/signup` | Signup | `SignupForm` |
| `/{locale}/forgot-password` | Password reset request | `ForgotPasswordForm` |
| `/{locale}/pending-approval` | Awaiting approval state | Pending approval screen |
| `/{locale}/access-denied` | Blocked access state | Access denied screen |

### Authenticated user routes
| Route | Purpose | Main surface |
|---|---|---|
| `/{locale}/app` | Role-aware dashboard | User or staff dashboard |
| `/{locale}/app/inventory` | Published inventory | `InventoryScreen` |
| `/{locale}/app/reserved` | Reserved inventory | `InventoryScreen` |
| `/{locale}/app/sold` | Sold inventory | `InventoryScreen` |
| `/{locale}/app/inquiries` | Inquiry queue | Inquiry route |
| `/{locale}/app/chat` | Thread list | Chat inbox |
| `/{locale}/app/chat/[threadId]` | Thread detail | Chat workspace |
| `/{locale}/app/my-requests` | Requests, uploads, waitlist | Request dashboard |
| `/{locale}/app/profile` | Profile and preferences | Profile form |
| `/{locale}/app/vehicles/[listingId]` | Vehicle detail | `VehicleDetailScreen` |

### Staff routes
| Route | Purpose | Main surface |
|---|---|---|
| `/{locale}/app/admin/users` | User management | Admin queue |
| `/{locale}/app/admin/vehicles` | Vehicle management | `VehicleManagementTable` |
| `/{locale}/app/admin/vehicles/new` | Create listing | `VehicleForm` |
| `/{locale}/app/admin/vehicles/[listingId]/edit` | Edit listing | `VehicleForm` |
| `/{locale}/app/admin/seller-submissions` | Seller submission queue | Staff submission panel |
| `/{locale}/app/admin/reservation-requests` | Reservation approvals | Staff queue |
| `/{locale}/app/admin/waitlist` | Waitlist operations | Staff queue |
| `/{locale}/app/admin/resale-requests` | Resale requests | Staff queue |
| `/{locale}/app/admin/chat` | Staff chat inbox | Staff chat panel |
| `/{locale}/app/admin/settings` | Operational settings | Settings panel |

## API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | `POST` | Login |
| `/api/auth/signup` | `POST` | Signup |
| `/api/auth/logout` | `POST` | Logout |
| `/api/auth/reset-password` | `POST` | Request password reset |
| `/api/vehicles` | `POST` | Create vehicle listing in Supabase mode |
| `/api/vehicles/[listingId]` | `PUT`, `DELETE` | Update or delete listing in Supabase mode |
| `/api/inquiries` | `POST` | Create inquiry |
| `/api/reservations` | `POST` | Create reservation or waitlist request |
| `/api/resale` | `POST` | Create resale request |
| `/api/chat/messages` | `POST` | Send chat message |
| `/api/portal` | `POST`, `PATCH` | Portal mutations in Supabase mode |
| `/api/demo/portal` | `POST`, `PATCH` | Demo-mode portal mutations |
| `/api/demo/vehicles` | `POST` | Demo-mode vehicle create |
| `/api/demo/vehicles/[listingId]` | `PUT`, `DELETE` | Demo-mode vehicle update and delete |

## Core Shared Surfaces

### Layout and navigation
- `src/app/[locale]/(app)/app/layout.tsx`
- `src/components/layout/app-topbar.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/appearance-switcher.tsx`
- `src/components/layout/topbar-locale-switcher.tsx`
- `src/components/layout/notification-center.tsx`

### Inventory and detail
- `src/modules/inventory/components/inventory-screen.tsx`
- `src/modules/inventory/components/vehicle-detail-screen.tsx`
- `src/modules/inventory/components/vehicle-form.tsx`
- `src/modules/inventory/components/photo-upload-field.tsx`
- `src/components/vehicle/vehicle-grid.tsx`
- `src/components/vehicle/vehicle-card.tsx`

### Requests, uploads, and chat
- `src/modules/requests/components/my-submissions-panel.tsx`
- `src/modules/requests/components/vehicle-submission-form.tsx`
- `src/components/chat/chat-window.tsx`
- `src/components/chat/chat-thread-list.tsx`

## Data and Storage Model

### Runtime modes
- Demo mode: local JSON-backed stores under `data/`
- Supabase mode: auth, database, and private storage via server-side helpers under `src/lib/supabase/`

### Primary domain tables
- `user_profiles`
- `vehicles`
- `vehicle_listings`
- `vehicle_media`
- `seller_submissions`
- `inquiries`
- `reservation_requests`
- `reservation_waitlist`
- `resale_requests`
- `chat_threads`
- `chat_participants`
- `chat_messages`
- `app_settings`
- `activity_logs`

### Media behavior
- Vehicle uploads are compressed client-side before submit.
- In Supabase mode, vehicle media now persists as paired original and blurred variants.
- Staff surfaces resolve original images.
- Approved user-facing inventory and detail routes resolve blurred variants.
- Seller-submission uploads persist under submission-scoped storage paths and are cloned into listing-owned media when staff converts a submission into inventory.
- Voice notes are stored privately in the `voice-notes` bucket.

## Current Gaps

### Still pending
1. The real Supabase project still needs the latest migrations applied, including `20260411_001_seller_submission_upgrade.sql`.
2. The offline queue is wired for the main user portal create flows, but staff moderation flows, queued-action history UI, and offline E2E coverage are still pending.
3. The PWA readiness checklist now exists in `docs/PWA_READINESS.md`, but the packaging work itself is still pending: icons, splash assets, packaged-shell validation, and mobile offline QA.
4. Some lower-priority admin helper copy still needs a final localization pass.
5. Legacy vehicle images saved before the paired-media rollout still do not have a full blur backfill job.
6. Local cleanup noise still exists in the worktree: `.server-5000.*` and `nul`.

### Already resolved from earlier stale notes
- Forgot-password route exists.
- Vehicle detail route exists.
- Reserved, sold, inquiries, my-requests, and admin routes exist.
- Error boundaries and not-found routes exist.
- Chat is integrated into the app shell.

## Permissions Summary

### Roles
- `admin`: full operational access
- `manager`: staff access with configurable financial visibility
- `user`: approved-user access to inventory and own workflows

### Media visibility
- Staff can resolve original vehicle images.
- Approved non-staff users only resolve blurred vehicle images for published, reserved, and sold listings.
- Disabled users cannot access the app.

## PWA and i18n

- `next-intl` locale routing with English and Hindi message bundles
- Manifest at `/manifest.webmanifest`
- Service worker wiring present
- IndexedDB helpers and queued replay are active for inquiry, reservation, resale, and chat-message portal actions; broader offline UX and automated coverage are still pending
