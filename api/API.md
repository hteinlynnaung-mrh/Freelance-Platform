# Archer API Reference

Complete HTTP contract for the Archer API (Express + Prisma + SQLite, port 5001). This document is written so another developer **or another AI agent** can integrate against the API without reading the source code. For setup and running instructions see [api/README.md](api/README.md); for architecture and domain rules see [SPEC.md](SPEC.md).

Source of truth for every rule below: `api/src/routes/*.ts`, `api/src/middleware/*.ts`, `api/src/lib/*.ts`, `api/src/app.ts`, `api/prisma/schema.prisma`. Failing tests are the fastest way to see live behavior examples: `api/tests/*.test.ts`.

---

## Table of contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Error responses](#3-error-responses)
4. [Money](#4-money)
5. [Enums and status lifecycles](#5-enums-and-status-lifecycles)
6. [Pagination](#6-pagination)
7. [Health routes (root, not under /api/v1)](#7-health-routes-root-not-under-apiv1)
8. [Auth endpoints](#8-auth-endpoints)
9. [Project endpoints](#9-project-endpoints)
10. [Profile endpoints](#10-profile-endpoints)
11. [Proposal endpoints](#11-proposal-endpoints)
12. [Engagement endpoints](#12-engagement-endpoints)
13. [Conversation endpoints](#13-conversation-endpoints)
14. [Notification endpoints](#14-notification-endpoints)
15. [Review endpoints](#15-review-endpoints)
16. [Reference data endpoints](#16-reference-data-endpoints)
17. [Limits and constants](#17-limits-and-constants)
18. [Known gaps (important for agents)](#18-known-gaps-important-for-agents)

---

## 1. Conventions

- **Base URL:** `http://localhost:5001`
- **Domain prefix:** every route in sections 8–16 is mounted under `/api/v1`. Health routes (section 7) are mounted at the **root**.
- **Success envelope:** every non-204 success returns `{ "data": <payload> }`. Paged lists additionally return `{ "data": [...], "meta": { page, pageSize, total, pageCount } }`.
- **204 responses** send an empty body — expect no JSON.
- **Content type:** JSON only. The request body limit is 1 MB. There is no multipart/file upload anywhere in the API.
- **Request IDs:** every request may send an `x-request-id` header; the server echoes one back on every response (generated as a random UUID if the client did not send one). Use it when correlating logs.
- **IDs** are Prisma `cuid()` strings. Timestamps are ISO 8601 strings (`createdAt`, `updatedAt`, and nullable `deadline`, `publishedAt`, `readAt`, etc.).
- **Verification commands** after any API change: `npm --prefix api run typecheck && npm --prefix api run build && npm --prefix api test`.

## 2. Authentication

- **Access token:** JWT (HS256), payload `{ sub: <userId>, role: "CLIENT" | "FREELANCER" | "ADMIN" }`, **15-minute expiry** (`ACCESS_TOKEN_TTL_SECONDS=900`).
- **Header format:** `Authorization: Bearer <accessToken>`. Any other format returns `401 UNAUTHORIZED` ("Authentication is required").
- **Refresh token:** opaque 48-byte random value (base64url), **30-day expiry** (`REFRESH_TOKEN_TTL_DAYS=30`), stored hashed server-side.
- **Rotation is mandatory to understand:** `POST /api/v1/auth/refresh` revokes the presented refresh token and issues a **new** one in the same transaction. Clients must always persist the *latest* refresh token. Reusing a revoked token fails with 401.
- **Client storage (informational):** the web app keeps tokens in browser `localStorage`; the mobile app uses `expo-secure-store`. Never log access or refresh tokens.
- **Roles:** `CLIENT`, `FREELANCER`, `ADMIN`. Registration accepts only `CLIENT` or `FREELANCER`. The role lives in the JWT and is revalidated server-side on every request. Authorization is enforced in the API handlers, never only in the UI.
- `POST /api/v1/auth/logout` revokes a refresh token and requires **no** Authorization header.

Typical agent flow:

```
1. POST /api/v1/auth/login        → { accessToken, refreshToken }
2. Call endpoints with            Authorization: Bearer <accessToken>
3. On 401 "Invalid or expired access token":
     POST /api/v1/auth/refresh { refreshToken } → new token pair (persist both)
4. On 401 "Invalid or expired refresh token": the session is unusable → log in again.
```

## 3. Error responses

All errors use one envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "details": { "formErrors": [], "fieldErrors": { "title": ["String must contain at least 5 character(s)"] } }
  }
}
```

| Status | Code | Typical messages |
|---|---|---|
| 400 | `BAD_REQUEST` | generic bad request |
| 400 | `VALIDATION_ERROR` | "One or more fields are invalid" + Zod `flatten()` in `details` (`{ formErrors: string[], fieldErrors: { [field]: string[] } }`) |
| 400 | `BAD_REQUEST` (domain) | "This proposal cannot be withdrawn", "This proposal is no longer actionable", "Reviews are available only after completion", "Reviews must be written for the other participant", "Only active engagements can be submitted for review", "Proposal currency must match the project currency" |
| 401 | `UNAUTHORIZED` | "Authentication is required"; "Invalid or expired access token"; "Invalid or expired refresh token"; "Email, username, or password is incorrect"; "This account is not active"; "Incorrect password" |
| 403 | `FORBIDDEN` | "You do not have permission to perform this action"; "Only clients can create projects"; "Only freelancers can submit proposals"; "You cannot submit a proposal to your own project"; "Administrators do not have a marketplace profile" |
| 404 | `NOT_FOUND` | "Resource not found"; "Route <METHOD> <path> not found"; "Published project not found"; "Proposal not found"; "Engagement not found"; "Notification not found"; "Freelancer profile not found"; "Project not found" |
| 409 | `CONFLICT` | "An account with this email already exists"; "This username is already taken"; "You already have an active proposal for this project"; "You have already reviewed this engagement"; "A record with this value already exists" |
| 500 | `INTERNAL_SERVER_ERROR` | "An unexpected error occurred" (logged with the requestId) |

Parsing tip for agents: **map on `error.code` plus HTTP status, and show `error.message` to users**. Treat `VALIDATION_ERROR.details.fieldErrors` as per-field validators you can fix without human input; treat everything else as needing the documented precondition re-checked.

## 4. Money

- Supported currencies: **`USD` and `JPY` only**.
- All monetary amounts are **integer minor units** in fields named `*Minor`:
  - Project: `budgetMinor` + `currency`
  - Proposal: `proposedAmountMinor` + `currency`
  - Freelancer profile: `hourlyRateMinor` + `currency`
  - Budget query filters: `minBudgetMinor` / `maxBudgetMinor`
- Serialization is a **raw JSON integer** plus a sibling `currency` string — there is no money object, no conversion, and no rounding server-side. Display formatting is the client's job (USD `$` with two decimals; JPY `¥` with **zero** decimals; never infer currency from locale).
- **Never mix currency codes.** Never compare or sum amounts unless the currencies are equal. The only cross-check the API enforces: a proposal `currency` must equal the project's `currency`, else `400`.
- Payments, escrow, payouts, invoices, tax, and exchange rates are **explicitly out of scope** — do not implement or assume them.

## 5. Enums and status lifecycles

Stored as strings; validated in application code.

| Enum | Values |
|---|---|
| User role | `CLIENT`, `FREELANCER`, `ADMIN` |
| User status | `ACTIVE`, `SUSPENDED`, `DELETED` |
| Project status | `DRAFT`, `PUBLISHED`, `PAUSED`, `IN_PROGRESS`, `COMPLETED`, `CLOSED`, `ARCHIVED` |
| Budget type | `FIXED`, `HOURLY` |
| Proposal status | `SUBMITTED`, `SHORTLISTED`, `REJECTED`, `WITHDRAWN`, `ACCEPTED` |
| Engagement status | `ACTIVE`, `SUBMITTED_FOR_REVIEW`, `COMPLETED`, `CANCELLED` |

Implemented transitions (everything else is currently a blueprint):

- **Project:** `DRAFT → PUBLISHED` (publish endpoint) · `PUBLISHED → IN_PROGRESS` (proposal accepted) · `→ COMPLETED` (engagement completed) · `→ CLOSED` (engagement cancelled)
- **Proposal:** `SUBMITTED ⇄ SHORTLISTED` · `SUBMITTED/SHORTLISTED → REJECTED` · `→ ACCEPTED` (exactly one per project) · `SUBMITTED/SHORTLISTED → WITHDRAWN` · withdrawn proposals can be **re-submitted** (updated in place back to `SUBMITTED`)
- **Engagement:** `ACTIVE → SUBMITTED_FOR_REVIEW → COMPLETED`; `ACTIVE/SUBMITTED_FOR_REVIEW → CANCELLED`
- Public project reads (list/detail) only ever expose `PUBLISHED` projects. Drafts are visible **only** to their owner via create/publish responses — there is no "list my own projects" endpoint yet.

## 6. Pagination

Standard on exactly two endpoints: `GET /api/v1/projects` and `GET /api/v1/profiles/freelancers`.

- Query: `page` (integer ≥ 1, default 1), `pageSize` (integer ≥ 1, **max 50**, default 20).
- Response: `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 57, "pageCount": 3 } }`, `pageCount = ceil(total / pageSize)`.

All other list endpoints return a plain `{ "data": [...] }` with **no** pagination:

| Endpoint | Ordering | Cap |
|---|---|---|
| `GET /api/v1/proposals` | `createdAt desc` | none |
| `GET /api/v1/engagements` | `updatedAt desc` | none |
| `GET /api/v1/conversations` | `updatedAt desc` | none |
| `GET /api/v1/conversations/:id/messages` | `createdAt asc` | none |
| `GET /api/v1/projects/saved` | `savedAt desc` | none |
| `GET /api/v1/notifications` | `createdAt desc` | **fixed 100 items** |
| `GET /api/v1/reviews/users/:userId` | `createdAt desc` | none |

Do not assume `meta` exists on these; do not expect paging on them yet either.

## 7. Health routes (root, not under /api/v1)

| Method + Path | Auth | Response |
|---|---|---|
| `GET /` | public | `200` `{ "data": { "service": "archer-api", "status": "ok", "message": "...", "health": "/health", "readiness": "/ready" } }` |
| `GET /health` | public | `200` `{ "data": { "service": "archer-api", "status": "ok" } }` |
| `GET /ready` | public | `200` `{ "data": { "service": "archer-api", "status": "ready", "database": "ok" } }`; runs `SELECT 1`; database failure → `500` |

## 8. Auth endpoints

### POST /api/v1/auth/register — public

```json
{
  "email": "ada@example.com",     // required, trimmed, lowercased, valid email
  "password": "Str0ngPass!word",  // required, 8–128 chars
  "role": "FREELANCER",           // required, "CLIENT" | "FREELANCER" (no ADMIN)
  "displayName": "Ada Lovelace",  // required, trimmed, 2–80 chars
  "username": "ada_lovelace"      // optional, ^[a-z0-9_]{3,30}$, trimmed + lowercased
}
```

- If `username` is omitted it is derived from the email local-part (sanitized, max 24 chars) with `_2`, `_3`, … suffixes on collision. An explicit taken username → `409 "This username is already taken"`.
- Creates the matching `ClientProfile` or `FreelancerProfile` with `displayName` in a transaction.
- Duplicate email → `409 "An account with this email already exists"`.
- **201**

```json
{ "data": { "user": { "id": "cuid", "email": "...", "username": "...", "role": "FREELANCER", "status": "ACTIVE" }, "accessToken": "...", "refreshToken": "..." } }
```

The inner `user` object (`id, email, username, role, status`) is the `publicUser` shape reused by `login` and `refresh`.

### POST /api/v1/auth/login — public

```json
{ "email": "ada@example.com", "password": "..." }        // or
{ "username": "ada_lovelace", "password": "..." }        // email OR username (at least one) required
```

Wrong credentials → `401 "Email, username, or password is incorrect"`. Non-`ACTIVE` account → `401 "This account is not active"`. **200** — same response body as register.

### POST /api/v1/auth/refresh — public

```json
{ "refreshToken": "<opaque token, min 20 chars>" }
```

Rotates the token. Invalid, revoked, expired, or non-`ACTIVE` user → `401 "Invalid or expired refresh token"`. **200** — `{ "data": { "user": publicUser, "accessToken", "refreshToken } }` — **persist the new `refreshToken`**.

### POST /api/v1/auth/logout — public (no header)

```json
{ "refreshToken": "<token>" }
```

Revokes the token if found and unrevoked. Malformed body still succeeds. **204** (empty).

### GET /api/v1/auth/me — requireAuth

**200** `{ "data": { "user": { "id", "email", "username", "role", "status", "clientProfile", "freelancerProfile" } } }` — exactly one profile object is non-`null`. `401` if the user row has since disappeared.

### DELETE /api/v1/auth/me — requireAuth *(alias: `DELETE /api/v1/auth/account`)*

```json
{ "password": "optional current password" }
```

Optional password confirmation; mismatch → `401 "Incorrect password"`. Hard-deletes the user with cascade deletes. **204** (empty).

## 9. Project endpoints

### GET /api/v1/projects — public (published projects only)

Query parameters (all optional):

| Param | Type | Notes |
|---|---|---|
| `q` | string | trimmed, ≤ 100 chars; `contains` match over title, description, category name, and skill name |
| `categoryId` | cuid | exact match |
| `currency` | `USD \| JPY` | exact match |
| `budgetType` | `FIXED \| HOURLY` | exact match |
| `minBudgetMinor` / `maxBudgetMinor` | integer ≥ 0 | inclusive money filter |
| `page` / `pageSize` | integers | pagination, see section 6 |

**200** paged list. Each project object:

```json
{
  "id": "cuid", "ownerId": "cuid", "categoryId": "cuid|null",
  "title": "...", "slug": "kebab-title-ab12cd34", "description": "...",
  "budgetMinor": 500000, "currency": "USD", "budgetType": "FIXED",
  "status": "PUBLISHED", "deadline": "2026-11-30T00:00:00.000Z|null",
  "publishedAt": "2026-10-01T...|null", "createdAt": "...", "updatedAt": "...",
  "category": { "id", "name", "slug", "description", "isActive", "createdAt },
  "skills": [ { "projectId": "...", "skillId": "...", "skill": { "id", "name", "slug", "createdAt" } } ]
}
```

Ordered by `publishedAt desc`.

### GET /api/v1/projects/:id — public

Only `PUBLISHED` projects, else `404 "Published project not found"`. Same shape as above, including `owner`:

```json
"owner": { "id": "cuid", "clientProfile": { "displayName": "...", "company": "...|null", "...": "..." } }
```

The owner's **email is deliberately omitted**.

### POST /api/v1/projects — requireAuth, role `CLIENT` or `ADMIN` (else `403 "Only clients can create projects"`)

```json
{
  "title": "Build a marketing site",       // required, trimmed, 5–140 chars
  "description": "…at least 20 chars…",    // required, trimmed, 20–10000 chars
  "categoryId": "cuid|null",               // optional
  "skillIds": ["cuid", "cuid"],            // optional, array of cuids, max 20, default []
  "budgetMinor": 500000,                   // required, integer ≥ 0
  "currency": "USD",                       // required, "USD" | "JPY"
  "budgetType": "FIXED",                   // required, "FIXED" | "HOURLY"
  "deadline": "2026-12-01T00:00:00.000Z"   // optional, date
}
```

New projects start as `DRAFT` and are not publicly visible. The slug is generated server-side from the title plus 8 random hex characters. **201** — `{ "data": <Project with category + skills> }`.

### POST /api/v1/projects/:id/publish — requireAuth, owner or ADMIN (else `403`)

Sets `status: "PUBLISHED"` and `publishedAt` (if unset). Project must exist (else `404 "Project not found"`). **200** — `{ "data": <Project> }` (no includes).

### GET /api/v1/projects/saved — requireAuth (any role)

The authenticated user's saved projects, each a **project object plus one extra field `savedAt` (ISO string)**, ordered `savedAt desc`. Plain `{ "data": [...] }`, no pagination.

### POST /api/v1/projects/:id/save — requireAuth

Only `PUBLISHED` projects (else `404`). Idempotent upsert, so repeat calls behave the same. **201** — `{ "data": <SavedProject> }`.

### DELETE /api/v1/projects/:id/save — requireAuth

Idempotent delete. **204** (empty).

## 10. Profile endpoints

### GET /api/v1/profiles/me — requireAuth

**200** `{ "data": { "id", "email", "role", "status", "clientProfile": {...}|null, "freelancerProfile": {...includes skills + portfolio}|null } }`. `404 "User profile not found"` if wiped.

### PATCH /api/v1/profiles/me — requireAuth, role-specific (ADMIN → `403 "Administrators do not have a marketplace profile"`)

All fields optional; unknown validation → `400 VALIDATION_ERROR`.

| Field | Applies to | Constraints |
|---|---|---|
| `displayName` | both | trimmed, 2–80 |
| `company` | both | ≤ 120, nullable |
| `bio` | both | ≤ 2000, nullable |
| `location` | both | ≤ 120, nullable |
| `timezone` | both | ≤ 80, nullable |
| `headline` | FREELANCER | ≤ 140, nullable |
| `hourlyRateMinor` | FREELANCER | integer ≥ 0, nullable |
| `currency` | FREELANCER | `USD \| JPY`, nullable |
| `availability` | FREELANCER | ≤ 40, nullable |
| `experienceLevel` | FREELANCER | ≤ 40, nullable |

**200** `{ "data": <updated profile> }`.

### GET /api/v1/profiles/freelancers — public

Query: `q` (≤ 100; matches displayName/headline/bio), `skillId` (cuid), `location` (≤ 100), `page`, `pageSize`. Filters to `ACTIVE` users; includes skills and the **first 3 visible portfolio items**; ordered `updatedAt desc`. **200** paged list of freelancer profiles.

### GET /api/v1/profiles/freelancers/:id — public

**`:id` is the user's ID (userId), not a profile ID.** Includes all skills and all visible portfolio items (`sortOrder asc`). `404 "Freelancer profile not found"`. **200** `{ "data": <FreelancerProfile> }`.

## 11. Proposal endpoints

Shared body schema (`400 VALIDATION_ERROR` on failure):

```json
{
  "coverLetter": "...",             // required, trimmed, 20–10000 chars
  "proposedAmountMinor": 250000,    // required, integer ≥ 0
  "currency": "USD",                // required, "USD" | "JPY" — must equal the project's currency
  "estimatedDurationDays": 30       // optional, integer 1–3650
}
```

### GET /api/v1/proposals — requireAuth

No pagination. Role-scoped: FREELANCER → own proposals; CLIENT → proposals on own projects; ADMIN → all. Ordered `createdAt desc`. Includes `project` (+ category) and `freelancer` (+ **email**, profile, skills).

Each proposal object carries: `id, projectId, freelancerId, coverLetter, proposedAmountMinor, currency, estimatedDurationDays?, status, createdAt, updatedAt`.

### POST /api/v1/proposals/projects/:projectId — requireAuth, FREELANCER only (else `403 "Only freelancers can submit proposals"`)

Rules, in check order:

| Condition | Result |
|---|---|
| Project missing or not `PUBLISHED` | `404` |
| Proposing on your own project | `403 "You cannot submit a proposal to your own project"` |
| `currency` ≠ project `currency` | `400 "Proposal currency must match the project currency"` |
| Active (non-`WITHDRAWN`) proposal already exists | `409 "You already have an active proposal for this project"` |
| Only a `WITHDRAWN` proposal exists | **re-submission:** the existing row is updated with the new fields and set back to `SUBMITTED` → **200** |
| Otherwise | create → **201** |

Response: `{ "data": <Proposal> }`.

### POST /api/v1/proposals/:id/withdraw — requireAuth, the proposal's FREELANCER owner

Allowed from `SUBMITTED` or `SHORTLISTED`, else `400 "This proposal cannot be withdrawn"`. **200** — proposal with `status: "WITHDRAWN"`.

### POST /api/v1/proposals/:id/shortlist — requireAuth, CLIENT who owns the project (else `403`)

Allowed from `SUBMITTED` or `SHORTLISTED`, else `400 "This proposal is no longer actionable"`. **200** — `status: "SHORTLISTED"`.

### POST /api/v1/proposals/:id/reject — requireAuth, same authorization as shortlist

Same transitions, result `status: "REJECTED"`. **200**.

### POST /api/v1/proposals/:id/accept — requireAuth, CLIENT who owns the project

Allowed from `SUBMITTED`/`SHORTLISTED` while the project is `PUBLISHED`. Runs in **one transaction**:

1. Proposal → `ACCEPTED`
2. All other actionable (`SUBMITTED`/`SHORTLISTED`) proposals on the project → `REJECTED`
3. Project → `IN_PROGRESS`
4. An `Engagement` is created (`ACTIVE`, `startDate` = now)
5. A two-participant `Conversation` is created
6. Notifications are sent to both sides: `PROPOSAL_ACCEPTED` and `ENGAGEMENT_CREATED` (`resourceType: "ENGAGEMENT"`)

**200**

```json
{ "data": { "accepted": <Proposal>, "project": <Project>, "engagement": <Engagement>, "conversation": <Conversation> } }
```

## 12. Engagement endpoints

All responses include: `project` (+ category), `proposal`, `client` (`{ id, email, clientProfile }`), `freelancer` (`{ id, email, freelancerProfile }`). Engagement fields: `id, projectId, proposalId, clientId, freelancerId, status, startDate?, targetCompletionDate?, completedAt?, createdAt, updatedAt`.

### GET /api/v1/engagements — requireAuth

Role-scoped (CLIENT → engagements where the user is the client; FREELANCER → where the user is the freelancer; ADMIN → all). Ordered `updatedAt desc`, **no pagination**.

### GET /api/v1/engagements/:id — requireAuth, participant or ADMIN (else `403`)

**200** `{ "data": <Engagement> }`.

### POST /api/v1/engagements/:id/submit — requireAuth, the engagement's FREELANCER

Only from `ACTIVE`, else `400 "Only active engagements can be submitted for review"` → `SUBMITTED_FOR_REVIEW`; notifies the client (`ENGAGEMENT_SUBMITTED`). **200**.

### POST /api/v1/engagements/:id/complete — requireAuth, the engagement's CLIENT

Only from `SUBMITTED_FOR_REVIEW` → `COMPLETED` (`completedAt` set) and the project → `COMPLETED`; notifies the freelancer (`ENGAGEMENT_COMPLETED`). **200**.

### POST /api/v1/engagements/:id/cancel — requireAuth, participant or ADMIN

Only from `ACTIVE` or `SUBMITTED_FOR_REVIEW` → `CANCELLED`; the project → `CLOSED`; notifies the *other* participant (`ENGAGEMENT_CANCELLED`). **200**.

## 13. Conversation endpoints

Messages have `id, conversationId, senderId, body, readAt?, createdAt, updatedAt`.

### GET /api/v1/conversations — requireAuth

Only conversations where the user is a participant. Includes all participants (each with `user` carrying email + profiles) and the last message. Ordered `updatedAt desc`, **no pagination**.

### GET /api/v1/conversations/:id/messages — requireAuth, participant (else `403`)

Ordered by `createdAt **asc**` (chronological). Includes `sender: { id, email, clientProfile, freelancerProfile }`. **No pagination.**

### POST /api/v1/conversations/:id/messages — requireAuth, participant (else `403`)

```json
{ "body": "…up to 5000 chars…" }   // required, trimmed, 1–5000
```

Creates the message and bumps the conversation's `updatedAt` in a transaction. **201** — `{ "data": <Message with sender> }`.

## 14. Notification endpoints

Notification fields: `id, userId, type, title, body, resourceType?, resourceId?, readAt?, createdAt`. `type` values emitted by the API: `PROPOSAL_ACCEPTED`, `ENGAGEMENT_CREATED`, `ENGAGEMENT_SUBMITTED`, `ENGAGEMENT_COMPLETED`, `ENGAGEMENT_CANCELLED`.

### GET /api/v1/notifications — requireAuth

The user's own notifications, `createdAt` desc, capped at **100 items**, no pagination metadata.

### POST /api/v1/notifications/:id/read — requireAuth, own notifications only (else `404`)

Sets `readAt` if unset; idempotent. **200** `{ "data": <Notification> }`.

## 15. Review endpoints

### POST /api/v1/reviews — requireAuth, participant of the engagement (else `403`)

```json
{
  "engagementId": "cuid",   // required
  "subjectId": "cuid",      // required — must be the *other* participant (else 400)
  "rating": 5,              // required, integer 1–5
  "comment": "…optional, trimmed, ≤ 2000…"
}
```

| Rule | Failure |
|---|---|
| Engagement not `COMPLETED` | `400 "Reviews are available only after completion"` |
| `subjectId` not the other participant | `400 "Reviews must be written for the other participant"` |
| A review by this author already exists on the engagement | `409 "You have already reviewed this engagement"` |

**201** `{ "data": <Review> }` — fields `id, engagementId, authorId, subjectId, rating, comment?, isVisible, createdAt, updatedAt`.

### GET /api/v1/reviews/users/:userId — public

Visible reviews where the user is the subject, includes `author: { id, email }`, `createdAt` desc. **200** `{ "data": <Review[]> }` (no pagination).

## 16. Reference data endpoints

Both public, no auth, no pagination.

| Endpoint | Response |
|---|---|
| `GET /api/v1/reference/categories` | `{ "data": [{ "id", "name", "slug", "description", "isActive", "createdAt" }] }` — active categories, `name` asc |
| `GET /api/v1/reference/skills` | `{ "data": [{ "id", "name", "slug", "createdAt" }] }` — all skills, `name` asc |

Fetch these first and cache the IDs: `categoryId`, `skillIds`, and `skillId` query params all reference them.

## 17. Limits and constants

| Constant | Value |
|---|---|
| JSON body limit | 1 MB |
| Access token TTL | 900 s (15 min) |
| Refresh token TTL | 30 days, rotated on every refresh |
| JWT secret | ≥ 32 chars (server config) |
| Password | 8–128 chars, bcrypt 12 rounds |
| Username | `^[a-z0-9_]{3,30}$` |
| displayName | 2–80 |
| Project title / description | 5–140 / 20–10000 |
| skillIds array | ≤ 20 |
| Proposal coverLetter / durationDays | 20–10000 / 1–3650 |
| Message body | 1–5000 |
| Profile headline / bio / company/location / timezone | 140 / 2000 / 120 / 80 |
| availability / experienceLevel | 40 / 40 |
| Review rating / comment | 1–5 / 2000 |
| Query `q` | ≤ 100 chars |
| pageSize | ≤ 50 (default 20) |
| Notifications list | fixed 100 items |
| Proposal currency | must match project currency |

## 18. Known gaps (important for agents)

Things another agent must not assume exist:

- **No OpenAPI/Swagger contract yet** — this file is the contract. TODO.md tracks "Publish a complete OpenAPI contract".
- **No "list my own projects" endpoint** — CLIENTs can only see their drafts via the create/publish responses; public reads expose `PUBLISHED` only.
- **No routes for `Report` or `AuditEvent`** — models exist in the schema (statuses `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`) but the API has no endpoints for them.
- **No payment, escrow, payout, invoice, or exchange-rate behavior** — out of scope by product decision (see AGENTS.md).
- **No file uploads** — only a 1 MB JSON body limit.
- **No pagination** on proposals, engagements, conversations, messages, saved projects, or reviews; notifications are hard-capped at 100.
- **User emails appear in** proposal `freelancer` includes, engagement `client`/`freelancer` includes, message `sender` includes, review `author`/`subject` includes — but **not** in project `owner` includes. Respect this when surfacing data.
- **`DELETE /api/v1/auth/account`** is an undocumented-in-SPEC.md alias of `DELETE /api/v1/auth/me`.
- **Report/AuditEvent** — same as the models note above; skip them rather than inventing endpoints.

If you change the API, update this file, [SPEC.md](SPEC.md), and any affected READMEs in the same change (per AGENTS.md).
