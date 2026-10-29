# Archer API

Independent Express API for the Archer freelance marketplace platform.

## Overview

The Archer API is an independent Node.js/Express service providing the versioned `/api/v1` HTTP REST contract. It handles authentication, user profiles, project marketplace discovery, proposals, engagements, reviews, notifications, and reference data.

## Technology Stack

- **Runtime**: Node.js 24 (see `.nvmrc` — Node 25 is not supported by Prisma 7)
- **Framework**: Express 5 (TypeScript)
- **Database**: SQLite via Prisma 7 and `@prisma/adapter-better-sqlite3`
- **Validation**: Zod request schema validation
- **Authentication**: JWT access tokens (15m expiry) and rotating, hashed opaque refresh tokens (30d expiry)
- **Testing**: Vitest + Supertest

## Directory Structure

```
api/
├── prisma/               # Prisma schema, migrations, and database seed
├── src/
│   ├── lib/              # Errors, tokens, password hashing utilities
│   ├── middleware/       # Authentication, authorization, and error middleware
│   ├── routes/           # Versioned REST route controllers
│   ├── app.ts            # Express app configuration & middleware pipeline
│   ├── config.ts         # Environment configuration
│   ├── prisma.ts         # Prisma client instance
│   └── server.ts         # HTTP server listener
├── tests/                # Integration & boundary test suites
├── .env.example          # Environment template
└── package.json
```

## Local Setup

Ensure you are using Node 24 (`nvm use`).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Initialize SQLite database & apply migrations
npm run db:generate
npm run db:migrate -- --name init

# 4. Seed demo data (demo accounts, categories, skills, projects)
npm run db:seed

# 5. Start development server
npm run dev
```

The API starts on `http://localhost:5001`.

### Health & Diagnostic Endpoints

- `GET /` — API status and version metadata
- `GET /health` — Process liveness probe
- `GET /ready` — Database / Prisma connectivity probe

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `tsx watch src/server.ts` | Start dev server with auto-reload |
| `npm run build` | `tsc -p tsconfig.json` | Compile TypeScript to `dist/` |
| `npm run start` | `node dist/src/server.js` | Run compiled production build |
| `npm run typecheck` | `tsc --noEmit -p tsconfig.json` | Type-check TypeScript sources |
| `npm test` | `vitest run tests/*.test.ts` | Run all test suites |
| `npm run db:generate` | `prisma generate` | Generate Prisma client code |
| `npm run db:migrate` | `prisma migrate dev` | Apply database migrations |
| `npm run db:seed` | `tsx prisma/seed.ts` | Seed development database |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |

## Testing

Testing is powered by Vitest and Supertest, testing API request boundaries and domain rules:

```bash
npm test
```

### Test Suites (`tests/`)

- `health.test.ts`: Verifies root diagnostic endpoints (`/`, `/health`).
- `api.test.ts`: Verifies authentication barriers (401 unauthorized), request validation errors (400 validation format), credentials validation, and full account lifecycle (register -> delete account with password verification).
- `projects.test.ts`: Verifies project listing with pagination, currency filtering (`USD` vs `JPY`), 404 behavior for unknown projects, project creation access control, and currency parity validation on proposal submissions.

## Domain Rules & Architecture

1. **Currency & Minor Units**:
   - Supported currencies are `USD` and `JPY` only.
   - Money is strictly stored as integer minor units (e.g. cents or whole yen minor units).
   - Proposal currency must match the project currency.
   - Payments, exchange rate conversions, escrow, and payouts are deliberately out of scope.

2. **Authorization & Roles**:
   - Roles include `CLIENT`, `FREELANCER`, and `ADMIN`.
   - Access tokens are bearer tokens verified by the `requireAuth` middleware.
   - Domain and role checks are enforced directly in route handlers.

## Seeded Demo Accounts

All demo accounts share the password: `ArcherDemo123!`

- `admin@archer.local` (Username: `admin`, Role: `ADMIN`)
- `client1@archer.local` (Username: `client1`, Role: `CLIENT`)
- `freelancer1@archer.local` (Username: `freelancer1`, Role: `FREELANCER`)
