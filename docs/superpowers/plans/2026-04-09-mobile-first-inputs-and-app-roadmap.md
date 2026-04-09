# 2026-04-09 Mobile-First Inputs And App Roadmap

## Intent

This roadmap captures the next-session product direction:

- input controls should match option size and complexity
- the web app must be optimized primarily for mobile users
- the architecture should stay compatible with future Android and iOS app packaging

## Status Update

Completed in the latest implementation pass:

- shared theme-safe shell controls and token cleanup across the main app shell
- mobile-first restructuring of the vehicle create/edit and seller-upload flows
- predictive pickers for make, model, variant, location, city, and inventory make filters
- mobile-safe seller submission queue cards and tighter chat composer layout

Still remaining from this roadmap:

- lower-priority admin route audit for spacing and localization
- formal PWA readiness checklist
- production data, private media, plate blur, and offline-queue follow-through

## Product Assumptions

- Real usage is expected to be 95%+ mobile.
- The current staff and user forms are too desktop-spaced and expose too many fields at once.
- The fastest correct mobile-app path is not a native rewrite right now. First stabilize the responsive web app and shared backend contracts, then package or bridge it cleanly.

## Input Strategy

### Use Predictive Inputs

Use searchable combobox or predictive typeahead when:

- the option list is long
- the option list grows over time
- the user likely knows part of the value but not the full list
- the field benefits from recent values, suggestions, or fuzzy matching

Priority fields:

- make
- model
- city
- location
- variant when variants are make/model dependent
- assign-to staff lists

Recommended behavior:

- search as you type
- show top suggestions first
- support keyboard and touch selection
- allow empty state and “no match” messaging
- support dependent lookups like `make -> model -> variant`

### Use Simple Dropdown Or Sheet Selection

Use a plain select, radio group, segmented control, or bottom sheet picker when:

- the set is short
- values are fixed
- users benefit from seeing all options at once

Priority fields:

- fuel type
- transmission
- body type
- status
- language
- theme or appearance options

## Mobile-First UI/UX Plan

### Immediate Design Rules

- Design for 360px to 430px widths first.
- Default to one-column forms on mobile.
- Keep primary actions reachable with the thumb zone.
- Use sticky bottom actions for save, submit, and continue on long forms.
- Replace large desktop card spacing with tighter, more intentional mobile spacing.
- Prefer progressive disclosure over dumping every field on one screen.
- Use bottom sheets for filters, actions, and short selections on mobile.
- Keep tap targets large and clearly separated.
- Reduce decorative background weight where it competes with form readability.

### Theme System Direction

The next UI pass should treat theme work as a shared system task, not isolated page polish.

Required outcomes:

- unify theme behavior across public auth pages and authenticated app pages
- remove fixed colors where they fight the active theme tokens
- keep all surfaces readable in light, dark, and accent variations
- make mobile forms, sheets, and cards the first contrast target
- reduce washed-out states on pale backgrounds and muddy states on dark backgrounds

Priority theme surfaces:

- auth shell and auth cards
- topbar and language or appearance controls
- add and edit vehicle flow
- mobile bottom sheets, selects, and dialogs
- inventory cards, filters, and empty states

Verification requirements:

- test at 360px to 430px widths first
- verify placeholder text, helper text, disabled states, and pressed states
- verify Hindi and English both remain readable
- verify the deployed Vercel build after any theme token change

### Critical Flows To Rework

1. Vehicle create and edit
2. User upload flow
3. Inventory filters and search
4. Vehicle detail CTA area
5. Chat thread list and composer
6. Staff queue actions

### Vehicle Form Direction

The vehicle form should be reworked into mobile-friendly sections:

1. Vehicle basics
2. Specs and registration
3. Notes and pricing
4. Photos
5. Review and save

Mobile improvements for this form:

- use predictive inputs for make and model
- keep fuel type, transmission, and status as simple pickers
- use numeric keyboards for year, mileage, and price
- keep upload camera-first and gallery-friendly
- add sticky save actions
- avoid showing all finance fields upfront when they are not needed

## Future Android And iOS Plan

### Recommended Path

Phase 1:

- finish the mobile-first responsive web app
- stabilize auth, uploads, chat, and offline expectations
- move business rules behind stable API contracts

Phase 2:

- harden the app as a strong installable PWA
- verify offline queue, caching, icons, splash, deep linking, and push-notification approach

Phase 3:

- package the web app for Android and iOS with a wrapper strategy such as Capacitor if the UX remains acceptable
- use native plugins only where needed: camera, file picker, push notifications, share, and secure storage

Phase 4:

- only consider a dedicated native app rewrite if the wrapper path fails on performance, navigation, offline, or device integrations

## Architecture Requirements For Future APK And IPA

- Keep auth flows adaptable to webview or native-shell redirects.
- Keep upload and media flows abstracted from browser-only APIs where possible.
- Keep route actions and domain logic separate from presentation.
- Keep form validation shared and schema-driven.
- Keep notification and deep-link behavior compatible with app entry points.
- Avoid tying critical business logic to DOM-specific state handling.

## Next Session Execution Order

1. Run a shared theme-system pass across auth and core app surfaces, starting with mobile contrast and token consistency.
2. Rework the add/edit vehicle form for mobile-first layout and smarter inputs.
3. Introduce predictive make/model selection and simple pickers for short enums.
4. Audit the highest-traffic mobile screens and tighten spacing, actions, and hierarchy.
5. Define the PWA-to-APK/IPA readiness checklist and identify current blockers.

## Known Current Gaps

- Add vehicle is still desktop-shaped and too sparse on wide screens while also being too heavy for phones.
- Long-text and numeric fields are not yet tuned for mobile keyboards and progressive disclosure.
- Predictive selection is not implemented for large option sets.
- The app does not yet have a documented PWA readiness checklist for future packaging.
- Theme behavior is improved but still not fully unified across all surfaces, especially after deployment and on smaller mobile screens.
