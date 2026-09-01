# CaseHub — Rebuild

## This build: font, animation, dashboard card grouping, muted mode-cards, real Time In/Out

### Font — changed as requested
Baloo 2 (headings) + Nunito (body/labels) — both genuinely rounded, friendly Google Fonts,
replacing the Poppins/Prompt pairing. This also removes the Moderustic fallback note from
earlier builds, since it's no longer used anywhere.

### Animation — added
- Buttons/links/inputs: smooth transitions on hover/press, subtle scale-down on click
- Cards: fade-in on mount (`ch-animate-in`); interactive cards (Dashboard's recent-cases
  list, Post-Live's mode cards) lift on hover (`ch-hover-lift`)
- Modals: backdrop fades in, panel slides up
- Toasts: slide up on appear
- Respects `prefers-reduced-motion`

### Dashboard — "carded" grouping fixed
Pre-Live and Post-Live were rendering as three separately-shadowed floating boxes each.
Fixed to one unified card per section, with the three stats as internal columns divided by
a hairline — matching how a "Pre-Live" / "Post-Live" panel should read as one grouped card.

### Post-Live mode cards — muted until timed in
Site Comment / Inbound Email / Bundle are now visually muted (45% opacity + grayscale) and
inert until the user times in, matching the legacy app's gating. Clicking a muted card (or
its title text via `title=`) shows why.

### Time In / Time Out — now the real logic from the ZIP, not a stand-in
Previous builds had a fake local-only elapsed timer. This build ports the actual
`doTimeIn` / `doTimeOut` / `addSessionLog` / `closeWithOutcome` functions from the legacy
`AppContext.jsx` line-for-line into a new `useSessionTimer` hook:
- Same localStorage keys (`ch_timed_in`, `ch_timein`, `ch_session_log`, `ch_session_db_id`)
- Same session-log entry shape (`{id, status, note, startedAt, endedAt, outcome, endNote}`)
- Same flow: Time In writes a "Time In" entry (from page-load to click) + a fresh "Ongoing"
  entry, and POSTs `action: 'time_in'` to get a DB session id
- Starting a case renames the open "Ongoing" entry to "Site Comment"/"Inbound Email" in place
  (`addSessionLog(status, '', 'renameOngoing')`) rather than closing and reopening
- Time Out closes the open entry, adds a "Time Out" entry, POSTs `action: 'time_out'`, then
  logs every case entry from the session via `action: 'log_case'`, then clears the local log
  after a beat — matching the legacy timing exactly
- Session log auto-saves to the DB on a 2s debounce (`action: 'save_log'`)
- `/api/sessions` gained the matching POST actions: `time_in`, `time_out`, `log_case`,
  `save_log`, `start_break`, `end_break` (break actions are wired for the next milestone —
  see below)

Daily Session's stat cards and table now read from this real session log instead of a fake
array.

`npm run build` compiles all 30 routes with no errors.

## Still not ported from the ZIP (flagged last time, still true)
The **alarm/break/lunch countdown system** — Web Audio–generated tones, the DOM-injected
alarm overlay that bypasses React so it fires even during a stale render, the 5-minutes-left
warning, shift-start/shift-end alarms, and the Open Hour toggle. Time In/Out and the session
log it depends on are now real; the break-button countdown behavior itself is still
presentational. `start_break`/`end_break` API actions exist and are ready for it.

## Still pending from the last full request
A full pixel audit of the remaining 9 screens against your Figma exports — I've fixed what's
been reported concretely (buttons, File Name Generator, dashboard cards, fonts) rather than
guessing at the rest.

## Setup
```
npm install
cp .env.example .env.local
npm run dev
```
