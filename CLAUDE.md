# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

Building a new portfolio for Kondwani Muwowo — a full upgrade from the current Vite/React SPA. The new portfolio lives in a **temporary Next.js app folder** inside this repo (to be created). Once complete it will replace the current site.

## Repository Layout

```
kondwani/
├── kondwani-current-portfolio/   # Existing Vite + React + Tailwind portfolio (reference only)
├── inspo-accomozed/              # UI inspiration snippets (shadcn components)
├── inspo-azmec/                  # Design inspiration (WordPress site assets)
├── inspo-elta-creatives/         # Design inspiration (Next.js app)
├── inspo-roan/                   # Design inspiration
├── portfolio-details.md          # Project brief and requirements
└── CLAUDE.md                     # This file
```

**Bootstrap workflow:** Scaffold Next.js into a temp subfolder (e.g. `_tmp-next/`) to avoid overwriting root files, then move the generated files up to the repo root and delete the temp folder. All development happens in the root, not the temp folder.

## New Portfolio: Tech Stack

| Tool | Purpose |
|---|---|
| Next.js (latest) | Framework |
| Tailwind CSS + Tailwind Merge | Styling |
| Framer Motion | Animations |
| Material UI | Icons only (not layout — user wants filled icons, not Lucide) |
| clsx | Conditional classnames |
| Supabase + Prisma | Database (PostgreSQL) |
| Resend or Sendgrid | Contact form emails |
| Wrangler | Deployment to Cloudflare Pages |

## Current Portfolio Reference (kondwani-current-portfolio)

**Stack:** Vite + React 19 + Tailwind CSS 3 + Framer Motion + SendGrid

**Commands:**
```bash
npm run dev        # Vite dev server (includes /api/contact mock via custom Vite plugin)
npm run dev:cf     # Build then serve with Wrangler (tests Cloudflare Pages Functions locally)
npm run build      # Production build to dist/
npm run lint       # ESLint
npm run preview    # Preview production build
```

**Architecture:**
- `src/App.jsx` — root layout with Header/Footer wrapping two routes: `/` (Home) and `/contact` (ContactPage)
- `src/pages/` — page-level components; `Home.jsx` composes all section components sequentially
- `src/components/` — one folder per section (About, BeyondCode, Contact, Footer, Header, Hero, Projects, Skills) each with a single `.jsx` file
- `src/data/` — static JS files (`projects.js`, `skills.js`, `beyondCode.js`) that export arrays; components import from here
- `functions/contact.js` — Cloudflare Pages Function that calls SendGrid API; mirrors the dev mock in `vite.config.js`
- `tailwind.config.js` — custom color tokens: `light`, `dark`, `red`, `gray` families + `border-light/dark`

**Design DNA to preserve in the new portfolio:**
- White background (`#FFFFFF`), near-black text (`#0A0A0A`)
- Inter font, generous whitespace, minimal palette
- Subtle Framer Motion animations — nothing flashy
- Sections: Hero, About, Skills, Projects, BeyondCode, Contact

## Design Goals for New Portfolio

- Senior-dev aesthetic — "wow factor" without losing minimalism
- No crazy gradients, no AI-generated vibes
- Everything in reusable, modular components
- Content is data-driven (keep the `data/` pattern from the current portfolio)

## Cloudflare Pages Deployment Notes

- The current portfolio deploys with `wrangler pages deploy dist`
- API routes live in `functions/` as Cloudflare Pages Functions (Web Workers runtime — no Node.js APIs)
- `.env` vars are set in the Cloudflare dashboard; locally loaded via `wrangler pages dev` or the Vite dev plugin
- Required env vars: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_TO_EMAIL`
