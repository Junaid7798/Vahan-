# Vehicle Inventory Portal MVP Design

## Summary

Build a single-tenant web application for one used-vehicle reseller. The product is a private inventory portal for approved users, plus an internal operations dashboard for staff.

The app should not present itself as a broker platform. Users browse inventory after login, view vehicle details, send inquiries, reserve interest, and request resale on sold vehicles. Internal financial data stays hidden from normal users.

## Goals

- Let approved users browse used vehicles after login
- Hide price from normal users
- Hide whether a vehicle is owned inventory or a third-party deal
- Capture vehicle procurement price, extra spend, and internal selling price for restricted staff only
- Allow users to send inquiries and reserve interest
- Keep reservation status under admin or manager control
- Show sold vehicles as showcase inventory
- Allow sold vehicles to enter a resale workflow
- Support large image volume with private storage and automatic plate blur for user-facing images
- Deliver a modern, visually strong, easy-to-understand UI across the full app
- Support both English and Hindi across the full app, including staff dashboards
- Support in-app chat with text messages and voice notes

## Non-Goals

- Public inventory browsing without login
- Multi-tenant SaaS support
- Self-serve seller dashboards
- Online payments or payout automation
- Buyer negotiation or checkout flow
- Exposing broker logic, payout logic, or internal costs to normal users

## Users And Roles

### Admin

- Approve or reject new users
- Create, edit, publish, reserve, sell, archive, and relist vehicles
- Review seller submissions
- Review reservation requests and waitlist entries
- Review resale requests
- View all internal financial data
- Decide whether managers can view financial data

### Manager

- Manage inventory and operational workflows
- Change listing status
- Review seller submissions
- Review reservation requests and waitlist entries
- Review resale requests
- View internal financial data only if granted by admin

### User

- Sign up and wait for approval
- Browse inventory after approval
- View available, reserved, and sold vehicles
- Send inquiries
- Submit reserve-interest requests
- Join waitlist for reserved vehicles
- Request resale on sold vehicles
- Cannot view restricted financial data
- Cannot change vehicle or listing status

## Access Model

- Anyone can sign up
- New accounts default to `pending_approval`
- Only approved users can access inventory
- Inventory is visible only after login and approval
- Image buckets remain private
- User-facing image access is served from blurred variants only

## Product Structure

The MVP has two main surfaces:

1. Private inventory portal for approved users
2. Internal staff dashboard for admin and manager operations

There is no public marketplace in MVP.

## UX And Visual Direction

The interface should feel modern, premium, and extremely easy to scan.

Design principles:

- strong visual hierarchy
- large, readable typography
- clear status visibility for available, reserved, and sold
- mobile-first layouts
- minimal clutter on vehicle cards and detail pages
- simple actions with obvious labels
- dashboard surfaces that feel operational, not generic

UI expectations:

- avoid template-looking SaaS UI
- avoid noisy cards and unnecessary widgets
- use clear spacing and section grouping
- make important workflows obvious in one glance
- keep inquiry, reserve-interest, approval, and review flows simple

The design should work equally well for:

- normal users browsing vehicles
- managers reviewing requests
- admins controlling approvals and restricted financials

## Modern Product Patterns To Adopt

The UI and workflow should borrow from current production web apps instead of generic admin templates.

### Recommended Modern Patterns For MVP

- global command/search entry for fast navigation and quick actions
- role-aware dashboards that surface the next actions instead of dense metric walls
- saved filters and personalized views for staff
- list and board-style queue views for operational workflows
- quick preview drawer or side panel for vehicle and request review
- row selection and bulk actions in staff tables
- sticky filters and sticky primary actions on detail screens
- activity timelines on important entities such as listings and requests
- strong loading, empty, success, and error states
- keyboard-friendly staff workflows for high-frequency actions

### Product Inspirations Behind These Patterns

- Linear-style command search, saved views, inboxes, board/list toggles, and peek previews
- DealerCenter-style unified vehicle detail and operational inventory workflows
- automotive listing patterns from current inventory sites like Autotrader and Cars.com
- modern bilingual app architecture based on current Next.js internationalization patterns

### Visual Direction

The UI should feel:

- premium
- calm
- fast
- operational
- trustworthy

The app should not feel like:

- a default SaaS template
- a cluttered dealership back-office system
- a crowded marketplace clone

### Interaction Style

- reduce full page reload-style jumps
- use drawers, dialogs, and side panels where that improves speed
- prefer instant visual feedback for filters, approvals, and request actions
- make queues easy to clear in batches
- design around scanning, not reading long blocks

## Language Support

The whole app must support:

- English
- Hindi

This applies to:

- sign up and login flows
- pending approval screens
- inventory pages
- vehicle detail pages
- inquiry and reservation forms
- sold and resale flows
- admin and manager dashboards
- approval and review workflows
- settings and profile pages

### Language Behavior

