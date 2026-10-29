# Archer Web Application

Independent web application frontend for the Archer freelance marketplace platform.

## Overview

The Archer web app is a single-page application built with React, Vite, and TypeScript. It communicates with the independent backend service via the `/api/v1` REST contract.

## Technology Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router v7
- **Data Fetching & Caching**: TanStack React Query v5
- **Styling**: Tailwind CSS + shadcn-compatible UI primitives
- **Localization**: Custom English (`en`) and Japanese (`ja`) i18n provider
- **Testing**: Vitest

## Directory Structure

```
app/
├── src/
│   ├── api/              # API HTTP client and TypeScript types
│   ├── auth/             # AuthContext, AuthProvider, protected routes
│   ├── components/       # UI primitives, navbar, footer, cards
│   ├── i18n/             # Translations (en/ja) and I18nProvider
│   ├── lib/              # Formatting, money calculations, helpers
│   ├── pages/            # Top-level route pages (Landing, Projects, Auth, etc.)
│   ├── theme/            # Theme context (Light/Dark/System)
│   ├── App.tsx           # Route setup and app root
│   └── main.tsx          # Application entry point
├── package.json
└── vite.config.ts
```

## Local Setup

Ensure you are using Node 24 (`nvm use`).

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The web app starts on `http://localhost:5000`.

### API Proxy

During local development, Vite proxies all `/api` requests to `http://localhost:5001`. Keep `VITE_API_URL` empty in `app/.env` so requests naturally proxy through Vite. Only specify `VITE_API_URL` if connecting to a remote or custom API URL.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start local Vite development server |
| `npm run build` | `tsc -b && vite build` | Type-check and build production bundle |
| `npm run preview` | `vite preview` | Locally preview production build |
| `npm run typecheck` | `tsc --noEmit` | Check TypeScript types without emitting files |
| `npm test` | `vitest run` | Run all unit and integration test suites |

## Testing

Testing is powered by Vitest, focusing on core domain logic, currency formatting, and translation integrity:

```bash
npm test
```

### Test Suites

- `src/lib/money.test.ts`: Verifies money calculations (`toMinorUnits`) and currency formatting for USD (`$5,000`) and JPY (`¥10,000`, whole yen without decimals).
- `src/lib/proposals.test.ts`: Verifies proposal status mapping to i18n translation keys.
- `src/i18n/translations.test.ts`: Ensures 100% key parity between English and Japanese translations across primary and supplemental dictionaries.

## Key Features & Conventions

- **Authentication**: Stores JWT access and refresh tokens in browser `localStorage`. Authenticated state is restored on page refresh.
- **Currencies**: Displays `USD` and `JPY` amounts stored in integer minor units. JPY amounts never display decimals.
- **Themes**: Supports light and dark modes, persisting choices to `localStorage` and applying both `data-theme="dark"` and the `dark` class to `document.documentElement`.
- **Localization**: Supports English and Japanese with relaxed line-heights and no clipped glyphs.
