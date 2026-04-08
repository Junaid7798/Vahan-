# Vehicle Inventory Portal Screen Architecture

## Purpose

This document translates the approved MVP design into screen-by-screen application architecture for a desktop-first web app with responsive mobile support.

It covers:

- routes
- navigation
- screen purpose
- sections
- fields
- buttons
- actions
- role visibility
- status transitions
- key states
- bilingual behavior

## Assumptions

- first visit auto-detects browser language
- users can manually switch between English and Hindi at any time
- after login, language preference persists per user
- all inventory is private and visible only to approved users
- all financial data remains hidden from `User`
- `Admin` can grant or revoke manager financial visibility

## Roles

- `Admin`
- `Manager`
- `User`

## Global App Rules

### Visibility Rules

- only approved users can access the main app
- only `Admin` and `Manager` can change vehicle listing status
- only `Admin` can approve or reject users
- only `Admin` and `Manager` can access staff operations modules
- only `Admin`, and optionally `Manager`, can see financial fields

### Language Rules

- every navigation label, filter label, button, form label, status badge, empty state, validation error, and toast must be translated
- free-text business data such as vehicle notes can remain in the language entered by staff
- status badges must stay semantically identical across English and Hindi

### UI Rules

- desktop-first layout
- responsive mobile support
- clear hierarchy over decorative density
- status and actions must be obvious on first scan
- no price shown to normal users
- no broker/source explanation shown to normal users

## Information Architecture

### Public Auth Shell

- `/login`
- `/signup`
- `/forgot-password`
- `/pending-approval`
- `/access-denied`

### Main App Shell

- `/app`
- `/app/inventory`
- `/app/reserved`
- `/app/sold`
- `/app/inquiries`
- `/app/chat`
- `/app/chat/[threadId]`
- `/app/my-requests`
- `/app/profile`

### Staff Modules

- `/app/admin/users`
- `/app/admin/vehicles`
- `/app/admin/seller-submissions`
- `/app/admin/reservation-requests`
- `/app/admin/waitlist`
- `/app/admin/resale-requests`
- `/app/admin/chat`
- `/app/admin/settings`

## Navigation Architecture

### Top Bar

Visible after login.

Elements:

- brand mark
- global command/search trigger
- notification bell
- profile menu

Actions:

- brand mark -> go to role default home
- command/search -> open quick action modal
- notification bell -> open latest actionable events
- profile menu -> profile, language, logout

### Left Sidebar

#### User

- Dashboard
- Inventory
- Reserved
- Sold
- Chat
- Inquiries
- My Requests
- Profile

#### Manager

- Dashboard
- Inventory
- Reserved
- Sold
- Chat Inbox
- Inquiries
- My Requests
- Users
- Vehicle Management
- Seller Submissions
- Reservation Requests
- Waitlist
- Resale Requests
- Settings

#### Admin

Same as Manager, plus full settings and permission control.

### Global Command/Search

Purpose:

- quick navigation
- search vehicles, users, requests, inquiries
- run quick actions

Primary commands:

- go to dashboard
- open inventory
- create vehicle
- open pending approvals
- open reservation requests
- search vehicle by make/model/VIN/stock id
- search user by name/email
- open chat inbox
- open support chat

Role-aware behavior:

- user sees only user actions
- manager/admin see operational actions

## Screen Specifications

## 1. Login

Route: `/login`

Purpose:

- authenticate existing users

Sections:

- app identity block
- login form
- language switcher
- support/help text

Fields:

- email
- password

Buttons:

- `Log in`
- `Forgot password`
- `Create account`
- language switch buttons

Actions:

- `Log in` -> authenticate and route by approval status
- `Forgot password` -> go to reset flow
- `Create account` -> go to sign up
- language switch -> update locale immediately

States:

- empty
- loading
- invalid credentials
- account pending approval
- account rejected

Mobile notes:

- single-column layout
- sticky login button only if form height requires it

## 2. Sign Up

Route: `/signup`

Purpose:

- create a new user account for later admin approval

