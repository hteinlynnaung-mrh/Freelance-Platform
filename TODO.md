# Archer project TODO

This checklist reflects the current repository state. Checked items are implemented; unchecked items are missing or partially implemented. Keep it synchronized with SPEC.md.

## Implemented foundation

- [x] Web app in app/ with React, Vite, React Router, TanStack React Query, and shadcn-compatible UI.
- [x] API in api/ with Express, TypeScript, SQLite, Prisma 7, JWT auth, Zod validation, Helmet, CORS, request IDs, and health/readiness routes.
- [x] Expo mobile app in mobile/ with Expo Router, NativeWind, TanStack Query, secure token storage, and English/Japanese i18n.
- [x] Local Vite proxy from web port 5000 to API port 5001.
- [x] Seeded data: 50 clients, 100 freelancers, 250 projects, categories, skills, and demo credentials.
- [x] Public landing page, project marketplace, project detail, responsive navigation, and registration/sign-in screens.
- [x] English/Japanese locale switching across primary web and mobile flows.
- [x] USD and JPY validation, seed data, filtering, and formatting; JPY uses ¥ and no decimal places.
- [x] Web light/dark theme persistence and dark variants for audited landing/project/navigation surfaces.
- [x] Web authenticated requests attach the access token.
- [x] Web sign-in/register store the user and tokens, restore the navbar account, and provide sign-out.
- [x] Mobile restores the user, refreshes expired access tokens, and clears failed sessions.
- [x] API routes for profiles, projects, saved projects, proposals, engagements, conversations, notifications, and reviews.
- [x] API tests for health and request-boundary validation/authorization.
- [x] Docker files removed; local development uses Node/npm commands.

## Highest-priority unfinished work

### Authentication and authorization

- [ ] Add automatic access-token refresh to the web client, matching mobile behavior.
- [ ] Add protected web routes that preserve the intended destination and enforce role-aware navigation.
- [ ] Add session-expiry messaging and consistent unauthorized-query recovery in the web app.
- [ ] Add password reset, email verification, and account settings flows.

### Client experience

- [ ] Build a client dashboard with project overview, proposals, engagements, and notifications.
- [ ] Build a client project editor with draft validation, category/skills, budget, currency, deadline, and publish controls.
- [ ] Add web project edit, pause, close, archive, and delete screens.
- [ ] Add web proposal review with shortlist, reject, accept, and ownership-aware states.
- [ ] Add web engagement management and client profile/settings screens.

### Freelancer experience

- [ ] Build a web freelancer dashboard for proposals and engagements.
- [ ] Build web freelancer profile editing for headline, bio, rates, availability, skills, and portfolio.
- [ ] Build web proposal submission, withdrawal, and status screens.
- [ ] Add web engagement delivery, completion, and cancellation screens.
- [x] Provide mobile freelancer/project/proposal/engagement screens for the current API slice.

### Marketplace parity

- [x] Web project search, category filtering, USD/JPY filtering, pagination metadata, loading, empty, retry, and expandable result states.
- [x] Web and mobile save/unsave API integration.
- [ ] Add web budget-range, budget-type, skill, experience, and status controls.
- [ ] Add sorting and saved-search support.
- [ ] Add a complete web apply flow; the current web detail button routes to sign-in while mobile has proposal submission UI.
- [ ] Add optimistic save updates and clearer save error recovery.

### Messaging, notifications, and trust

- [x] API conversations, messages, notifications, and reviews.
- [x] Mobile screens for conversations, notifications, and related API data.
- [ ] Build web conversation list and message thread UI.
- [ ] Build web notification center with read/unread state and preferences.
- [ ] Add real-time updates or a documented polling strategy.
- [ ] Build web review forms, public review display, and report-content flows.

## API and data platform backlog

- [ ] Publish a complete OpenAPI contract beside the routes.
- [ ] Add rate limiting for authentication, messaging, and report endpoints.
- [ ] Add centralized audit-event writes and an admin audit view.
- [ ] Add production-strength secret management, CORS configuration, token policy, and security monitoring.
- [ ] Standardize pagination/filtering metadata across every list endpoint.
- [ ] Add transactional email, background jobs, file/image storage, and database backup/restore.
- [ ] Add a production migration/seed policy that cannot target live data accidentally.
- [ ] Expand API tests to cover all role/ownership checks and lifecycle transitions.

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

- [ ] Add web unit/component tests and route tests.
- [ ] Add web end-to-end smoke tests for sign-in, account navigation, search/filtering, save/unsave, and dark mode.
- [ ] Add mobile interaction tests and build verification on both platforms.
- [ ] Add CI for app/API/mobile typechecks, tests, builds, and dependency audits.
- [ ] Add production hosting, environment separation, secret management, HTTPS, monitoring, logs, alerts, and rollback instructions.

## Suggested order

1. Add web token refresh, protected routes, and role-aware navigation.
2. Build client project creation and freelancer proposal flows on the web.
3. Build web dashboards, proposal acceptance, engagements, messaging, notifications, and reviews.
4. Expand API authorization tests, accessibility checks, and automated browser/mobile coverage.
5. Add production operations and deployment safeguards.
6. Consider payment features only after the marketplace lifecycle and security are stable.
