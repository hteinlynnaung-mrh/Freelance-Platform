# Archer project instructions

## Project shape

- `app/` is the React/Vite website.
- `api/` is the independent Express/Prisma/SQLite API.
- `mobile/` is the Expo React Native app (iOS + Android). It was re-introduced and consumes the same `/api/v1` contract.
- Keep all three independently runnable; integrate through the documented HTTP API.

## Local development

- Use Node 24 for the API, as recorded in `api/.nvmrc`.
- Use npm and install dependencies from the directory being worked on.
- Website: run `npm run dev` in `app/`; it serves on port `5000`.
- API: run `npm run dev` in `api/`; it serves on port `5001`.
- Mobile: run `npm run dev` in `mobile/`; opens the Expo dev server. Scan QR with Expo Go or press `i`/`a` for simulator.
  - Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your machine's LAN IP when testing on a physical device (e.g. `http://192.168.1.x:5001`). Leave as `http://localhost:5001` for simulators.
- The website uses the Vite `/api` proxy in local development. Keep `app/.env` `VITE_API_URL` empty unless a remote API is intentional.
- Do not commit secrets. Use `.env.example` files as templates.

## Implementation standards

- Use TypeScript and preserve the existing React, React Router, TanStack React Query, Express, Prisma, and Zod patterns.
- Validate request input at API boundaries and enforce authorization in the API, not only in the UI.
- Keep API responses and errors consistent with the existing `/api/v1` contract.
- Store money with an explicit `USD` or `THB` currency and integer minor units. Do not add payment, exchange-rate, escrow, or payout behavior without an explicit request.
- Prefer small, focused changes and do not rewrite unrelated user work.

## English/Burmese i18n

- Follow the project-local skill at `.cursor/skills/burmese-i18n/SKILL.md` for translated UI work.
- Add user-facing copy to both locale dictionaries and use the existing i18n provider rather than hardcoded component strings.
- Do not translate every technical or well-known UI term when English is clearer.
- Burmese text must have font-appropriate vertical space and must not use custom `letter-spacing`.
- Avoid fixed heights, clipping, and single-line assumptions that can break Burmese text.

## Verification

Before handing off changes, run the narrowest relevant checks. For website changes:

```bash
npm --prefix app run typecheck
npm --prefix app run build
```

For API changes:

```bash
npm --prefix api run typecheck
npm --prefix api run build
npm --prefix api test
```

When database schema or seed data changes, also run the appropriate Prisma generate, migration, and seed commands with care for existing local data.

For mobile changes:

```bash
npm --prefix mobile run typecheck
```

## Mobile implementation standards

- Use the same TypeScript patterns. Components use NativeWind v4 `className` props; avoid raw `StyleSheet` unless necessary.
- Mirror i18n keys between `mobile/src/i18n/translations.ts` and `app/src/i18n/translations.ts`. Add to both.
- Burmese typography rules from `.cursor/skills/burmese-i18n/SKILL.md` apply on mobile too: use `leading-relaxed` for Burmese text, no `letterSpacing`, no fixed heights that clip glyphs.
- Store auth tokens in `expo-secure-store` only. Never log tokens.
- Prefer `useQuery` + `useMutation` from TanStack Query for all server state.
