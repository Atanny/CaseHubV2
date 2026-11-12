# Architecture

## Why it looks like this

CaseHub began as one 9,700-line `pages/index.js` (components, hooks, 1,600 lines of CSS in a
string, IndexedDB helpers and 57 inline `fetch` calls). It was split by responsibility, borrowing
Laravel's separation of concerns while staying idiomatic for Next.js/React.

| Laravel concept | Here |
|---|---|
| Routes | `pages/` (Next routes) + `src/config/routes.js` (in-app screens) |
| Controllers | Screen orchestration in `src/views/*Page.jsx` and `src/hooks/*` |
| Models | `src/models/` (case shapes, merge rules) and `server/mappers/` (DB <-> client) |
| Services | `src/services/*` (browser -> API, storage, files) |
| Views / Blade layouts | `src/views/`, `src/components/`, `src/components/layout`, `src/components/navigation` |
| Middleware | `server/http/guards.js` (API guard) |
| Config | `src/config/` |
| Public assets / styles | `src/styles/` |

> The in-app screens live in `src/views/`, **not** `src/pages/`, because Next.js reserves `pages/`.
> Likewise `src/core/` (not `src/app/`) avoids Next's App Router directory detection.

## Directory guide

```
pages/
  index.js            client-only entry (dynamic, ssr:false -> src/core/CaseHubApp)
  _app.js             imports global CSS in cascade order
  _document.js        font <link> tags (preconnect + stylesheet)
  api/                one file per resource; thin, uses server/ helpers

server/               server-only (alias "@server/")
  db/supabase.js      the Supabase client (null when env vars are missing)
  http/guards.js      rejectIfNoDb(res) -> 503 guard used by every route
  http/auth.js        opt-in token + ownership checks (API_AUTH_MODE), see "API authentication"
  mappers/caseMapper.js   caseToDb / dbToCase

src/                  browser code (alias "@/")
  core/               app composition root
    CaseHubApp.jsx      auth gate, layout shell, screen switch
    lazyViews.js        route-level code splitting (next/dynamic)
    ShellContext.js     break / meeting / log-out actions shared with every page header
    appLoadTime.js      timestamp captured when the bundle first loads
  views/              one folder per screen; feature-specific parts stay with the feature
    Auth/ Dashboard/ PostLive/ History/ SessionLog/ Archive/
    Announcements/ Links/ Profile/ FileNameGenerator/
  components/
    ui/ (Icon, LineIcon, Toast, AlarmOverlay)  layout/ (PageHeader, SessionBanners)  navigation/ (Sidebar = icon rail)
  hooks/              app-level stateful logic (alarms, breaks, session log, data loading, ...)
  services/           API clients (return the raw Response), storage, IndexedDB, downloads
  models/             case defaults and merge rules
  config/             nav/routes, wizard steps, checklist labels, fonts
  utils/              framework-independent helpers
  styles/             see below
```

### Request flow

`View/Hook` -> `src/services/*Service.js` -> `fetch('/api/...')` -> `pages/api/*` -> `server/db/supabase.js`.

Every call goes through `src/services/http.js`, which adds the `Authorization: Bearer` header and
transparently refreshes an expired token once. Service functions return the raw `Response` (same contract as `fetch`), so callers keep their own
`res.ok` handling. Components never build API URLs themselves.

### Screens and lazy loading

`CaseHubApp` shows one screen at a time based on a persisted `page` value (`config/routes.js`).
History, Announcements, Links, Profile, Session Log and Archive are loaded on first visit.
**Not lazy on purpose:** `DashboardPage` (default screen), and `PostLivePage`, which stays mounted
(hidden) so an in-progress form survives navigation, along with `FileNameGeneratorPage`, which it uses.

### Styles

All CSS is global and lives in `src/styles/`. `index.css` imports the files in a fixed order and
**that order matters**: later layers (`refinements-chrome.css`, `refinements-ui.css`) intentionally
override earlier rules. Do not reorder without visually checking every screen. Consolidating those
override layers is a worthwhile follow-up but needs browser-based visual testing.

