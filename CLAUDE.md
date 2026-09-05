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

## UI Design Rules

Apply these across portfolio, admin, and blog:

- No emojis. Avoid borders wherever possible — separate elements with subtle shadows (medium preferred, or large/color contrast) instead.
- Common, clean fonts. Use image backgrounds for sections and images on cards where reasonable.
- Subtle animations only, nothing flashy or attention-grabbing.
- On large screens, leave generous gutters on both sides — main content area should be 60-70% of total screen width.
- Generous whitespace throughout; err toward more padding/space between sections.
- Pure white background unless a different background is specified. Full, solid colors only on sections/cards/buttons — no transparency or reduced opacity, no gradients anywhere.
- Sections are full-width; some (especially homepage hero) can use a full-width background image.
- Headings/titles: monochrome (one color per line), no repeated word/phrase within a single line, large enough to stand out, no eyebrow text above them.
- Never use em dashes.
- Solid-style icons only (not outline/line), one consistent icon set, consistent weight/size. Never put icons inside colored circles/badges above feature cards.
- Consistent spacing scale (4px/8px increments), no arbitrary spacing values.
- Hero/section imagery should be real or custom photography/illustration, not generic stock-photo-style visuals.
- Buttons fully rounded (pill-shaped) by default. One consistent corner-radius value (or small defined set) across all cards, inputs, containers.

## Copy Rules

- Never use em dashes or en dashes anywhere. Straight quotes only, never curly. Sentence case for headings, not Title Case.
- No emojis in headings, buttons, or body copy.
- Plain, direct copy — no inflated-significance phrasing ("stands as," "a testament to," "plays a vital role," "marks a pivotal moment").
- No promotional/advertising language ("vibrant," "stunning," "boasts," "nestled," "must-see," "cutting-edge").
- No vague attributions ("experts say," "studies show") without naming a real, specific source.
- Don't force ideas into groups of three just to sound thorough. No "-ing" phrases tacked on for fake depth.
- Avoid AI-cliche vocabulary: delve, crucial, pivotal, tapestry, landscape (abstract noun), testament, underscore, foster, showcase, seamless, elevate, unlock, unleash.
- No filler phrases ("in order to," "due to the fact that," "it is important to note that").
- No sycophantic/overly enthusiastic tone. No generic vague closing lines ("the future looks bright").
- Avoid "not only... but also" and other negative-parallelism constructions.
- Concise and concrete — no filler, no restating the heading in the first line beneath it.

## Cloudflare Pages Deployment Notes

- The current portfolio deploys with `wrangler pages deploy dist`
- API routes live in `functions/` as Cloudflare Pages Functions (Web Workers runtime — no Node.js APIs)
- `.env` vars are set in the Cloudflare dashboard; locally loaded via `wrangler pages dev` or the Vite dev plugin
- Required env vars: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_TO_EMAIL`
