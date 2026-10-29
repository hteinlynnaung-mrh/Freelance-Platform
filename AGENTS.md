# Archer project instructions

## Project shape

- app/ is the React/Vite website on port 5000.
- api/ is the independent Express/Prisma/SQLite API on port 5001.
- mobile/ is the Expo React Native app. It consumes the same /api/v1 contract as the website.
- Keep all three projects independently runnable. Integrate them through the documented HTTP API rather than importing code across projects.
- Docker files are intentionally absent. Use the Node/npm commands in the READMEs.

## Local development

- Use Node 24.19.x for the API and web app, as recorded in api/.nvmrc and app/.nvmrc.
- Use npm and install dependencies from the project being worked on.
- Website: npm run dev in app/; Vite serves port 5000 and proxies /api to port 5001.
- API: npm run dev in api/; Express serves port 5001.
- Mobile: npm run dev in mobile/; use Expo Go or press i/a for a simulator.
- Leave EXPO_PUBLIC_API_URL empty in mobile/.env so the app derives the API host from the Metro dev server (localhost for iOS/web, 10.0.2.2 for the Android emulator, the LAN IP for a physical device). Set it explicitly only for an API not running on the Metro host.
- Keep app/.env VITE_API_URL empty for the local Vite proxy unless a remote API is intentional.
- Do not commit secrets. Use .env.example files as templates.

## Implementation standards

- Use TypeScript and preserve the existing React, React Router, TanStack React Query, Express, Prisma, Zod, Expo Router, and NativeWind patterns.
- Validate request input at API boundaries and enforce authorization in the API, not only in the UI.
- Keep API responses and errors consistent with the existing /api/v1 contract.
- Store money as integer minor units with an explicit USD or JPY currency code. JPY display uses whole yen with no decimal places; do not infer currency from locale.
- Do not add payment, exchange-rate, escrow, payout, invoice, or tax behavior without an explicit product request.
- Prefer small, focused changes and preserve unrelated user work.
- Keep user-visible web and mobile copy in the locale dictionaries and use the existing i18n providers.
- Supported UI locales are English and Japanese. Japanese copy needs natural vertical space, relaxed line height where needed, no custom letter-spacing, and no fixed heights that clip glyphs.
- Web theme changes must work for both data-theme="dark" and the dark class. Check cards, navigation, forms, buttons, popovers, and mapped lists for contrast in both themes.
- Mobile appearance must work in light and dark: use paired classes (bg-white dark:bg-slate-900, text-slate-900 dark:text-slate-100) and verify through the in-app Light/Dark/System switch, including the tab bar and status bar.
- Web auth uses browser localStorage; mobile auth uses expo-secure-store. Never log access or refresh tokens.

## API boundaries

The API is mounted under /api/v1 and owns domain rules for authentication, profiles, projects, saved projects, proposals, engagements, conversations, notifications, reviews, and reference data. Role and ownership checks belong in API handlers.

The API currently supports USD and JPY only. Proposal currency must match the project currency. Payment execution and currency conversion are not implemented.

## Verification

Before handing off changes, run the narrowest relevant checks:

    npm --prefix app run typecheck
    npm --prefix app run build
    npm --prefix api run typecheck
    npm --prefix api run build
    npm --prefix api test
    npm --prefix mobile run typecheck

For schema or seed changes, also run the appropriate Prisma generate, migration, and seed commands carefully against local development data. Update README.md, SPEC.md, and TODO.md when the architecture or feature status changes.
