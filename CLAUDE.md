# Archer project guidance

This file keeps Claude-compatible tooling aligned with the repository instructions in [AGENTS.md](AGENTS.md). Read and follow `AGENTS.md` first.

## Important project facts

- The project contains two independent parts: `app/` (React/Vite website) and `api/` (Express API).
- Mobile is out of scope and must not be reintroduced unless explicitly requested.
- Local website port: `5000`.
- Local API port: `5001`.
- API development requires Node 24; see `api/.nvmrc`.

## Required conventions

- Preserve existing TypeScript and project patterns.
- Keep authorization and validation in the API.
- Keep `USD` and `THB` explicit and do not imply payment or currency conversion support.
- For English/Burmese UI, follow `.cursor/skills/burmese-i18n/SKILL.md`.
- Burmese text needs natural or larger line-height, enough vertical space, and no custom `letter-spacing`.
- Do not translate every technical or familiar UI term; retain English where it is clearer.
- Avoid unrelated rewrites and do not commit secrets.

## Checks

Run the relevant commands before reporting completion:

```bash
npm --prefix app run typecheck
npm --prefix app run build
npm --prefix api run typecheck
npm --prefix api run build
npm --prefix api test
```
