# CaseHub — Rebuild

## Milestones
1. **Foundation** — scaffold, design tokens, shared shell
2. **Auth** — Login + Sign Up, session hook, route guard
3. **Announcements** — full CRUD feed
4. **All pages except Post-Live** — Dashboard, Case History, Archived Cases, Session Log,
   Quick Links, Profile, File Name Generator
5. **Post-Live Amends (this build)** — the core case-creation/editing workflow

Every route in the app now has a real, working page. Each milestone zip is the complete,
cumulative project — you only need the latest one.

## Setup
```
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Verified
`npm run build` compiles all 30 routes (14 pages + 16 API routes) with no errors.

## What's in Post-Live Amends

A full case-creation workflow, reachable from Dashboard's Quick Actions or the sidebar:

1. **Mode picker** — Site Comment vs Inbound Email, plus a list of suspended drafts to resume
2. **Case Information** — case #, account #, amend type, business name/suffix, requestor name
   with **autocomplete + special-requestor highlight** (checks against the list managed in
   Profile), customer email, complexity (Minor/Complex/Major), in-progress flag
3. **Entries** — unlimited Site Comments / Assumptions, each with a number (Site Comment mode),
   note, and clarification — with a **Grammar Check** button per field (proxies LanguageTool's
   free API through `/api/grammar`) and a save/edit toggle per entry
4. **Screenshots** — Before, After, and unlimited Backup screenshots, each uploading straight to
   Supabase storage via `/api/images/upload`, with click/drag-drop/**paste (Ctrl+V)** support and
   per-shot naming pulled from Profile's file-naming settings
5. **Devices Tested** and **QA Checklist** — the same checklist fields Case History reads
6. **Tracker Checklist Link**
7. **Email** (Inbound mode only) — recipient, Clarification/Completed type toggle, and a
   generated email body built from the entries, ready to copy
8. **Live Summary sidebar** — elapsed timer, check-in message chips (from Profile), click-to-copy
   case #/account #/business name, and the special-requestor warning
9. **Save Case** (writes to `cases`, the same table Case History and Dashboard read), **Suspend**
   (saves to `drafts` — reappears in the mode picker's draft list to resume later), or **Cancel**
   (with a confirmation, since it discards unsaved work)

New backend: `src/pages/api/drafts/` (list/upsert/update/delete, dedupes by case number so
resuming and re-suspending the same case updates one row) and `src/pages/api/grammar.js`.

## What's intentionally simplified from the legacy app (and why)
The legacy Post-Live page is ~2,000 lines built around a Chrome-tab-style system for running
**several cases concurrently** with per-tab countdown timers, auto-advancing queues, prolonged-mode
warnings, and deep integration with the live session clock (time-in/out, breaks, session log
entries per case). That whole apparatus is really the break-timer/shift-alarm system I flagged as
its own milestone — it doesn't change what a case *is*, only how many you can have open at once
and how the session clock reacts. This build gives you the full single-case editor — every field,
every real behavior — without that concurrency/timer layer. Two smaller pieces were also
streamlined:
- **Image upload** drops the IndexedDB staging (images used to sit in the browser's local DB until
  the case was saved, so they'd survive a refresh before upload) — files upload to storage
  immediately on add instead, which is simpler and means they're safely stored the moment you add
  them, not just on save.
- **Bundle linking** (marking two cases as related and prefilling one from the other) isn't
  included — it's a natural extension once the multi-tab system above is built, since that's what
  tracks "the other case you have open."

Flag any of these if you want them built out now.

## Not yet built
- **Multi-case tabs + break-timer/shift-alarm live UI** — running several Post-Live cases at once
  with per-tab timers, and the countdown/alarm widget that reads Profile's timer settings and
  drives the write side of the sessions API (time-in, time-out, breaks, per-case logging). Session
  Log's read/delete side and Profile's settings are already built and ready for it.
- **Bundle linking** between cases (see above).

## Design fidelity notes (cumulative)
- Colors, shadows, radii, and type scale come from the Figma file's published styles, established
  in Milestone 1 and used consistently across every page since.
- Announcements and Auth were pixel-matched directly against their Figma frames. Every page since
  Dashboard (including Post-Live) follows that same design system but wasn't individually re-pulled
  from Figma node-by-node — flag it if you want a dedicated pixel-accuracy pass on any page.
- **Moderustic** (headings) still falls back to Poppins — add the licensed font files to
  `/public/fonts` and uncomment the `@font-face` block in `src/styles/globals.css`.
