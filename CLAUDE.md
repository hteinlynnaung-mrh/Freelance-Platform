# Archer project guidance

Read and follow AGENTS.md first. This file keeps Claude-compatible tooling aligned with the repository current architecture and conventions.

## Current architecture

- app/ is the React/Vite web client on port 5000.
- api/ is the Express/Prisma 7/SQLite service on port 5001; api/API.md documents the /api/v1 contract.
- mobile/ is the Expo SDK 58/React Native client. Mobile is in scope and must not be removed or treated as obsolete.
- The three projects communicate through /api/v1; keep their package manifests and development commands independent.
- There is no mcp/ directory; the repository contains only app/, api/, and mobile/ plus the root docs.
- Docker/container files are intentionally not part of the project.

## Required conventions

- Preserve TypeScript and the existing React, React Router, TanStack Query, Express, Prisma, Zod, Expo Router, and NativeWind patterns.
- Keep validation and authorization in the API.
- Keep USD and JPY explicit, stored as integer minor units. Do not imply payment processing or automatic currency conversion.
- Use the existing English/Japanese i18n providers and dictionaries for user-facing copy.
- Follow the locale and typography rules in AGENTS.md; the product UI is English/Japanese only.
- Preserve dark-mode variants for all web surfaces and use dark: variants in mobile NativeWind classes.
- Do not commit secrets or rewrite unrelated user changes.

## Auth and theme facts

- Web sign-in/register store the session in localStorage, attach the access token to API requests, restore the account in the navbar, and support sign-out. app/src/api/client.ts performs transparent 401 → refresh → retry, and `ProtectedRoute` guards authenticated and role-restricted routes.
- Mobile sign-in/register use Expo Secure Store and have access-token refresh handling in AuthContext.
- Web theme state persists through data-theme, the dark class, and localStorage (light/dark); mobile supports a Light/Dark/System switch.

## Checks

Run the relevant commands before reporting completion:

    npm --prefix app run typecheck
    npm --prefix app run build
    npm --prefix app test
    npm --prefix api run typecheck
    npm --prefix api run build
    npm --prefix api test
    npm --prefix mobile run typecheck
    npm --prefix mobile test

See TODO.md for remaining implementation work, SPEC.md for the current API/domain contract, and api/API.md for per-endpoint details.
