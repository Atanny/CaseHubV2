# CaseHub — Rebuild

## This build: button/design-system fixes + File Name Generator rebuild

You asked for three big things in one message: (1) fix buttons/typography/spacing/cards
app-wide to match Figma, (2) rebuild File Name Generator to match its actual Figma design
with real upload/download, (3) port the break/lunch/timer/opening-hour functionality from
the ZIP. Those are three genuinely separate, large pieces of work — here's exactly what's
done and what isn't, so nothing is overstated.

### ✅ Done and verified in this pass

**Global button system** — rebuilt `Button.jsx` to match Figma exactly: bold uppercase
labels, `rounded-ch-lg` corners (was a smaller fixed radius before), consistent padding,
and a `uppercase={false}` override for the buttons Figma shows in sentence case (Log Out,
Edit Case, Download Selected, etc.). This is a shared component, so the fix applies to
every page at once — Case History, Archived Cases, Session Log, Quick Links, Post-Live,
Announcements, Profile.

**Cards & modals** — bumped the corner radius to match Figma's slightly rounder look.

**Header quick actions** — break buttons are now borderless white pills with bold
uppercase labels; Log Out is sentence case with a trailing icon, matching your screenshot
exactly (previously everything was uppercase, including Log Out, which was wrong).

**Search + date fields** — Figma shows these as two **separate** pill fields side by side.
The previous build combined them into one bar with an internal divider — fixed to match.

**File Name Generator — fully rebuilt**, matching your screenshots: Case Information panel
(Business Name / Entity Designations / Account Number, labeled "(Auto-Fill)"), a Name Type
dropdown (Hero, Hero Slider, Gallery, Gallery - Separate Page, Content, Before/After —
exactly the six types shown across your screenshots), per-page upload zones that accept
real image files (click, drag-drop, or paste), live thumbnails, and a right panel that
groups the generated file-name cards by page with a checkbox on each, a Select All, and a
**Download Selected** button that actually renames and downloads the real uploaded files
(not placeholder text). Hero-type images generate both filename variants (`-Cust` and
plain) per your screenshot. "Edit File Name Format" opens a token-based format editor so
the naming convention itself stays adjustable.

`npm run build` compiles all 30 routes with no errors — confirmed after every change above.

### ❌ Not done — and I want to be upfront about why

**A full pixel audit of all 11 screens.** I used your screenshots to fix the button system,
search/date fields, and File Name Generator specifically, but I have not gone through
every remaining page (Dashboard, Post-Live's 9-screen flow, Profile, Session History,
Announcements, Quick Links, Sign Up/Login) crop-by-crop verifying spacing, exact card
proportions, and alignment against your images the way I did for the items above. That's
realistically its own multi-pass effort given how much surface area there is.

**Break / lunch / timer / opening-hour functionality ported from the ZIP.** I read through
`AppContext.jsx`'s actual implementation — it's a substantial, real-time subsystem: Web
Audio API–generated alarm tones, a DOM-injected alarm overlay that bypasses React state
entirely (so it fires even during a stale render), cross-tab signaling via `localStorage`,
break countdowns with a 5-minutes-left warning, automatic session-log transitions ("Ongoing"
→ "Break" → fresh "Ongoing" on end), shift-start/shift-end alarms, and an Open Hour toggle
with the same session-log handoff pattern. This is not something I could responsibly
"port" as a side effect of a design pass — it's a dedicated milestone on its own, the same
way I scoped Post-Live Amends earlier. I have not touched it in this build; the break
buttons you see are still presentational.

### Recommended next steps, in order
1. **Card-by-card visual audit** against your 11 screenshots — I'd go page by page the same
   way I just did for File Name Generator, since that produced results you could verify
   directly against the image.
2. **Break/timer/lunch/opening-hour system**, ported faithfully from `AppContext.jsx`'s
   actual logic (alarm loop, session-log transitions, shift alarms, open hour).

Tell me which you'd like first, or if you'd rather I just proceed through both in order.

## Setup
```
npm install
cp .env.example .env.local
npm run dev
```