- first visit should auto-detect preferred language from the browser
- onboarding/auth pages should provide the language switcher
- after onboarding, language should persist across the whole app
- users should change language later only from settings
- the selected language should persist for the logged-in user
- both languages should use the same features and workflows

### Content Rules

- all interface labels, buttons, table headers, filters, and empty states must be translated
- validation messages and status labels must be translated
- role-restricted financial labels must also be translated for staff users
- vehicle source secrecy rules still apply in both languages

### UX Translation Rule

Translations should be clear and operational, not overly literal.

That means:

- use simple Hindi suitable for mixed English/Hindi business users
- keep labels short
- prefer clarity over formal wording
- keep staff workflows easy for non-technical operators

## Core Inventory Model

Use separate concepts for the physical vehicle and its listing lifecycle.

### Vehicle

Represents the physical car and its persistent attributes:

- VIN
- make
- model
- year
- variant
- color
- fuel type
- transmission
- mileage
- registration details

### Vehicle Listing

Represents a sellable inventory entry for the vehicle.

This is needed because the same vehicle can be:

- listed
- reserved
- sold
- later offered for resale
- listed again as a new active listing

### Listing Statuses

Staff statuses:

- `draft`
- `available`
- `reserved`
- `sold`
- `archived`

User-visible statuses:

- `available`
- `reserved`
- `sold`

## Main Workflows

### User Signup And Approval

1. User signs up
2. Account enters `pending_approval`
3. Admin reviews the account
4. Admin approves or rejects
5. Approved user can browse inventory

### Seller Submission

1. Outside seller submits vehicle details and photos
2. Submission remains pending
3. Admin or manager reviews the submission
4. Staff either rejects it or creates a listing from it

Outside sellers do not get a dashboard in MVP.

### Inquiry

Users can send inquiries on:

- available vehicles
- reserved vehicles

Inquiry creates a staff-follow-up record only. It does not change listing status.

### Chat

The MVP includes two chat types:

- general support chat
- vehicle-specific chat

Supported message types:

- text message
- voice note

Core rules:

- chat is available only to logged-in approved users
- users can open a general support thread
- users can open or continue a vehicle-specific thread from a vehicle detail page
- Admin and Manager can reply in the same thread
- text and voice notes live in the same conversation timeline

Purpose:

- help users communicate even if they are not comfortable typing or reading long text
- reduce friction for buyers and sellers with low literacy or strong spoken-language preference

### Reserve Interest

Users can submit reserve-interest on:

- available vehicles
- reserved vehicles

Rules:

- User action never changes listing status directly
- Reserve interest on an available vehicle creates a `reservation_request`
- Only admin or manager can change `available -> reserved`
- If a listing is already reserved, reserve interest creates a waitlist entry

### Reserved Listing Behavior

Reserved listings remain visible to approved users.

Users can still:

- send inquiry
- submit reserve interest

Reserve interest on a reserved listing means joining the waitlist, not overriding the current reservation.

### Sold Vehicle Showcase

Sold vehicles remain visible to approved users as showcase inventory.

Users can request resale on a sold vehicle.

### Resale Flow

When a sold vehicle is offered for resale:

1. User submits a resale request
2. Admin or manager reviews it
3. If approved, the system creates a new active listing linked to the same vehicle
4. The original sold record remains unchanged for history and reporting

The system must never overwrite an old sold record when relisting.

## Financial Visibility

Restricted fields:

- procurement price
- internal selling price
- target selling price
- total extra spend
- expected margin
- realized margin

Extra spend categories:

- maintenance
- documentation
- transport
- other

Visibility rules:

- Admin can always view and edit
- Manager can view if enabled by admin
- User can never view

## Images And Storage

Use Supabase Storage with private buckets.

Recommended buckets:

- `vehicle-originals`
- `vehicle-blurred`
- `vehicle-documents`
- `chat-voice-notes`

### Image Rules

- Store original uploads privately
- Generate blurred variants for user-facing inventory images
- Show only blurred variants to normal users
- Allow staff to review originals if needed
- Keep documents private and staff-only

### Plate Blur Flow

1. Staff or seller uploads an image
2. Backend stores the original image privately
3. Backend sends the image to the plate-blur service
4. Blurred image is stored in the blurred bucket
5. Listing gallery uses blurred images only

If automatic blur fails, staff should be able to replace or reprocess the image.

### Chat Media Rules

- voice notes must be stored privately
- voice-note access must require authenticated, authorized users
- voice notes should be linked to a chat message record, not treated as general file uploads
- normal users should only be able to access voice notes for threads they participate in
- Admin and Manager should only be able to access voice notes for threads they are allowed to manage

## Frontend Scope

### User Pages

- sign up
- login
- pending approval
- inventory list
- vehicle detail
- sold vehicles list
- chat
- profile
- language preferences

### User Features

- search and filters
- gallery view
- inquiry form
- reserve-interest form
- waitlist join flow
- resale request form on sold vehicles
- language switcher
- quick search
- general support chat
- vehicle-specific chat
- text messaging
- voice-note recording and playback

### Staff Pages