Sections:

- app intro
- sign-up form
- approval notice

Fields:

- full name
- email
- phone
- city
- password
- confirm password

Buttons:

- `Create account`
- `Back to login`
- language switch buttons

Actions:

- submit -> create account with `pending_approval`
- on success -> redirect to pending approval screen
- language switch -> update locale immediately

Validation:

- required fields
- valid email
- phone format
- password minimum length
- matching passwords

States:

- empty
- validation error
- loading
- success

## 3. Forgot Password

Route: `/forgot-password`

Purpose:

- request password reset

Fields:

- email

Buttons:

- `Send reset link`
- `Back to login`
- language switch buttons

Actions:

- send reset email
- language switch -> update locale immediately

States:

- empty
- success
- email not found

## 4. Pending Approval

Route: `/pending-approval`

Purpose:

- explain that account exists but needs admin approval

Sections:

- status illustration/message
- what happens next
- support contact block

Buttons:

- `Refresh status`
- `Log out`
- language switch buttons

Actions:

- refresh -> recheck approval status
- logout -> end session
- language switch -> update locale immediately

## 5. Access Denied / Rejected

Route: `/access-denied`

Purpose:

- show account rejection or disabled-access message

Buttons:

- `Contact support`
- `Log out`

## 6. App Dashboard

Route: `/app`

Purpose:

- role-aware home screen

### User Dashboard

Sections:

- welcome header
- quick stats
- latest available vehicles
- latest reserved vehicles
- latest sold vehicles
- my recent inquiries
- my reservation requests

Cards:

- available count
- reserved count
- sold count
- my active requests count

Buttons:

- `Browse inventory`
- `View reserved`
- `View sold`
- `Open my requests`

Actions:

- card click -> filtered list screen

### Manager/Admin Dashboard

Sections:

- operations summary cards
- action-required queue
- recent inventory activity
- recent inquiries
- reservation review queue
- seller submission queue
- resale request queue

Cards:

- available listings
- reserved listings
- sold listings
- pending approvals
- pending reservation requests
- pending seller submissions
- pending resale requests

Buttons:

- `Approve users`
- `Review reservations`
- `Review seller submissions`
- `Review resale requests`
- `Add vehicle`

Actions:

- each CTA opens the related queue

## 7. Inventory List

Route: `/app/inventory`

Purpose:

- show available vehicles

Layout:

- page header
- sticky filter/search bar
- results area
- desktop grid/list toggle

Filters:

- make
- model
- year range
- fuel type
- transmission
- body type
- location

Controls:

- search input
- clear filters
- sort by newest / year / mileage
- view toggle grid/list

Vehicle card content:

- primary image
- make/model/year
- mileage
- fuel
- transmission
- location
- status badge
- short highlights

Buttons on card:

- `View details`
- `Send inquiry`
- `Reserve interest`

Actions:

- `View details` -> vehicle detail page
- `Send inquiry` -> inquiry modal
- `Reserve interest` -> reservation request modal

States:

- loading skeleton
- empty results
- error

Mobile notes:

- card-only layout
- filters open in sheet/drawer

## 8. Reserved List

Route: `/app/reserved`

Purpose:

- show reserved vehicles

Same structure as inventory list, but status locked to reserved.

Buttons:

- `View details`
- `Send inquiry`
- `Reserve interest`

Important behavior:

- reserve-interest here creates waitlist entry, not direct reservation request

## 9. Sold List

Route: `/app/sold`

Purpose:

- showcase sold inventory

Filters:

- make
- model
- year
- fuel type
- transmission
- body type
- sold date range

Card content:

- image
- make/model/year
- sold badge
- key specs
- sold-on metadata if desired for staff only

Buttons:

- `View details`
- `Send inquiry`
- `Request resale`

Actions:

- resale -> resale request modal

## 10. Vehicle Detail

Route: `/app/vehicles/[listingId]`

Purpose:

- show one listing in detail

Sections:

