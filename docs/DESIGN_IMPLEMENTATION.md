# Design implementation status

Source: the Figma exports for Dashboard, Case History, Archived Cases, Session Logs, Quick Links,
Updates & Announcement, Profile & Settings, File Name Generator and Post-Live Amends.

Palette (sampled from the designs; already the app's tokens): background `#e8dfca`, panel `#f5efe6`,
primary `#40513b`, danger `#c54446`, blue `#4760ff`, purple `#8a38f5`, green `#58a767`.

## Done

| Area | What changed |
|---|---|
| Shell | Permanent icon rail (68px, tooltips + `aria-label`, raised active tile with edge bar, count badges, in-progress dot, DB status dot, drag-to-reorder custom links, red sign-out). Replaces the hover-expanding sidebar. |
| Page header | Shared `PageHeader`: uppercase title, subtitle, break pills (15 MIN / 30 MIN / 1 HOUR), MEETING, Log Out. Drives the app-level confirm flows via `ShellContext`; same rules as before (active break highlighted, others disabled, locked while a form is open, meeting needs a clock-in). Used on every screen except the post-live *form*, which keeps its own header. |
| Dashboard | Rebuilt: greeting + totals, date/time and quick actions, colored stat tiles, announcement and latest-case cards with type/severity badges, donut by case type, weekly quota line chart, stage bars. Calculations live in `views/Dashboard/dashboardData.js` (unit tested). |

## Deliberate differences from the mockups

- The donut legend uses the slice colors (blue/purple/green, matching the case badges). The mockup's legend
  dots (red/orange/yellow) do not match its slices.
- "Quota Graph" plots cases saved per weekday for the current week. "Amendments" bars show Build / Pre-Live /
  Post-Live; Build and Pre-Live have no data yet (those screens are not built), so they read 0.
- The theme toggle and the Build / Pre-Live nav items are not in the designs, so they are not shown. The
  `build` and `prelive` routes still work if reached (saved page values), see `HIDDEN_PAGE_IDS`.
- The "Lunch" break keeps its original label in dialogs and the break banner; its pill reads "1 HOUR" as designed.

## Remaining screens (gap analysis)

| Screen | Gap to the design | Needs new data/backend? |
|---|---|---|
| Case History | Expandable cards: header with case #/account, type+severity badge, amend type, timestamp, **Download for backup** and **Edit case** buttons; two-column detail (account/customer/case/email/amend type/business, site comment text; devices checklist, final checklist x/y, tracker link, screenshots). Radio filters All / Site Comment / Inbound / Bundle. | No |
| Archived Cases | Same card as Case History with **Move to suspended** / **Delete**. | No |
| Session Logs | Date cards with "N CASES" chip, total hours and time range, **Delete session**, table (type, case #, account #, combined-tracker minutes, QA minutes, status, **View case**), delete-confirm dialog. | No |
| Quick Links | Search + date + A-Z; always-visible *create* panel with a 10-icon picker, title and link; list cards with Edit / Delete and drag handle. | Icon names only |
| Updates & Announcement | Social-feed layout: composer with rich-text toolbar, All/Updates/Announcements filter, saved items, "Your post", author avatar + role, **like** and **bookmark** per post, ⋯ menu (Edit/Delete). | **Yes**: likes, bookmarks, author role/avatar |
| Profile & Settings | Three columns; per-field edit icons and Save; special-requestor chips + add modal; screenshot file names; alarm management; quick-message composer (rich text) + message list. | Rich-text storage for messages |
| File Name Generator | Name-type dropdown (Hero, Hero Slider, Gallery, Gallery separate page, Content, Before/After), page rows with upload slots, result grids with Select All / Download Selected. | No (mostly restyle) |
| Post-Live | Hub with daily-session table and summary tiles; dark-green form header with timer; tabbed steps; many dialogs (break, cancel, bundle, submit, alarms). | No (restyle + layout) |

Decisions needed before the Announcements and Profile work: see the notes in the project hand-off message.
