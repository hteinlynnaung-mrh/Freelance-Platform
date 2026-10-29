# Archer

Archer is a freelance marketplace foundation for connecting clients with independent talent. The repository contains three independently runnable clients/services that share the versioned `/api/v1` HTTP contract:

- `app/` — React/Vite website
- `api/` — Express/Prisma/SQLite API
- `mobile/` — Expo React Native app

The current MVP includes public project discovery, project details, authentication, saved projects, profiles, proposals, engagements, conversations, notifications, reviews, and seeded demo data. Payment processing, escrow, payouts, invoices, and automatic exchange-rate conversion are intentionally out of scope.

## Technology

- Web: React 18, TypeScript, Vite, React Router, TanStack React Query, Tailwind/shadcn-compatible UI, English/Japanese i18n
- API: Node.js 24, Express 5, TypeScript, Prisma 7, SQLite, Zod, JWT access tokens, rotating hashed refresh tokens
- Mobile: Expo SDK 58, Expo Router, React Native, NativeWind, TanStack React Query, Expo Secure Store, light/dark/system appearance
- Supported listing currencies: US Dollar (`USD`) and Japanese Yen (`JPY`/`¥`)

## Requirements

- Node.js 24.19.x is recommended for all workspaces and required for the API verification environment (`api/.nvmrc` and `app/.nvmrc`).
- npm
- Expo Go or an iOS/Android simulator for mobile development

Install dependencies from each project directory:

```bash
npm --prefix api install
npm --prefix app install
npm --prefix mobile install
```

## Run locally

### 1. Prepare and start the API

```bash
npm --prefix api run db:generate
npm --prefix api run db:migrate -- --name init
npm --prefix api run db:seed
npm --prefix api run dev
```

The API listens on `http://localhost:5001` by default. Check:

- `http://localhost:5001/` — service status
- `http://localhost:5001/health` — liveness check
- `http://localhost:5001/ready` — SQLite/Prisma readiness check

### 2. Start the web app

```bash
npm --prefix app run dev
```

Open `http://localhost:5000`. Vite proxies `/api` requests to `http://localhost:5001`. Keep `app/.env` `VITE_API_URL` empty for this local setup. Use `VITE_API_URL` only when intentionally connecting to a remote API.

### 3. Start the mobile app (optional)

```bash
npm --prefix mobile run dev
```

`mobile/.env` can stay empty: the app derives the API host at runtime — `http://localhost:5001`
on the iOS Simulator and `http://10.0.2.2:5001` on the Android emulator — and reuses the Metro
dev-server host (your LAN IP) on a physical device. Set `EXPO_PUBLIC_API_URL` only for an API that
is not running on the machine hosting Metro, for example `http://192.168.1.100:5001`.

There are no Docker or container commands required by this repository.

## Environment files

- `api/.env.example` — API port, SQLite URL, JWT secret, token lifetimes, and CORS origins
- `app/.env.example` — optional `VITE_API_URL`
- `mobile/.env.example` — `EXPO_PUBLIC_API_URL`

Copy the appropriate example before changing environment-specific values. Never commit real secrets. The API requires a development `JWT_ACCESS_SECRET` of at least 32 characters.

## Demo accounts

The seed command creates demo accounts with the local-only password `ArcherDemo123!`:

- `admin@archer.local` — username `admin`
- `client1@archer.local` — username `client1`
- `freelancer1@archer.local` — username `freelancer1`

Sign in on the web with the email address; the API also accepts the username as an identifier.

The seed also creates 50 client accounts, 100 freelancer accounts, 20 skills, 8 categories, and 250 projects with a mix of published/non-published statuses and USD/JPY currencies.

## Web behavior

The website routes are:

- `/` — landing page
- `/projects` — searchable/filterable project marketplace
- `/projects/:id` — published project detail
- `/login` — sign in
- `/register` — account registration

The web session stores access/refresh tokens and the current user in browser `localStorage`. Authenticated requests include the access token. The navbar restores the current user from storage or `/api/v1/auth/me`, and provides sign-out. The mobile app stores tokens in Expo Secure Store and refreshes expired access tokens automatically.

The web theme toggle persists light/dark mode on `<html>` using both `data-theme` and the `dark` class. Web translations are English and Japanese; mobile mirrors the same supported locales. Currency formatting keeps USD and JPY explicit and displays JPY without a dollar sign or decimal places.

## Verification

Run the narrowest relevant checks after changes:

```bash
npm --prefix app run typecheck
npm --prefix app run build
npm --prefix api run typecheck
npm --prefix api run build
npm --prefix api test
npm --prefix mobile run typecheck
```

For database changes, regenerate Prisma and apply the migration/seed commands against a development database only. Do not run seed or destructive database commands against production data.

## Further documentation

- [SPEC.md](SPEC.md) — current architecture, API contract, domain rules, and MVP boundaries
- [TODO.md](TODO.md) — implemented work, partial features, and remaining roadmap
- [api/README.md](api/README.md) — API setup and route inventory
- [app/README.md](app/README.md) — web-specific setup
- [mobile/README.md](mobile/README.md) — mobile-specific setup