### Sharing state without prop drilling

Two big screens use React context instead of passing dozens of props to extracted children:
`PostLivePage` provides `PostLiveContext` (read with `usePostLive()` in `PostLiveFormView`) and
`FileNameGeneratorPage` provides `FngContext` (read with `useFng()` in its panels). Smaller,
self-contained pieces still take explicit props. Note: `PostLiveFormView` sits behind a Provider, so
switching between the post-live hub and the form view builds that subtree fresh instead of morphing the
hub's DOM nodes (the old code reused same-typed nodes by accident). The rendered DOM is identical.

## API authentication

Routes were originally open: they use the public anon key and trust the `email` the client sends.
`server/http/auth.js` adds token and ownership checks, **off by default** so nothing changes until you opt in.

| `API_AUTH_MODE` | Behavior |
|---|---|
| `off` (default) | No checks, no extra Supabase calls. |
| `log` | Verifies the bearer token and ownership, only logs `[api-auth] would reject ...`. |
| `enforce` | `401` for a missing/invalid token, `403` when acting on another user's data. |

What is checked: the token must be a valid Supabase access token (verified with `auth.getUser`, cached
for 60 s). Per-user resources (cases, drafts, archived drafts, links, profile, sessions) must belong to the
caller: the `email` in the query/body is compared with the token's user, and `[id]` routes look up the row's
owner. Shared resources (announcements, requestors) and utilities (images, grammar) only require sign-in.
`/api/auth/*` and `/api/db-status` stay public.

**Rollout:** deploy with `off` -> set `log`, use the app, and check the logs for `would reject` lines ->
set `enforce`. The client sends the token on every call and refreshes it on a 401, so long shifts keep working.

Limits to be aware of: image upload/delete are not checked per owner (paths carry no owner), and this is
defence in depth, not a replacement for Row Level Security on the Supabase tables, which are not defined in
this repo.

## Tests

`npm test` runs Vitest: service request contracts, token refresh, the API handlers (including `enforce`
mode against a stubbed database), auth, model helpers, and a jsdom smoke test that renders every screen.

## Design work

See [DESIGN_IMPLEMENTATION.md](DESIGN_IMPLEMENTATION.md) for which screens follow the Figma designs, deliberate
differences, and the remaining gaps. New UI uses real stylesheets (`rail.css`, `page-header.css`, `dashboard.css`)
instead of inline styles.

## Conventions

- Import across top-level folders with `@/...` (browser) or `@server/...` (server); use relative
  imports inside a view folder.
- Named exports everywhere; a component per file named after the file.
- Keep views thin: data/side-effect logic goes in hooks or services, not JSX.
- Don't call `fetch` directly for the app's own API; add a function to a service.
- Use `storage` from `@/services/storage` for guarded `localStorage` access.

## Known issues and follow-ups

1. **CSS override layers remain.** 220 declarations that were provably dead (a later rule with the identical
   selector and media context sets the same property) were removed, verified by recomputing the cascade
   winner for every property of every distinct element in the rendered screens (17,230 values, 0 changes).
   `refinements-chrome.css` and `refinements-ui.css` still override earlier files; merging them further
   changes which of several different selectors wins and needs visual testing in a browser.
2. **Lint warnings.** `npm run lint` has 0 errors. Remaining warnings are React Compiler rules
   (components declared inside render, `Date.now()` in render, setState in effects), `exhaustive-deps`
   and `<img>` usage. Fix them gradually.
3. **Largest files** are now `CaseHubApp.jsx` (~520 lines), `PostLiveForm.jsx` (~460), `SessionTimeLog.jsx`
   and `PostLiveFormView.jsx` (~350 each). Further splitting is possible but yields diminishing returns.
4. **Row Level Security** for the Supabase tables should be reviewed and committed as migrations.
