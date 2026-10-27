# Archer — Freelance Platform Project Specification

## 1. Document status

- **Project:** Archer
- **Product:** Freelance marketplace connecting clients with freelancers
- **Deliverables:** Two independent projects: `app` and `api`
- **Version:** 0.1 MVP specification
- **Status:** Draft for implementation
- **Repository:** None required for this specification

This document defines the shared product behavior and the technical boundaries between Archer's web app and API. Each part must be runnable, testable, and deployable independently while consuming the same versioned API contract.

## 2. Assumptions and decisions to confirm

The following interpretations are used so implementation can begin without blocking:

- “Prism 7” is interpreted as **Prisma 7**.
- “Jet auth” is interpreted as **JWT authentication** with access and refresh tokens. If “Jet” refers to a particular library or service, replace this with the selected provider before implementation.
- The supplied shadcn command uses the **Next template**, which conflicts with a plain React SPA using React Router. The preferred MVP architecture is React + Vite + React Router. Use the supplied command only if the web app is intentionally changed to Next.js; otherwise initialize shadcn using the equivalent React/Vite setup.
- The first release is a marketplace foundation: authentication, profiles, project listings, proposals, messaging, saved items, notifications, and admin moderation. Contracts, escrow, invoicing, payouts, and payment processing are explicitly out of scope.
- USD and Thai Baht are supported as independent listing and transaction display currencies. Archer does not perform currency conversion in the MVP.
- Sample data should be substantial enough to exercise search, filters, pagination, and dashboards—not merely a handful of fixtures.

## 3. Product goals

Archer should make it easy for:

- **Clients** to describe work, discover suitable freelancers, compare proposals, and manage active engagements.
- **Freelancers** to present their capabilities, find relevant work, submit proposals, and manage their availability and work history.
- **Admins** to moderate users, projects, proposals, and reported content.

The MVP should prioritize trust, discoverability, fast interactions, and a clean path from project creation to proposal acceptance. Money-related data must be modeled correctly from day one even though payment execution is deferred.

## 4. User roles

### Guest

- Browse public freelancer profiles and published projects.
- Search and filter public work.
- View public project and profile details.
- Sign up or sign in to interact.

### Client

- Maintain a client profile.
- Create, edit, publish, pause, close, and archive projects.
- Review, shortlist, reject, and accept proposals.
- Message freelancers after an allowed interaction point.
- Manage active engagements and mark work complete.
- Leave reviews after completion.

### Freelancer

- Maintain a freelancer profile, skills, portfolio, rates, and availability.
- Search and filter projects.
- Save projects and manage saved searches.
- Submit, edit, withdraw, and track proposals.
- Message clients after an allowed interaction point.
- Manage accepted engagements and mark work complete.
- Leave reviews after completion.

### Admin

- View operational dashboards.
- Moderate users, profiles, projects, proposals, reviews, and reports.
- Suspend or restore accounts.
- Hide or restore content.
- Review audit events.

Authorization must be enforced by the API. The clients may hide unavailable actions for usability, but the API remains the source of truth.

## 5. MVP scope

### Included

- Email/password registration and sign-in.
- JWT-based sessions with refresh-token rotation and sign-out.
- Role selection during onboarding: client or freelancer.
- Public profiles and project listings.
- Project creation and lifecycle management.
- Search, filtering, sorting, pagination, and saved projects.
- Proposal submission and status tracking.
- Client/freelancer messaging for permitted conversations.
- In-app notifications.
- Engagement status tracking after proposal acceptance.
- Reviews and ratings after an engagement is completed.
- Reports and admin moderation.
- USD and THB currency support.
- Seeded sample data and demo accounts.
- Responsive web experience using the API.

### Explicitly not included

- Payment gateway integration.
- Escrow, payouts, withdrawals, refunds, taxes, invoices, or financial reconciliation.
- Automatic USD/THB conversion or live exchange-rate retrieval.
- Real-time audio/video calls.
- Full file-storage infrastructure. Portfolio and attachment metadata may be modeled, but production uploads require a later storage decision.
- Advanced recommendation or ranking models.
- Multi-company enterprise administration.

## 6. Core user journeys

### Client journey

1. Register or sign in as a client.
2. Complete a basic profile.
3. Create a project with title, description, category, skills, budget, currency, and deadline.
4. Save a draft or publish the project.
5. Review incoming proposals.
6. Shortlist or reject proposals.
7. Accept one proposal, creating an engagement.
8. Message the freelancer and track the engagement.
9. Mark the engagement complete and leave a review.

