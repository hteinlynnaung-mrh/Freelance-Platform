# Archer project guidance

Read and follow AGENTS.md first. This file keeps Claude-compatible tooling aligned with the repository current architecture and conventions.

## Current architecture

- app/ is the React/Vite web client on port 5000.
- api/ is the Express/Prisma 7/SQLite service on port 5001.
- mobile/ is the Expo SDK 52/React Native client. Mobile is in scope and must not be removed or treated as obsolete.
- The three projects communicate through /api/v1; keep their package manifests and development commands independent.
- Docker/container files are intentionally not part of the project.

## Required conventions

- Preserve TypeScript and the existing React, React Router, TanStack Query, Express, Prisma, Zod, Expo Router, and NativeWind patterns.
- Keep validation and authorization in the API.
- Keep USD and JPY explicit, stored as integer minor units. Do not imply payment processing or automatic currency conversion.
- Use the existing English/Japanese i18n providers and dictionaries for user-facing copy.
- Follow .cursor/skills/burmese-i18n/SKILL.md for the project locale and typography rules; the product UI itself is English/Japanese.
- Preserve dark-mode variants for all web surfaces and use dark: variants in mobile NativeWind classes.
- Do not commit secrets or rewrite unrelated user changes.

## Auth and theme facts

- Web sign-in/register store the session in localStorage, attach the access token to API requests, restore the account in the navbar, and support sign-out.
- Mobile sign-in/register use Expo Secure Store and have access-token refresh handling in AuthContext.
- Web theme state persists through data-theme, the dark class, and localStorage.

## Checks

Run the relevant commands before reporting completion:

    npm --prefix app run typecheck
    npm --prefix app run build
    npm --prefix api run typecheck
    npm --prefix api run build
    npm --prefix api test
    npm --prefix mobile run typecheck

See TODO.md for remaining implementation work and SPEC.md for the current API/domain contract.
