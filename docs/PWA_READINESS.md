# PWA Readiness Checklist

## Current State

- Manifest exists in [manifest.ts](/e:/Project/Vahan/src/app/manifest.ts).
- Service worker generation is enabled through Serwist in [next.config.ts](/e:/Project/Vahan/next.config.ts).
- The app shell shows online and offline state through [online-status-indicator.tsx](/e:/Project/Vahan/src/components/online-status-indicator.tsx).
- IndexedDB-backed pending-action storage exists in [db.ts](/e:/Project/Vahan/src/lib/offline/db.ts).
- User-facing inquiry, reservation, resale, and chat-message actions now queue while offline and replay through `/api/portal` when connectivity returns.

## Still Required Before APK or IPA Packaging

1. Add a real app icon set in PNG sizes for Android and iOS install surfaces.
2. Add splash-screen assets and verify brand-safe launch screens in a wrapper shell.
3. Verify service-worker precache coverage for the real mobile critical path:
   - login
   - inventory list
   - vehicle detail
   - chat workspace
   - my requests
4. Add an explicit sync-state UI for queued actions, not just the top offline banner.
5. Add end-to-end offline tests for:
   - create inquiry
   - create reservation or waitlist intent
   - create resale request
   - send chat message
6. Confirm auth-session recovery after app resume and wrapper restarts.
7. Decide the packaging path:
   - PWA only
   - Trusted Web Activity for Android
   - Capacitor or similar wrapper for Android and iOS
8. Validate device integrations that may force a wrapper or native surface later:
   - push notifications
   - share targets
   - camera or file picking edge cases
   - background sync expectations

## Known Wrapper Blockers

- There is no push-notification implementation yet.
- There is no install-prompt or app-installed analytics flow yet.
- There is no mobile-specific queued-action history or retry UI yet.
- Offline mutation coverage is intentionally limited to the main user actions and does not include staff moderation flows.
- Real deployment validation against production Supabase auth and storage has not been run from a packaged shell.

## Recommended Next Step

Use the current web app as the source of truth, finish offline E2E coverage, then validate a thin wrapper path before considering any larger native rewrite.
