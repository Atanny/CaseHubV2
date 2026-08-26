# CaseHub — Rebuild

## Folder structure (flattened for GitHub upload)

```
casehub-new/
├── src/
│   ├── pages/              — routes (Next.js requires this exact structure)
│   │   └── api/            — backend endpoints (also Next.js-routing-required;
│   │                          each subfolder here = one URL segment, e.g.
│   │                          pages/api/cases/[id].js = /api/cases/123)
│   ├── components/         — every component, flat, no subfolders
│   ├── services/           — API client wrappers (flat)
│   ├── hooks/               — flat
│   ├── constants/          — flat
│   ├── utils/               — flat
│   ├── lib/                 — flat
│   └── styles/              — flat
├── package.json
├── tailwind.config.js
└── .env.example
```

**Why `pages/` and `pages/api/` still have subfolders:** Next.js turns your file
paths directly into URLs — `pages/api/cases/[id].js` *is* the route
`/api/cases/:id`. Flattening those would break the app's routing, so they're
the one place nesting is required. Everything else — all ~60 components,
every service — is one flat folder now, no `components/ui/`,
`components/postlive/`, etc.

## Setup
```
npm install
cp .env.example .env.local
npm run dev
```

## Verified
`npm run build` compiles all 30 routes with no errors — confirmed after flattening.

## Everything else from the previous build is unchanged
This zip is the same complete, pixel-matched-to-Figma app as before (Auth,
Announcements, Dashboard, Case History, Archived Cases, Session Log, Quick
Links, Post-Live Amends wizard) — only the folder layout changed, not the
functionality or design. Profile & Settings and File Name Generator still
await the same Figma-screenshot verification pass as the rest.
