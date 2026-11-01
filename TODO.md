# Archer project TODO

This checklist reflects the current repository state. Checked items are implemented; unchecked items are missing or partially implemented. Keep it synchronized with SPEC.md.

## Implemented foundation

- [x] Web app in app/ with React, Vite, React Router, TanStack React Query, and shadcn-compatible UI.
- [x] API in api/ with Express, TypeScript, SQLite, Prisma 7, JWT auth, Zod validation, Helmet, CORS, request IDs, and health/readiness routes.
- [x] Expo mobile app in mobile/ with Expo Router, NativeWind, TanStack Query, secure token storage, and English/Japanese i18n.
- [x] Local Vite proxy from web port 5000 to API port 5001.
- [x] Seeded data: 50 clients, 100 freelancers, 250 projects, 8 categories, 20 skills, and demo credentials.
- [x] Public landing page, project marketplace, project detail, responsive navigation, and registration/sign-in screens.
- [x] English/Japanese locale switching across primary web and mobile flows.
- [x] USD and JPY validation, seed data, filtering, and formatting; JPY uses ¥ and no decimal places.
- [x] Web light/dark theme persistence and dark variants for audited landing/project/navigation surfaces.
- [x] Web authenticated requests attach the access token.
- [x] Web sign-in/register store the user and tokens, restore the navbar account, and provide sign-out.
- [x] Unique account usernames with email-or-username sign-in and an `@username` navbar account label.
- [x] Web automatic access-token refresh (401 → refresh → retry, serialized) mirroring mobile behavior.
- [x] Web protected routes (`ProtectedRoute`) with intended-destination return and role-aware redirects.
- [x] Web freelancer apply flow on project detail (amount, cover letter, duration) with existing-proposal status.
- [x] Web "My applications" page at /account/applications with proposal status mapping.
- [x] Web account settings at /account/settings with account overview and delete-account confirmation.
- [x] Mobile restores the user, refreshes expired access tokens, and clears failed sessions.
- [x] Mobile resolves the API base URL per runtime: localhost on iOS/web, 10.0.2.2 on the Android emulator, and the Metro dev-server LAN IP on physical devices, with EXPO_PUBLIC_API_URL as an override.
- [x] Mobile light/dark/system appearance with a persisted three-way toggle in Profile, a quick moon/sun button on sign-in, and dark variants across screens, cards, forms, tab bar, and status bar.
- [x] Mobile home overview with active engagements, recent proposals, and notification count.
- [x] API routes for profiles, projects, saved projects, proposals, engagements, conversations, notifications, reviews, and account deletion.
- [x] API tests for health, request-boundary validation/authorization, and project listing/currency rules.
- [x] Unit tests: web (money, proposal status mapping, en/ja key parity), mobile (API host resolution, en/ja key parity).
- [x] Docker files removed; local development uses Node/npm commands.

## Highest-priority unfinished work

### Authentication and authorization

- [ ] Add session-expiry messaging and consistent unauthorized-query recovery in the web app.
- [ ] Add password reset, email verification, and profile-editing flows on the web.

### Client experience

- [ ] Build a real client dashboard; /dashboard is currently a role-based placeholder.
- [ ] Build a client project editor with draft validation, category/skills, budget, currency, deadline, and publish controls. No project-creation UI exists in either client yet — only the API supports it.
- [ ] Add web project edit, pause, close, archive, and delete screens.
- [ ] Add web proposal review with shortlist, reject, accept, and ownership-aware states (mobile already has these actions).
- [ ] Add web engagement management and client profile/settings screens.

### Freelancer experience

- [ ] Build a web freelancer dashboard for proposals and engagements.
- [ ] Build web freelancer profile editing for headline, bio, rates, availability, skills, and portfolio.
- [ ] Add web proposal withdrawal and status-management screens; submission and status viewing already exist.
- [ ] Add web engagement delivery, completion, and cancellation screens.
- [x] Provide mobile freelancer/project/proposal/engagement screens for the current API slice.

### Marketplace parity

- [x] Web project search, category filtering, USD/JPY filtering, pagination metadata, loading, empty, retry, and expandable result states.
- [x] Web and mobile save/unsave API integration.
- [x] Web apply flow from project detail with proposal submission.
- [ ] Add web budget-range, budget-type, skill, experience, and status controls.
- [ ] Add sorting and saved-search support.
- [ ] Add optimistic save updates and clearer save error recovery.

### Messaging, notifications, and trust

- [x] API conversations, messages, notifications, and reviews.
- [x] Mobile screens for conversations, notifications, and related API data.
- [ ] Build web conversation list and message thread UI.
- [ ] Build web notification center with read/unread state and preferences.
- [ ] Add real-time updates or a documented polling strategy.
- [ ] Build web review forms, public review display, and report-content flows.
- [ ] Build the mobile review screen; the API routes and en/ja review strings already exist.

## API and data platform backlog

- [ ] Publish a complete OpenAPI contract beside the routes (api/API.md is hand-maintained).
- [ ] Add rate limiting for authentication, messaging, and report endpoints.
- [ ] Add routes and admin views for the existing Report and AuditEvent models (no endpoints exist yet).
- [ ] Add centralized audit-event writes.
- [ ] Add production-strength secret management, CORS configuration, token policy, and security monitoring.
- [ ] Standardize pagination/filtering metadata across every list endpoint.
- [ ] Add transactional email, background jobs, file/image storage, and database backup/restore.
- [ ] Add a production migration/seed policy that cannot target live data accidentally.
- [ ] Expand API tests to cover all role/ownership checks and lifecycle transitions.

## Repository hygiene

- [ ] Remove the accidental root `package.json` dependency named `20` (result of `npm i 20`).
- [ ] Delete or wire up unrouted legacy web pages: `app/src/pages/HomePage.tsx`, `LoginPage.tsx`, `ProjectDetailPage.tsx`.

## Payments and finance — explicitly out of scope for the current MVP

- [ ] Payment provider integration.
- [ ] Escrow, milestones, invoices, receipts, payouts, withdrawals, refunds, disputes, and webhooks.
- [ ] Automatic USD/JPY conversion or live exchange-rate retrieval.

## Internationalization and accessibility

- [ ] Translate dynamic project/category/skill/profile content where product content is localized.
- [ ] Translate API validation/error messages where required by clients.
- [ ] Review Japanese copy with a native speaker and add locale-aware date/number tests.
- [ ] Add translation coverage checks for new user-facing strings.
- [ ] Add automated contrast/accessibility checks for both web themes.
- [ ] Add keyboard, focus, screen-reader, and responsive reviews across all web routes.

## Testing and operations

- [ ] Add web component/route tests beyond the current money, proposal, and translation unit tests.
- [ ] Add web end-to-end smoke tests for sign-in, account navigation, search/filtering, save/unsave, and dark mode.
- [ ] Add mobile interaction tests and build verification on both platforms.
- [ ] Add CI for app/API/mobile typechecks, tests, builds, and dependency audits (no CI configuration exists yet).
- [ ] Add production hosting, environment separation, secret management, HTTPS, monitoring, logs, alerts, and rollback instructions.

## Suggested order

1. Build client project creation/editing and web proposal review so the marketplace lifecycle can be exercised end to end.
2. Build web dashboards, engagements, messaging, notifications, and reviews to reach mobile parity.
3. Add the mobile review screen and profile editing on the web.
4. Expand API authorization tests, accessibility checks, and automated browser/mobile coverage; add CI.
5. Clean up repository hygiene items and add production operations and deployment safeguards.
6. Consider payment features only after the marketplace lifecycle and security are stable.
