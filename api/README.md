# Archer API

Independent Express API for the Archer web platform.

## Stack

- Node.js + TypeScript
- Express 5
- SQLite
- Prisma 7 with `@prisma/adapter-better-sqlite3`
- JWT access tokens with rotating, hashed opaque refresh tokens
- Zod request validation

## Local setup

Prisma 7 supports the bundled Node 24 runtime used for verification. Use Node 24 locally (the expected version is recorded in `.nvmrc`); Node 25 is not supported by Prisma 7.

```bash
npm install
cp .env.example .env  # api/.env is already provided for local development
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

The API listens on `http://localhost:5001` by default.

Use these URLs to verify it is running:

- `http://localhost:5001/health` checks that the process is alive.
- `http://localhost:5001/ready` checks that Prisma can access SQLite.

The root URL (`http://localhost:5001`) returns API status information. If SQLite reports a native Node-version mismatch, use Node 24 from `.nvmrc` and run `npm rebuild better-sqlite3`.

Demo accounts use the password `ArcherDemo123!`:

- `admin@archer.local`
- `client1@archer.local`
- `freelancer1@archer.local`

## Routes implemented in the first vertical slice

- `GET /health`
- `GET /ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `POST /api/v1/projects/:id/publish`
- `GET /api/v1/reference/categories`
- `GET /api/v1/reference/skills`
- `GET /api/v1/profiles/me`
- `PATCH /api/v1/profiles/me`
- `GET /api/v1/profiles/freelancers`
- `GET /api/v1/profiles/freelancers/:id`
- `GET /api/v1/proposals`
- `POST /api/v1/proposals/projects/:projectId`
- `POST /api/v1/proposals/:id/withdraw`
- `POST /api/v1/proposals/:id/shortlist`
- `POST /api/v1/proposals/:id/reject`
- `POST /api/v1/proposals/:id/accept`
- `GET /api/v1/projects/saved`
- `POST /api/v1/projects/:id/save`
- `DELETE /api/v1/projects/:id/save`
- `GET /api/v1/engagements`
- `GET /api/v1/engagements/:id`
- `POST /api/v1/engagements/:id/submit`
- `POST /api/v1/engagements/:id/complete`
- `POST /api/v1/engagements/:id/cancel`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/messages`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/:id/read`
- `POST /api/v1/reviews`
- `GET /api/v1/reviews/users/:userId`

All monetary values use integer minor units with an explicit `USD` or `THB` currency code. Payments, exchange rates, escrow, and payouts are not implemented.
