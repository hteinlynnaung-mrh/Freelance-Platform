# Archer — Current Project Specification

## 1. Document status

- Product: Archer freelance marketplace foundation
- Repository state: local MVP vertical slice with web, API, and mobile projects
- Status: this document describes the current code; the roadmap describes unfinished work
- Runtime: Node 24.19.x, npm, SQLite for local development
- Integration boundary: REST-style JSON under /api/v1

This is a living contract for the code in this repository. Update it when routes, data rules, or runnable projects change.

## 2. Repository structure

    .
    ├── app/        React + Vite website
    ├── api/        Express + Prisma + SQLite service (api/API.md holds the HTTP contract)
    ├── mobile/     Expo React Native application
    ├── README.md   repository setup and runbook
    ├── SPEC.md     architecture and product contract
    ├── TODO.md     implementation status and roadmap
    ├── AGENTS.md   contributor instructions for AI agents and humans
    └── CLAUDE.md   Claude-compatible pointer to AGENTS.md conventions

Each project has its own package manifest, lockfile, TypeScript configuration, environment example, and development command. There is no Docker-based runtime and the projects are not npm workspaces; the root package.json has no orchestration scripts.

## 3. Technology and runtime

### Web: app/

React 18, TypeScript, Vite, React Router, TanStack React Query, Tailwind CSS v4/shadcn-compatible primitives, Lucide icons, a persisted theme provider, and English/Japanese locale dictionaries.

Routes mounted by app/src/App.tsx:

| Route | Behavior |
| --- | --- |
| / | Landing page with hero, showcase, calls to action, and feature sections |
| /projects | Searchable project marketplace with category/currency filters and paged results |
| /projects/:id | Published project detail with the freelancer apply form (amount, cover letter, duration) |
| /login | Email/password sign-in |
| /register | Client/freelancer registration |
| /account/applications | Protected (FREELANCER): list of the signed-in freelancer's proposals with status |
| /account/settings | Protected: account overview (email, username, role) and delete-account confirmation; /account redirects here |
| /dashboard | Temporary authenticated placeholder that redirects by role; not a real dashboard yet |
| * | Redirects to / |

The web client uses the Vite /api proxy locally. VITE_API_URL may point at a remote API when intentionally configured.

### API: api/

Express 5, TypeScript, Helmet, CORS, JSON request limits, request IDs, Prisma 7 with the better-sqlite3 adapter, Zod validation, JWT access tokens, and rotating hashed opaque refresh tokens. The API listens on port 5001.

### Mobile: mobile/

Expo SDK 58, Expo Router, React Native, NativeWind v4, TanStack React Query, English/Japanese i18n, and Expo Secure Store. EXPO_PUBLIC_API_URL optionally overrides the API address; when empty, mobile/src/api/config.ts derives the host from the Metro dev server (localhost on iOS/web, 10.0.2.2 on the Android emulator, the LAN IP on a physical device) and the API port defaults to 5001. Development clients are Expo Go for SDK 58 on both simulator and emulator. Appearance is a persisted Light/Dark/System switch (Profile tab and sign-in screen) backed by src/theme/ThemeProvider.tsx and NativeWind's colorScheme API.

## 4. Implemented product behavior

### Public marketplace

- Guests can browse published projects, search title/description/category/skill text, view details, and filter by category or USD/JPY.
- Web results start with six cards and can expand to the API maximum of 50; the control changes to View less when expanded.
- Project cards display the stored currency symbol. JPY uses ¥ with no decimal places; USD uses $ with no decimal places in the current UI.
- Authenticated users can save or unsave projects. Guests are sent to sign-in with the intended project path.
- The web detail page includes a freelancer apply form (amount, cover letter, optional duration) that submits a proposal and links to `/account/applications`; sign-in state and existing-proposal status are shown in place of the form.
- Mobile supports project search, currency/category filtering, details, apply, and save/unsave mutations.

### Authentication and sessions

- API registration supports CLIENT and FREELANCER roles and assigns every account a unique username (3–30 letters, numbers, or underscores). When a client omits the username, the API derives a unique handle from the email so mobile and older clients keep working.
- Sign-in accepts either `email` or `username` together with the password; `POST /api/v1/auth/login` returns the user (including `username`), an access token, and a refresh token.
- Web sign-in/register persist tokens and user data in browser localStorage. The navbar restores the account from storage or /api/v1/auth/me, shows `@username` (falling back to the email for accounts without one), and provides sign-out.
- Mobile sign-in/register persist tokens in Expo Secure Store, restore /auth/me, refresh an expired access token once, and clear the session when refresh fails.
- API authorization uses bearer access tokens, role checks, and ownership checks.
- Web clients are protected by a `ProtectedRoute` wrapper: unauthenticated visitors are sent to sign-in with the intended destination, and role-restricted routes (for example `/account/applications` for freelancers) redirect by role. The API's checks remain authoritative.
- The web API client performs transparent 401 → refresh → retry that mirrors the mobile client, serializing concurrent refresh attempts, and navbar navigation is role-aware (a Dashboard link appears for CLIENT accounts).

### Profiles and collaboration