- gallery
- title/spec summary
- status badge
- highlights
- detailed specs
- condition/notes
- actions panel
- related activity summary for staff

Visible fields for all approved users:

- make
- model
- year
- variant
- color
- mileage
- fuel type
- transmission
- registration year if allowed
- location
- condition notes
- gallery

Hidden from normal users:

- procurement price
- extra spend
- internal selling price
- margin
- source ownership details

User buttons:

- `Send inquiry`
- `Reserve interest`
- `Request resale` when status is sold
- `Back to list`

Manager/Admin extra buttons:

- `Edit listing`
- `Change status`
- `Open financials`
- `Open activity`
- `Manage photos`
- `Archive`

Status-specific actions:

- available -> inquiry + reservation request
- reserved -> inquiry + waitlist reservation request
- sold -> inquiry + resale request

Desktop notes:

- right-side sticky action panel
- thumbnail rail or gallery strip

Mobile notes:

- action block below hero image
- sections collapse into stacked cards

## 11. Inquiry Modal

Opened from:

- inventory card
- reserved card
- sold card
- vehicle detail

Fields:

- subject
- message
- preferred contact method
- preferred contact time

Prefill:

- listing reference
- current user info

Buttons:

- `Send inquiry`
- `Cancel`

Actions:

- create inquiry record
- notify staff
- show success toast

States:

- submitting
- success
- validation error

## 12. Reserve Interest Modal

Opened from:

- available listing
- reserved listing

Purpose:

- capture reservation intent

Fields:

- contact confirmation
- short message
- optional preferred inspection date

Dynamic helper text:

- available listing -> explains admin/manager review is required
- reserved listing -> explains user joins waitlist

Buttons:

- `Submit request`
- `Cancel`

Actions:

- available -> create `reservation_request`
- reserved -> create `waitlist_entry`

## 13. Resale Request Modal

Opened from sold listing.

Fields:

- contact confirmation
- resale interest message
- expected timeline

Buttons:

- `Submit resale request`
- `Cancel`

Actions:

- create resale request linked to sold listing and physical vehicle

## 14. Inquiries

Route: `/app/inquiries`

### User View

Purpose:

- show user-created inquiries

Columns:

- vehicle
- subject
- created at
- status
- last update

Buttons:

- `View inquiry`
- `Open vehicle`

### Staff View

Purpose:

- work inquiry queue

Filters:

- open
- contacted
- closed
- by vehicle
- by user

Buttons:

- `Open inquiry`
- `Mark contacted`
- `Close inquiry`
- `Open user`
- `Open listing`

Bulk actions:

- mark contacted
- close selected

## 14A. Chat

Route: `/app/chat` and `/app/chat/[threadId]`

### User View

Purpose:

- show general support chat and vehicle-specific chats

Thread types:

- general support
- vehicle-specific

Thread list content:

- thread title
- vehicle reference when applicable
- latest message preview
- unread count
- last updated

Buttons:

- `New support chat`
- `Open thread`

Thread view sections:

- header
- message timeline
- composer

Composer controls:

- message input
- `Send text`
- `Record voice`
- `Stop recording`
- `Send voice note`
- `Discard`

Rules:

- user can access only their own threads
- vehicle-specific chat can be opened from a vehicle detail page
- text and voice notes appear in the same timeline

### Staff View

Purpose:

- let Admin and Manager reply in the same thread

Staff thread actions:

- `Reply`
- `Record voice`
- `Close thread`
- `Open linked vehicle`
- `Open linked user`

## 15. My Requests

Route: `/app/my-requests`

Purpose:

- give user one place for reservation requests, waitlist entries, and resale requests

Tabs:

- reservation requests
- waitlist
- resale requests

Common columns:

- vehicle
- request type
- current status
- created at
- last update

Buttons:

- `View vehicle`
- `View request`

## 16. Profile

Route: `/app/profile`

Sections:

- account info
- contact details
- language preference
- password actions

Fields:

- full name
- phone
- city
- language

Buttons:

- `Save changes`
- `Change password`
- `Log out`

Actions:

