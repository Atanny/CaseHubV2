# CaseHub — Rebuild

## Milestones
1. **Foundation** — scaffold, design tokens, shared shell (Sidebar, AppLayout, PageHeader, base UI kit)
2. **Auth** — Login + Sign Up, session hook, route guard (all pages protected)
3. **Announcements** — full CRUD feed, search/filter, delete confirmation, toasts
4. **All remaining pages except Post-Live Amends (this build)** — Dashboard, Case History,
   Archived Cases, Session Log, Quick Links, Profile, File Name Generator — each with real
   functionality, backed by real API routes and services, not mockups.

Each milestone zip is the complete, cumulative project — you only need the latest one.

## Setup
```
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Verified
`npm run build` compiles all 27 routes (13 pages + 13 API routes + `/`) with no errors.

## What's in this build

**Dashboard** — greeting card, live stat cards, Pre-Live/Post-Live totals, latest announcement,
latest cases, an amendment-split donut chart, a weekly quota line chart, and a bar breakdown — all
computed from real `cases`/`archived-drafts`/`announcements` data, no mock numbers.

**Case History** — search (case #, account #, amend type, entry text), mode + date filters,
accordion browse, screenshot lightbox, plain-text case export, delete with confirmation, and an
inline editor for the case's core fields.

**Archived Cases** — view-only accordion browse of archived drafts, permanent delete.

**Session Log** — day-grouped time-in/out history with per-case duration/status and a breaks
sub-list, search by case #, date filter, delete.

**Quick Links** — full CRUD with an icon picker and drag-to-reorder, and it now actually feeds the
Sidebar's "Links" group — add a link here and it shows up in the nav immediately.

**Profile & Settings** — editable name/role, avatar upload (via the new `/api/images/upload`
route), check-in message templates with a live token preview, special-requestors list, per-field
screenshot file-naming, password change, the four timer/shift alarm cards (Combined Tracker, QA
Checklist, Shift Start, Shift End — these are localStorage-only in the legacy app too, ported via
the new `settingsService`), and a sign-out.

**File Name Generator** — the full token-based templating engine (`{nob}`, `{nobfull}`, `{nn}`,
`{page}`, `{badge}`, `{member}`, `{menu}`, `{pdf}`), business-info fields, unlimited dynamic lists
(Pages/Badges/Team/Menu/PDF), an editable-format modal with reset-to-default, per-section Copy All,
and localStorage persistence — across 10 tabs (Logo & Misc, Hero, Gallery, Before/After, Badges,
Team, Menu, Content Image, PDF, Hero Slider).

## What's intentionally different from the legacy app (and why)
- **File Name Generator** drops the Excel-import feature (loading `xlsx.js` from a CDN at runtime
  to parse an uploaded spreadsheet) and the "Auto-fill Active Form" sync with Post-Live's live tab
  data — both depend on the Post-Live Amends editor, which is its own milestone. Everything else
  — the templating engine, all 10 tabs, the format editor — is fully ported and working standalone.
- **Case History's "Edit Case"** is a focused editor for the case's core fields (case #, account #,
  amend type, customer info, tracker link), not the full image-upload/entries/device-checklist
  editor. That full editor (`EditableCaseCard` in the legacy app) is the same component the
  Post-Live Amends page uses to build a case in the first place, so it ships as part of that
  milestone rather than being built twice.
- **Case download** exports a clean `.txt` summary instead of the legacy app's File System Access
  API folder-picker (Chrome/Edge-only, and screenshots are already viewable/downloadable
  individually from the screenshot grid).
- **Announcements**: see the Milestone 3 note — likes/bookmarks/image attachments in the Figma
  mockup aren't backed by real data fields, so they're left out rather than faked.

Flag any of these if you'd rather have the fuller version built out now instead of waiting.

## Not yet built
- **Post-Live Amends** — the core case-creation/editing workflow (site comment & inbound email
  modes, grammar check, image upload with backup screenshots, requestor autocomplete, device
  checklist, drafts/bundling, email composition). This is ~2,000 lines in the legacy app and is
  its own milestone.
- **Break-timer / shift-alarm live UI** — the countdown/alarm widget that reads the settings from
  Profile and the write side of the sessions API (time-in, time-out, start/end break, log case).
  Session Log's read/delete side is already built and ready for it.

## Design fidelity notes (cumulative)
- Colors, shadows, radii, and type scale come from the Figma file's published styles, established
  in Milestone 1 and reused consistently across every page since.
- Pages built in this milestone (Dashboard onward) follow the established design system (cards,
  buttons, pills, dividers, typography) rather than being individually re-pulled from Figma
  node-by-node — Announcements and Auth were pixel-matched directly against their Figma frames;
  these pages are visually consistent with that system but haven't had the same per-node
  verification pass. Flag it if you want a dedicated pixel-accuracy pass on any of them.
- **Moderustic** (headings) still falls back to Poppins — add the licensed font files to
  `/public/fonts` and uncomment the `@font-face` block in `src/styles/globals.css`.