- API profile read/update routes exist for the current user and public freelancer discovery/detail.
- API proposal routes support freelancer submission/withdrawal and client shortlist/reject/accept.
- Accepting a proposal transactionally creates an in-progress project, active engagement, conversation, and notifications.
- Engagement routes support list/detail, freelancer submit-for-review, client complete, and participant/admin cancel.
- Conversation routes support participant-scoped message reads and sending messages.
- Notification routes support listing and marking notifications read.
- Review routes support creation and public user review listing.
- The web client currently implements the marketplace, auth, apply, my applications, and account settings (including delete-account confirmation); it has no dashboard, engagement, messaging, notification, or review UI yet.
- Mobile has screens for a home overview, projects, freelancers, proposals (including client shortlist/reject/accept), engagements, messages, notifications, and profile editing. Mobile has no review screen yet even though the API and translation keys exist.

## 5. Domain model and status rules

The Prisma schema is the source of truth for fields and relations. Main entities are:

- User, RefreshToken, ClientProfile, FreelancerProfile
- Skill, ProfileSkill, PortfolioItem, Category
- Project, ProjectSkill, SavedProject, Proposal, Engagement
- Conversation, ConversationParticipant, Message, Notification
- Review, Report, and AuditEvent

Current status values:

- Project: DRAFT, PUBLISHED, PAUSED, IN_PROGRESS, COMPLETED, CLOSED, ARCHIVED
- Proposal: SUBMITTED, SHORTLISTED, REJECTED, WITHDRAWN, ACCEPTED
- Engagement: ACTIVE, SUBMITTED_FOR_REVIEW, COMPLETED, CANCELLED
- User: ACTIVE, SUSPENDED, DELETED
- Report: OPEN, UNDER_REVIEW, RESOLVED, DISMISSED

Lifecycle transitions and ownership are checked in the API. A freelancer can submit only to a published project, proposal currency must match project currency, and accepting a proposal rejects other actionable proposals for that project.

## 6. Currency and money rules

- Supported codes are USD and JPY only.
- Every money value carries its currency code; never infer currency from locale or symbol.
- API and database amounts use integer minor-unit fields: budgetMinor, proposedAmountMinor, and hourlyRateMinor.
- The UI formats JPY with whole-yen display and maximumFractionDigits: 0. It does not show a dollar sign beside JPY values.
- USD and JPY are not automatically converted and must not be compared or totaled together without an explicit future conversion feature.
- Payment, escrow, payout, tax, invoice, refund, and exchange-rate behavior is out of scope.

## 7. API contract

All API resources use JSON and are mounted under /api/v1. Successful responses generally use a data envelope; paged project results also include meta. Errors use error.code, error.message, and optional error.details.

Per-endpoint request/response details, auth requirements, field constraints, and status codes are documented in [api/API.md](api/API.md). Keep that file in sync with every route change.

### Health

- GET /
- GET /health
- GET /ready

### Auth

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- DELETE /api/v1/auth/me (also exposed as the alias DELETE /api/v1/auth/account)

### Projects and reference data

- GET /api/v1/projects
- GET /api/v1/projects/:id
- POST /api/v1/projects
- POST /api/v1/projects/:id/publish
- GET /api/v1/projects/saved
- POST /api/v1/projects/:id/save
- DELETE /api/v1/projects/:id/save
- GET /api/v1/reference/categories
- GET /api/v1/reference/skills

Project listing validates q, categoryId, currency, budgetType, minBudgetMinor, maxBudgetMinor, page, and pageSize. pageSize has a maximum of 50.

### Profiles, proposals, and collaboration

- Profiles: GET/PATCH /api/v1/profiles/me, GET /api/v1/profiles/freelancers, GET /api/v1/profiles/freelancers/:id
- Proposals: GET /api/v1/proposals, POST /api/v1/proposals/projects/:projectId, and POST actions for withdraw, shortlist, reject, and accept
- Engagements: GET list/detail and POST actions for submit, complete, and cancel
- Conversations: GET list/messages and POST messages
- Notifications: GET list and POST read
- Reviews: POST create and GET user reviews

## 8. Seed data and local accounts

npm --prefix api run db:seed creates local development data with 50 clients, 100 freelancers, 250 projects, categories, skills, profiles, and USD/JPY values. Seeded demo accounts use ArcherDemo123!:

- admin@archer.local
- client1@archer.local
- freelancer1@archer.local

The database is local development data only. Never point the seed command at production.

## 9. Theme, accessibility, and localization

- Web dark mode must apply to the document root, navigation, landing showcase, project cards, filters, forms, popovers, buttons, borders, and text.
- Mobile components should pair light NativeWind utilities with dark: variants.
- Interactive controls need semantic labels, visible focus states, and sufficient contrast in both themes.
- User-facing copy belongs in the English and Japanese dictionaries. Japanese text must not be clipped or forced into fixed-height/single-line layouts.

## 10. Verification and definition of done

For web changes run npm --prefix app run typecheck, npm --prefix app run build, and npm --prefix app test.

For API changes run npm --prefix api run typecheck, npm --prefix api run build, and npm --prefix api test.

For mobile changes run npm --prefix mobile run typecheck and npm --prefix mobile test.

Feature work is complete when relevant checks pass, API authorization remains enforced, currency and locale rules are preserved, and affected UI is checked in both themes.

## 11. Roadmap boundaries

Unfinished areas include a real web dashboard (the current /dashboard is a placeholder), client project creation/edit UI in either client, web engagements/messaging/notifications/reviews, a mobile review screen, full search/filter parity, admin moderation UI, production security/operations, CI plus broader automated web/mobile test coverage, and any payment or finance integration. See TODO.md.