- update profile
- update stored language preference from this settings/profile area only

## 17. Users Management

Route: `/app/admin/users`

Role:

- Admin only

Purpose:

- approve/reject/manage user accounts

Tabs:

- pending approval
- approved
- rejected
- disabled

Table columns:

- name
- email
- phone
- city
- role
- approval status
- created at

Buttons per row:

- `Approve`
- `Reject`
- `Disable`
- `Enable`
- `Edit role`
- `View details`

Bulk actions:

- approve selected
- reject selected
- disable selected

User detail drawer:

- profile info
- account history
- inquiry count
- reservation count
- waitlist count

## 18. Vehicle Management

Route: `/app/admin/vehicles`

Role:

- Manager and Admin

Purpose:

- create and manage all listings

Tabs:

- draft
- available
- reserved
- sold
- archived

Controls:

- search
- saved views
- filters
- export if added later

Columns:

- stock id
- make/model/year
- status
- location
- updated at
- inquiry count
- request count

Staff row buttons:

- `Open`
- `Edit`
- `Change status`
- `Manage photos`
- `Open financials`
- `Archive`

Primary page buttons:

- `Add vehicle`
- `Import seller submission`

### Add/Edit Vehicle Form

Sections:

- core vehicle info
- listing info
- specs
- notes
- hidden financials
- photo upload
- documents

Core fields:

- VIN
- stock id
- make
- model
- year
- variant
- color
- mileage
- fuel type
- transmission
- body type
- registration year
- location
- highlights
- condition notes

Hidden financial fields:

- procurement price
- target selling price
- extra spend total
- maintenance cost
- documentation cost
- transport cost
- other cost

Buttons:

- `Save draft`
- `Publish as available`
- `Update`
- `Cancel`

Rules:

- only manager/admin can create/edit
- financial section hidden if no permission

## 19. Seller Submissions

Route: `/app/admin/seller-submissions`

Role:

- Manager and Admin

Purpose:

- review incoming seller-submitted vehicles

Table columns:

- seller name
- phone
- vehicle summary
- submission date
- status

Buttons:

- `Preview`
- `Approve and create listing`
- `Request changes`
- `Reject`

Preview drawer content:

- seller info
- vehicle info
- uploaded images
- notes

Actions:

- approve -> opens vehicle create flow prefilled from submission
- request changes -> internal note or seller follow-up record
- reject -> marks submission closed

## 20. Reservation Requests

Route: `/app/admin/reservation-requests`

Role:

- Manager and Admin

Purpose:

- review reservation requests for available listings

Columns:

- vehicle
- requester
- request date
- current listing status
- priority

Buttons:

- `Approve reservation`
- `Reject request`
- `View requester`
- `Open listing`

Approve action behavior:

- set listing status to `reserved`
- connect reservation to winning requester
- notify all relevant users

Reject action behavior:

- close request with reason

## 21. Waitlist

Route: `/app/admin/waitlist`

Role:

- Manager and Admin

Purpose:

- manage reserve-interest entries on already reserved listings

Columns:

- vehicle
- requester
- waitlist position
- created at
- current reservation owner

Buttons:

- `Promote to active reservation`
- `Remove from waitlist`
- `Open listing`
- `Open requester`

Rules:

- promotion should only happen when current reservation is released or admin chooses override

## 22. Resale Requests

Route: `/app/admin/resale-requests`

Role:

- Manager and Admin

Purpose:

- review requests to relist sold vehicles

Columns:

- sold vehicle
- requester
- request date
- resale status

Buttons:

- `Approve resale`
- `Reject resale`
- `Create relisting`
- `Open original sale`

Approval flow:

- approve request
- create a new listing record linked to same vehicle
- default new listing status to draft or available based on staff choice

## 22A. Chat Inbox

Route: `/app/admin/chat`

Role:

- Manager and Admin

Purpose:

- central inbox for support and vehicle-specific conversations

Filters:

- all
- unread
- support
- vehicle chat
- assigned to me

Columns/cards:

- user
- thread type
- vehicle reference when applicable
- last message preview
- unread count
- updated at

Buttons:

- `Open thread`
- `Assign to me`
- `Mark unread`
- `Close thread`

Rules:

- both Admin and Manager can reply
- only staff can access inbox-level controls
- thread history remains shared between user and staff

## 23. Settings

Route: `/app/admin/settings`

### Manager

Limited access:

- operational preferences if allowed

### Admin

Full access:

- role permission switches
- manager financial visibility
- app language defaults
- inquiry/reservation notification settings

Sections:

- roles and permissions
- financial visibility
- notification preferences
- localization defaults

Buttons:

- `Save settings`
- `Reset section`

## Notifications

Purpose:

- show new inquiries
- new reservation requests
- new seller submissions
- approved/rejected user accounts
- waitlist promotions
- resale request decisions
- new chat messages

Notification actions:

- `Open`
- `Mark as read`
- `Mark all read`

## Empty / Loading / Error States

Every list screen must support:

- loading skeleton
- empty state with explanatory text
- retryable error state

Examples:

- no available vehicles
- no pending approvals
- no reservation requests
- no inquiries yet
- no chat threads yet

## Status System

### Listing Statuses

- Draft
- Available
- Reserved
- Sold
- Archived

### Request Statuses

- Pending
- Approved
- Rejected
- Closed

### Approval Statuses

- Pending Approval
- Approved
- Rejected
- Disabled

### Chat Thread Statuses

- Open
- Unread
- Closed

### Chat Message Types

- Text
- Voice Note

## Allowed Status Transitions

### Listing

- draft -> available
- available -> reserved
- available -> sold
- reserved -> available
- reserved -> sold
- sold -> archived
- archived -> draft

Only Admin/Manager can perform these.

### Reservation Request

- pending -> approved
- pending -> rejected
- approved -> closed
- rejected -> closed

### Waitlist

- waiting -> promoted
- waiting -> removed

### Resale Request

- pending -> approved
- pending -> rejected
- approved -> relisted

### Chat Thread

- open -> unread
- unread -> open
- open -> closed

Only Admin/Manager can close a thread.

## Role-Based Field Visibility

### Hidden From User

- procurement price
- cost breakdown
- target selling price
- final selling price
- margin
- seller ownership/source details
- internal notes
- admin activity history
- staff chat assignment fields

### Manager

- all operational fields
- financial fields only if permission enabled
- full chat inbox access

### Admin

- all fields

## Responsive Rules

### Desktop

- sidebar always visible
- tables are primary in staff workflows
- detail drawers and split layouts are allowed
- chat can use split inbox/thread layout

### Tablet

- sidebar collapses
- dense tables become horizontally scrollable or simplified

### Mobile

- filters move to drawer
- cards replace tables where needed
- quick actions collapse into menus
- sticky action bars allowed on detail screens

## Component-Level Requirements

### Common Components

- sidebar
- top bar
- language switcher
- command palette
- data table
- status badge
- filter bar
- quick preview drawer
- confirmation dialog
- media gallery
- inquiry modal
- reservation modal
- resale modal
- chat thread list
- chat composer
- voice-note recorder
- voice-note player

### Component Expectations

- status badge colors must be consistent across screens
- dialogs must support translated copy
- tables must support loading, empty, and error variants
- forms must support inline validation and success toasts
- chat controls must work for both text and voice-note messages

## Accessibility Rules

- every field needs a proper label
- validation messages should be clear and translated
- buttons must have clear action text
- dialogs need focus trapping
- status changes and submissions need visible success/error feedback
- voice-note controls must not rely on icon-only interaction

## Suggested Build Order

1. auth shell
2. app shell and navigation
3. inventory list and detail
4. inquiry flow
5. chat and voice-note flow
6. reservation request flow
7. role-aware dashboard
8. admin user approval
9. vehicle management
10. seller submissions
11. waitlist and resale workflows
12. settings and permission refinement
13. polish, bilingual completion, responsive QA
