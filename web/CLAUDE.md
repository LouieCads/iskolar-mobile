# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build

npm run check        # SvelteKit sync + svelte-check type checking
npm run check:watch  # Watch mode type checking

npm run lint         # Prettier check + ESLint
npm run format       # Auto-format with Prettier

npm run test         # Run all tests once (CI mode)
npm run test:unit    # Run tests with Vitest UI
```

## Architecture

This is the **admin web frontend** for iSkolar — a scholarship management platform. It is a **SvelteKit 2 + Svelte 5** app deployed to Netlify, communicating with the Express backend in `../server/`.

### Svelte 5 Runes

Runes mode is enabled for all source files (configured in `svelte.config.js`). Use `$state`, `$derived`, `$effect`, `$props` — not the old `writable`/`readable` store APIs.

### Routing

File-based routing under `src/routes/`. Route groups organize pages without affecting URLs:

- `(auth)/` — unauthenticated pages (login, etc.)
- `(admin)/` — protected admin pages (dashboard, scholarship management, user management)

### Testing

Tests are split into two Vitest projects (see `vite.config.ts`):

- **`client`** — browser tests via Playwright/Chromium. File pattern: `*.svelte.{test,spec}.{js,ts}`
- **`server`** — Node environment tests. File pattern: `*.{test,spec}.{js,ts}` (excludes `.svelte.` tests)

All tests must include at least one assertion (`expect.requireAssertions = true`).

### Backend

The Express backend runs on port 5000. Refer to `../server/CLAUDE.md` for API contracts, data models, and response helpers. Key context:

- All HTTP responses follow helpers from `utils/responses.ts` (`ok`, `badRequest`, `notFound`, etc.)
- Auth uses JWT Bearer tokens — store and attach as `Authorization: Bearer <token>` header
- UUIDs are used for all primary keys

### Code Style

- Tabs for indentation, single quotes, 100-char line width (enforced by Prettier)
- TypeScript strict mode — no implicit `any`
- Run `npm run format` before committing; `npm run lint` validates both formatting and ESLint rules