### Freelancer journey

1. Register or sign in as a freelancer.
2. Complete a public profile with headline, bio, skills, rate, timezone, availability, and portfolio entries.
3. Search and filter published projects.
4. Save projects or submit a proposal.
5. Track proposal status.
6. Accept an engagement when selected.
7. Message the client and update engagement progress.
8. Mark the work ready for completion.
9. Leave a review after completion.

### Admin journey

1. Sign in to the admin area.
2. Review summary metrics and recent reports.
3. Inspect reported content or accounts.
4. Hide content, suspend an account, or dismiss the report.
5. Record an auditable moderation action.

## 7. Domain model

The exact Prisma schema is an implementation detail, but the API must represent these concepts:

- **User:** identity, email, password hash, role, status, timestamps.
- **RefreshToken:** hashed token, user, expiry, revocation, device/session metadata.
- **ClientProfile:** display name, company, avatar, bio, location, timezone.
- **FreelancerProfile:** display name, headline, bio, avatar, location, timezone, hourly rate, availability, experience level.
- **Skill:** normalized name and slug.
- **ProfileSkill:** profile-to-skill relationship with optional proficiency metadata.
- **PortfolioItem:** title, description, external URL or attachment metadata, ordering, visibility.
- **Category:** name, slug, description, active status.
- **Project:** owner, title, slug, description, category, required skills, budget, currency, budget type, status, deadline, published timestamp.
- **SavedProject:** user and project relationship.
- **Proposal:** project, freelancer, cover letter, proposed amount, currency, estimated duration, status, timestamps.
- **Engagement:** project, accepted proposal, client, freelancer, status, start date, target completion date, completed timestamp.
- **Conversation:** participants and conversation status.
- **Message:** conversation, sender, body, read status, timestamps.
- **Notification:** recipient, type, title, body, read status, optional related resource.
- **Review:** engagement, author, subject, rating, comment, visibility, timestamps.
- **Report:** reporter, target type and ID, reason, description, status, moderator resolution.
- **AuditEvent:** actor, action, target type and ID, metadata, timestamp.

### Status rules

