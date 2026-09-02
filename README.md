# CaseHub — Rebuild

## This build: fonts/animations from V1, real Break flow, session log parity

### Fonts — switched to V1's actual pairing
Plus Jakarta Sans (headings/prominent numbers) + Poppins (body/labels/buttons) — this is
the exact pairing the legacy app (`pages/index.js`) uses, not a new choice.

### Animations — ported from V1's actual keyframe set
Read directly out of the legacy app's CSS: `fadeIn` (step/panel reveals), `popIn` (modals),
`slideUp` (toasts), `pulse-dot` (live indicators), `ongoingPulse` (soft pulse for "Ongoing"
session rows), `float` (loading spinners), `pageFade` (route-change transition). All added
as reusable classes in `globals.css` (`ch-animate-in`, `ch-animate-pop`, `ch-animate-slide-up`,
`ch-pulse-dot`, `ch-ongoing-pulse`, `ch-float`, `ch-animate-page`, `ch-hover-lift`), applied to
Card/Modal/Toast/AppLayout's route transitions.

### Break flow — now real, ported from V1's `startBreak`/`stopBreak`
`useSessionTimer` gained the actual break logic:
- **Sidebar-triggered breaks subtract elapsed session time** from the countdown (a 30-min
  break started 10 minutes into a session only counts down 20) — form-triggered breaks
  (`fullDuration=true`) always use the full duration. Both paths exist, matching V1 exactly.
- Starting a break **renames the open "Ongoing" session-log entry to "Break"** in place
  (same `addSessionLog(status, note, 'renameOngoing')` pattern as starting a case) rather
  than closing and reopening — so the session log reads as one continuous timeline, same
  as V1.
- A **countdown tick** runs every second; when it hits zero the break **auto-ends itself**:
  closes the "Break" entry with outcome "Break Ended", opens a fresh "Ongoing" entry, and
  resets the session timer — all without the user doing anything, matching V1's auto-end.
- Manually ending a break early does the same close/reopen, just triggered by a click.
- Both the landing page (Post-Live's top-right break buttons) and the in-wizard sidebar
  (Quick Tools panel) now show a **live countdown** and a **"tap to end"** control while a
  break is active, instead of the previous fake `setTimeout` stand-in.

This means the Session Log page (which reads the same `sessionLog` shape) will now show
real "Break" rows with accurate start/end times once the reporting side is extended to
display them — the data itself is correct today.

`npm run build` compiles all 30 routes with no errors.

## About the Google Doc case study link
I wasn't able to open the linked Google Doc — it requires sign-in/JavaScript and returned
no readable content via fetch. If it contains a spec I need to follow, please paste the
relevant text directly.

## Still not done (flagged in prior builds, still true)
- **Open Hour** — V1 has a parallel flow to Break (`startOpenHour`/`stopOpenHour`) that
  isn't surfaced anywhere in the Figma design I've been given, so it's not wired into the
  UI. Say the word if you want it added even without a Figma reference for it.
- **Alarm system** — Web Audio tones, the DOM-injected alarm overlay, 5-minutes-left
  warning popup, shift-start/shift-end alarms. The break timer itself is real now; the
  *alarm* that fires during/around it is still not built.
- **Full pixel audit** of the remaining screens against your Figma exports.

## Setup
```
npm install
cp .env.example .env.local
npm run dev
```
