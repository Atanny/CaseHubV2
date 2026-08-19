# CaseHub — Rebuild

## Milestones
- **Milestone 1 — Foundation**: project scaffold, design tokens, shared shell (Sidebar, AppLayout,
  PageHeader, base UI kit).
- **Milestone 2 — Auth**: Login + Sign Up pages, auth service, session hook, route guard. All app
  pages are protected.
- **Milestone 3 — Announcements (this build)**: full CRUD feed — create/edit/delete posts, search,
  filter by type, delete confirmation, toasts, real Supabase-backed API routes.

Each milestone zip is the complete, cumulative project — you only need the latest one.

## Setup
```
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Verified
`npm run build` compiles all 17 routes (13 pages + 3 API routes + `/`) with no errors.

## What's new in Milestone 3
- `src/pages/api/announcements/index.js` + `[id].js` — list/create/update/delete, ported from the
  legacy API routes, using the shared `lib/supabase.js` client
- `src/services/announcementsService.js` — client-side CRUD wrapper
- `src/components/announcements/` — `ComposerCard` (create/edit form), `AnnouncementCard` (feed
  card), `SearchFilterRow`, `badgeHelpers.js` (badge color/label/initials)
- `src/components/ui/Pill.jsx`, `src/components/ui/Modal.jsx`, `src/components/ui/Toast.jsx` —
  new reusable primitives, used here and available for every future page
- `src/pages/announcements.js` — wires it all together: loading/error/empty states, search +
  filter, edit-in-place, delete confirmation modal, toast feedback

### A design decision carried over from the legacy app
The Figma mockup for this page shows likes, bookmarks, and image attachments on each card, plus a
separate "Saved Updates" panel. None of those exist in the real data model — announcements only
have `title`, `body`, `badge`, `author`, and `createdAt`, and there's no bookmarking table. The
previous developer deliberately left those out rather than fake interactive UI with nothing behind
it, and kept the parts of the Figma layout that do map to real data (card structure, composer
panel, badge styling, filter row). I made the same call here, per the brief's own priority order —
new design for visual appearance, but don't fabricate functionality the design implies but the
product doesn't have. Flag it if you'd rather I add a real `saved`/`liked` field to the schema and
build those out properly.

## Not yet built (next milestones)
- Feature pages: Dashboard content, Post-Live Amends, Case History, Archived Cases, Session Log,
  Quick Links, File Name Generator, Profile
- Break-timer / shift-alarm / open-hour system (ported from the legacy `AppContext`)
- Remaining Supabase service layer + API routes for the pages above

## Design fidelity notes (cumulative)
- Colors, shadows, radii, and type scale come from the Figma file's published styles.
- **Moderustic** (headings) still falls back to Poppins — add the licensed font files to
  `/public/fonts` and uncomment the `@font-face` block in `src/styles/globals.css` for pixel-exact
  headings.