- dashboard
- user approvals
- vehicle management
- seller submissions
- reservation requests
- waitlist queue
- sold inventory management
- resale requests
- chat inbox
- settings and role control
- language preferences

### Staff UX Patterns

- data tables with sorting, filtering, pagination, and row actions
- board or grouped queue view where it improves workflow visibility
- quick preview drawer for listings, users, seller submissions, and reservation requests
- bulk approval and bulk status actions where safe
- persistent filters for frequent workflows
- favorites or saved views for repeated staff work
- unified chat inbox for general and vehicle-specific conversations

## Backend Scope

### Auth And Access

- signup
- login
- approval gating
- role-based access control

### Inventory

- vehicle CRUD
- listing CRUD
- listing status changes
- sold and archived flows

### Seller Intake

- submission intake
- review and conversion to listing

### Reservations

- reservation requests
- manual approval
- waitlist creation
- reservation release

### Chat

- general support thread creation
- vehicle-specific thread creation
- text message send and receive
- voice-note upload and playback
- thread participant authorization
- staff chat inbox and reply workflow

### Resale

- resale request intake
- review
- new listing creation from an existing sold vehicle

### Media

- upload
- blur
- storage
- signed access

## Recommended Stack

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- shadcn/ui
- Vercel deployment

## Frontend Requirements

- responsive design for mobile, tablet, and desktop
- bilingual UI architecture from day one
- reusable design system tokens for spacing, colors, type, and status styles
- accessible forms and controls
- clear role-based navigation
- consistent visual treatment for status badges, cards, and review queues

## Internationalization Requirements

The application should be built with full i18n support from the start instead of patching translation in later.

Required behavior:

- route or app-level language support for English and Hindi
- dictionary-based translation structure
- translatable navigation, labels, forms, status values, and system messages
- support for mixed-language content where vehicle data itself may remain as entered
- persistent user language preference

## Data Model Outline

### Core Tables

- `users`
- `user_profiles`
- `role_permissions`
- `vehicles`
- `vehicle_listings`
- `vehicle_media`
- `vehicle_documents`
- `vehicle_costs`
- `seller_submissions`
- `inquiries`
- `reservation_requests`
- `reservation_waitlist`
- `sales`
- `resale_requests`
- `chat_threads`
- `chat_participants`
- `chat_messages`
- `chat_voice_notes`
- `activity_logs`

### Important Relationships

- one vehicle can have many listings over time
- one listing can have many media items
- one listing can have many inquiries
- one listing can have many reservation requests
- one reserved listing can have many waitlist entries
- one sold listing can have many resale requests over time
- one user can participate in many chat threads
- one vehicle listing can have many vehicle-specific chat threads
- one chat thread can have many messages
- one chat message can optionally have one voice-note attachment

## Search And Filtering

MVP filters should include:

- make
- model
- year
- fuel type
- transmission
- body type
- location
- status

Price is intentionally not shown to normal users.

### Search Expectations

- global search in the app shell
- inventory search by make, model, year, registration, VIN, or stock identifier where available
- staff search for users, submissions, inquiries, and requests
- bilingual labels while preserving original underlying data values when needed

## UX Rules

- Do not show procurement or selling price to normal users
- Do not label listings as broker, consignment, or third-party
- Do not expose seller details to normal users
- Keep CTA language simple:
  - `Send inquiry`
  - `Reserve interest`
  - `Request resale`

### Status Communication

User-facing status presentation should be extremely clear:

- `Available` should feel active and actionable
- `Reserved` should remain visible but still support inquiry and waitlist-style reserve interest
- `Sold` should feel archival but still support resale requests

Color and badge design should help scan status quickly without relying on long text.

## Audit And Safety

Track key actions in an activity log:

- user approval
- role changes
- listing creation and edits
- status changes
- reservation approvals
- sold transitions
- resale approvals

This is important because listing status changes are manual and financially sensitive.

## Testing Focus

Critical test areas:

- approval-gated access
- restricted financial visibility
- manual status-change permissions
- reserve-interest request behavior
- waitlist behavior for reserved listings
- sold-to-resale relisting flow
- image access restrictions

## MVP Delivery Boundary

The MVP should stop at:

- private inventory portal
- internal operational dashboard
- seller intake
- inquiry flow
- reservation request and waitlist flow
- sold showcase
- resale request flow
- private storage with blurred images
- modern searchable operational UI
- full English and Hindi support

## Improvement Path After MVP

These should be considered after the first version proves the core workflow:

- VIN decode and auto-fill
- WhatsApp-first inquiry and follow-up flows
- richer notification center
- saved searches for users
- compare vehicles
- internal recon or service checklist workflows
- advanced profitability and aging reports
- AI-assisted listing copy and summarization
- PWA installability and stronger mobile task flows
- optional speech-to-text transcription for voice notes

## Deferred Features

- public marketplace
- public landing pages
- seller dashboards
- online token or deposit payments
- automated payout logic
- advanced reporting
- multi-tenant support
- mobile app
