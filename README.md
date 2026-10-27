# Archer

Archer is a freelance marketplace foundation. It connects clients and freelancers through project listings, profiles, proposals, engagements, messaging, notifications, and reviews. Payment processing, escrow, payouts, invoices, and currency conversion are intentionally not implemented.

## Repository layout

```text
app/      React + Vite website
api/      Express + Prisma 7 + SQLite API
mobile/   Expo React Native app
```

The website, API, and mobile app remain independently runnable. Docker runs the website and API together; Expo mobile continues to run from the host so it can connect to a simulator or physical device.

## Technology

- Website: React, TypeScript, Vite, React Router, TanStack React Query, shadcn-compatible UI
- API: Express 5, TypeScript, Prisma 7, SQLite, JWT authentication, Zod validation
- Local currencies: USD and Thai Baht (`THB`/`฿`), stored explicitly without automatic conversion
- Local languages: English and Burmese

## Requirements

- Node.js 24 for the API (`api/.nvmrc`)
- npm

## Run locally

Install dependencies in each independent project:

```bash
npm --prefix api install
npm --prefix app install
```

Prepare the API database if needed:

```bash
npm --prefix api run db:generate
npm --prefix api run db:migrate -- --name init
npm --prefix api run db:seed
```

Start the API in one terminal:

```bash
npm --prefix api run dev
```

Start the website in another terminal:

```bash
npm --prefix app run dev
```

Open [http://localhost:5000](http://localhost:5000). The website forwards local `/api` requests to [http://localhost:5001](http://localhost:5001).

## Run with Docker

Build and start the website and API:

```bash
docker compose up --build
```

Open [http://localhost:5000](http://localhost:5000). The API is available at [http://localhost:5001](http://localhost:5001), and its SQLite database is persisted in the `api-data` Docker volume. The API container applies Prisma migrations and runs the idempotent demo seed on startup.

If port `5000` is already in use, start the web container on another host port, for example:

```bash
WEB_PORT=5050 docker compose up --build
```

Stop the containers:

```bash
docker compose down
```

To remove the persisted demo database as well, use `docker compose down --volumes`.

The Expo mobile app is not included in the Compose stack. Start it with `npm --prefix mobile run dev`; use `http://localhost:5001` for a simulator or your machine's LAN IP on a physical device.

Verify the API with:

- [http://localhost:5001/health](http://localhost:5001/health)
- [http://localhost:5001/ready](http://localhost:5001/ready)

The API root returns a small status response; `/health` and `/ready` provide dedicated health checks.

## Environment files

- `app/.env.example` documents `VITE_API_URL`. Leave it empty for the local Vite proxy.
- `api/.env.example` documents the API port, SQLite database, JWT secrets, token lifetimes, and CORS origins.
- Never commit production secrets. Replace the development JWT secret before deployment.

## Demo accounts

All seeded demo accounts use `ArcherDemo123!`:

- `admin@archer.local`
- `client1@archer.local`
- `freelancer1@archer.local`

## Useful checks

```bash
npm --prefix app run typecheck
npm --prefix app run build
npm --prefix api run typecheck
npm --prefix api run build
npm --prefix api test
```

## Internationalization

Use the language switcher in the website to change between English and Burmese. Translation files are in `app/src/i18n/`. Burmese UI follows language-specific typography: it has more vertical space, avoids custom letter spacing, and keeps technical or familiar UI terms in English when that is clearer. See [the local i18n skill](.cursor/skills/burmese-i18n/SKILL.md) for implementation rules.

## Project status

See [TODO.md](TODO.md) for implemented and not-yet-implemented functionality. The API route inventory is documented in [api/README.md](api/README.md).
