# CaseHub

Case-management workspace for post-live amends: time tracking, a step-by-step case wizard,
session logs, case history/archive, announcements, quick links and a file-name generator.

Next.js (Pages Router) + React 19 + Supabase. The UI is a single client-rendered page at `/`
that switches screens with an internal `page` state; `/api/*` routes talk to Supabase.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm test` | Vitest suite (services, API handlers, auth, models, UI smoke) |

### Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `server/db/supabase.js` | required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `server/db/supabase.js` | required (or the publishable key below) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `server/db/supabase.js` | alternative to the anon key |
| `API_AUTH_MODE` | `server/http/auth.js` | optional: `off` (default), `log`, `enforce` — see [API authentication](docs/ARCHITECTURE.md#api-authentication) |

If the URL or key is missing, every API route answers `503` with an explanatory message.

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full guide. In short:

```
pages/     Next.js routes only: thin entry (index.js), _app/_document, and /api handlers
server/    Server-only code: Supabase client, API guards, DB<->client mappers
src/       Browser code (alias "@/"): core, views, components, hooks,
           services, models, config, utils, styles
supabase/  SQL migrations
```
