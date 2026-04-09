<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product Direction

- Mobile-first is a hard product constraint. Assume 95%+ of real usage is on phones unless a task explicitly says otherwise.
- Design and verify core flows at small mobile widths first, especially login, inventory browsing, vehicle detail, chat, profile, upload, and staff review flows.
- Large or growing option sets must use predictive search inputs or combobox-style selection. Examples: make, model, city, location, and any long assignment list.
- Small, fixed option sets should stay simple. Use dropdowns, segmented controls, radios, or sheets for fields such as fuel type, transmission, body type, and status.
- Forms should minimize typing on mobile. Prefer step-based or grouped flows, thumb-friendly actions, and the right keyboard/input mode for numeric or phone fields.
- Keep future Android and iOS packaging viable. Avoid web-only assumptions in business logic, file flows, auth flows, and navigation when a shared mobile shell or native wrapper is likely later.
- When planning major UI work, include a note on whether the change is compatible with a future PWA-to-APK/IPA path and what blockers remain.
- For public or auth-facing routes, do not mix fixed light backgrounds with theme-token text colors. Keep the full surface theme-aware or explicitly set both background and foreground together.
- Theme work should be system work, not one-off color patches. Prefer updating shared tokens, surfaces, and states before touching individual screens.
- When changing themes, verify contrast and readability on mobile first across auth, forms, sheets, cards, inputs, and empty states.