- Project: `DRAFT`, `PUBLISHED`, `PAUSED`, `IN_PROGRESS`, `COMPLETED`, `CLOSED`, `ARCHIVED`.
- Proposal: `SUBMITTED`, `SHORTLISTED`, `REJECTED`, `WITHDRAWN`, `ACCEPTED`.
- Engagement: `ACTIVE`, `SUBMITTED_FOR_REVIEW`, `COMPLETED`, `CANCELLED`.
- User: `ACTIVE`, `SUSPENDED`, `DELETED`.
- Report: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`.

All state transitions must be validated server-side. For example, a proposal cannot be accepted for a closed project, and a freelancer cannot submit more than one active proposal for the same project.

## 8. Currency and money rules

- Supported currency codes in the MVP: `USD` and `THB`.
- Store the currency code alongside every monetary value; never infer it from locale.
- Store amounts as integer minor units to avoid floating-point errors:
  - USD uses cents.
  - THB uses satang for consistency, even when UI display uses whole baht.
- Do not mix currencies in a single comparison, total, or proposal decision without an explicit conversion feature.
- No exchange-rate API is required.
- API responses should return both the integer amount and a display-ready currency code, for example `{ amountMinor: 125000, currency: "THB" }`.
- The web client should format values using locale-aware formatters while preserving the stored currency.
- Budget semantics must be explicit: `FIXED` or `HOURLY`.
- Payment, payout, tax, and invoice fields must not imply that a financial transaction has occurred.

## 9. API contract

The API is the shared integration boundary for the web client.

### API principles

- REST-style JSON API under `/api/v1`.
- Consistent response envelopes for success and errors.
- Cursor or page-based pagination with a documented default and maximum page size.
- Stable resource IDs; do not expose database implementation details as public contracts.
- Request validation at the boundary.
- Authorization checks in every protected handler.
- OpenAPI documentation generated or maintained alongside routes.
- ISO 8601 timestamps in UTC.
- Explicit sorting and filtering parameters with allowlists.

Suggested response shapes:

```json
{
  "data": {},
  "meta": {}
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "details": {}
  }
}
```

### Initial endpoint groups

- `/auth`: register, login, refresh, logout, current user.
- `/users`: current-user profile and account settings.
- `/freelancers`: public profiles, search, profile portfolio.
- `/clients`: public client profiles.
- `/skills` and `/categories`: public reference data.
- `/projects`: browse, search, create, update, publish, pause, close, save.
- `/proposals`: submit, list, update, withdraw, shortlist, reject, accept.
- `/engagements`: list, view, update progress, submit for review, complete, cancel.
- `/conversations` and `/messages`: list conversations, read messages, send messages, mark read.
- `/notifications`: list and mark read.
- `/reviews`: create and list reviews.
- `/reports`: submit and manage reports.
- `/admin`: moderation queues, user actions, content actions, metrics, audit events.

### Authentication and security

- Hash passwords with a modern password-hashing algorithm such as Argon2id or bcrypt.
- Issue short-lived access tokens and longer-lived refresh tokens.
- Store refresh tokens hashed; rotate them on refresh and revoke on logout or suspected reuse.
- Do not store secrets, raw passwords, or raw refresh tokens in logs.
- Apply rate limits to registration, login, refresh, password-reset preparation, messaging, and report creation.
- Validate and sanitize user-generated text.
- Use CORS allowlists, secure headers, request size limits, and structured audit logging.
- Add authorization tests for every role and ownership-sensitive resource.

## 10. Project structure

The two projects are independent and should have separate package manifests, environment files, test commands, and README files. Shared contracts may be published or copied through a documented mechanism, but runtime coupling between the projects should be avoided.

Suggested root layout:

```text
Archer/
├── SPEC.md
├── app/
└── api/
```

### 10.1 `app` — web application

#### Required stack

- React
- React Router
- TanStack React Query
- shadcn/ui
- TypeScript
- A modern bundler, preferably Vite unless Next.js is explicitly selected

#### Setup note

The supplied shadcn command is:

```bash
npx shadcn@latest init --preset bciwM7vc --template next
```

Because `--template next` creates a Next-oriented project, confirm whether Archer should use Next.js routing or a plain React/Vite app. If React Router is a firm requirement, keep the app as a React SPA and use the equivalent shadcn initialization path for that template.

#### Web responsibilities

- Public landing, project discovery, freelancer discovery, and detail pages.
- Sign-in, registration, onboarding, and account settings.
- Role-aware client and freelancer dashboards.
- Project editor with draft and publish states.
- Proposal management views.
- Engagement and messaging views.
- Notifications and saved projects.
- Admin moderation screens behind admin authorization.
- Accessible responsive layout for desktop, tablet, and small screens.

#### Routing expectations

- Public routes must be shareable and load directly.
- Protected routes must redirect unauthenticated users to sign-in and preserve the intended destination.
- Role-protected routes must handle unauthorized access without exposing private data.
- Route loaders or query prefetching should avoid avoidable waterfalls.

#### Data fetching expectations

- Use React Query for server state, caching, invalidation, retries, and optimistic updates where safe.
- Keep transient form state local to the form library or component.
- Centralize API client configuration, auth refresh behavior, error normalization, and query keys.
- Show clear loading, empty, error, and success states for every asynchronous screen.

#### UI expectations

- Use shadcn/ui primitives and the selected preset as the base visual system.
- Use semantic HTML, keyboard navigation, visible focus states, and accessible labels.
- Make currency visible wherever a price or rate appears.
- Include filters for category, skill, budget range, currency, experience, and project status where applicable.
- Use confirmation for destructive or irreversible actions such as closing projects, withdrawing proposals, and suspending accounts.

### 10.2 `api` — backend service

#### Required stack

- Node.js with TypeScript
- Express
- SQLite for the initial database
- Prisma 7 ORM and migrations
- JWT-based authentication, subject to confirmation of the intended “Jet auth” technology
- Zod or an equivalent runtime validation library
- Vitest or Jest for tests

#### API responsibilities

- Own the domain model and all business rules.
- Expose the versioned REST API to the web client.
- Handle authentication, authorization, validation, pagination, search, and moderation.
- Provide deterministic database migrations.
- Provide a repeatable seed command with a large, relationally consistent dataset.
- Provide health and readiness endpoints.
- Emit structured logs and audit events for security-sensitive actions.

#### SQLite considerations

- Enable foreign keys and use transactions for multi-record state changes.
- Add indexes for login lookup, project status, category, currency, publication date, proposal status, conversation participants, and notification read state.
- Keep the data-access layer replaceable so a later move to PostgreSQL does not require rewriting route behavior.
- Avoid SQLite-specific behavior in public API semantics.

#### Sample data requirements

The seed dataset should include:

- Demo accounts for admin, client, and freelancer roles.
- At least 50 clients and 100 freelancers.
- At least 250 projects distributed across categories, statuses, budgets, currencies, and dates.
- At least 500 proposals covering every proposal status.
- Accepted proposals producing active, completed, and cancelled engagements.
- Conversations, messages, notifications, reviews, and reports.
- Skills and categories with realistic names and varied relationships.
- Deterministic credentials documented in the API README for local development only.

Seed data must be safe to run in a fresh local database and should either reset only an explicitly named development database or use idempotent upserts. It must never target a production database by accident.

## 11. Shared quality requirements

### Accessibility

- Target WCAG 2.2 AA for the web app where applicable.
- Ensure keyboard access, screen-reader labels, focus management, contrast, and non-color status indicators.
- Keep forms understandable with inline validation and meaningful error messages.

### Performance

- Paginate all potentially large collections.
- Debounce search inputs and cancel obsolete requests.
- Avoid fetching private or unused fields.
- Track API latency for key endpoints and client-side query errors.

### Reliability

- API errors must be stable, typed, and actionable.
- Clients must handle expired sessions without infinite refresh loops.
- State-changing operations must be idempotent where feasible.
- Use transactions for proposal acceptance, engagement creation, and moderation actions.

### Observability

- Provide `/health` and `/ready` endpoints.
- Log request correlation IDs, route, status, duration, and user ID when available.
- Record audit events for auth changes, role-sensitive actions, moderation, proposal decisions, and engagement transitions.
- Do not log authorization headers, passwords, refresh tokens, or message contents by default.

### Testing

- API unit tests for validation, state transitions, currency rules, and authorization.
- API integration tests against a test SQLite database.
- Web component and route tests for protected flows and query error states.
- End-to-end smoke tests for registration, project publishing, proposal acceptance, messaging, and review creation.

## 12. Environment and developer experience

Each project should document:

- Required Node.js and npm versions.
- Install, dev, build, lint, typecheck, test, and seed commands.
- Environment variables with safe example values.
- API base URL configuration.
- Authentication behavior in local development.
- Demo accounts and reset instructions.

Suggested commands from the project root after the three projects exist:

```bash
npm --prefix api run dev
npm --prefix api run db:migrate
npm --prefix api run db:seed
npm --prefix app run dev
```

The exact scripts may vary by package manager setup; the README in each project is authoritative.

## 13. Definition of done for MVP

- A new developer can run the API with a local SQLite database and seeded data.
- A client can register, publish a project, review proposals, accept one, message the freelancer, complete the engagement, and review the freelancer.
- A freelancer can register, complete a profile, find a project, submit a proposal, message a client after acceptance, complete the engagement, and review the client.
- The web client consumes the documented API and correctly handles loading, empty, error, unauthorized, and expired-session states.
- USD and THB values remain correctly labeled and formatted end to end.
- Admins can moderate a reported account or content item and the action is auditable.
- No feature suggests that money has been charged, held, paid, refunded, or converted.
- Automated tests cover the highest-risk authorization and state-transition rules.
- Each independent project has its own README and can be built without requiring the other client project.

## 14. Open questions before implementation lock

1. Does “Jet auth” mean a specific authentication product/library, or should Archer use a conventional in-house JWT implementation?
2. Should the web app be a React/Vite SPA with React Router, or should the supplied shadcn Next template take precedence and the app use Next.js routing?
3. Should a user be able to act as both client and freelancer, or is the role fixed after onboarding?
4. Are project budgets ranges, fixed amounts, hourly rates, or all three?
5. Should messaging be available immediately after a proposal is submitted, or only after a proposal is shortlisted/accepted?
6. Do portfolio items need real file uploads in the MVP, and if so, which storage provider should be used?
7. Which notification channels are required initially: in-app only, or also email and push notifications?
8. Should reviews be one-sided or mutual after an engagement is completed?
9. Which Thai locale and default timezone should be used for Thai Baht formatting and date display?
10. Is there a preferred hosting target for the API, SQLite database, and web app?
    
