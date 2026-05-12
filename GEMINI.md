# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Goal

Building a new portfolio and management dashboard for Kondwani Muwowo — a full upgrade from the current Vite/React SPA. The new portfolio lives in a **temporary Next.js app folder** inside this repo (to be created). Once complete it will replace the current site.

## Repository Layout

```text
kondwani/
├── kondwani-current-portfolio/   # Existing Vite + React + Tailwind portfolio (reference only)
├── inspo-accomozed/              # UI inspiration snippets (shadcn components)
├── inspo-azmec/                  # Design inspiration (WordPress site assets)
├── inspo-elta-creatives/         # Design inspiration (Next.js app)
├── inspo-roan/                   # Design inspiration
├── portfolio-details.md          # Project brief and requirements
└── GEMINI.md                     # This file
```

**Bootstrap workflow:** Scaffold Next.js into a temp subfolder (e.g. `_tmp-next/`) to avoid overwriting root files, then move the generated files up to the repo root and delete the temp folder. All development happens in the root, not the temp folder.

## New Portfolio: Architecture & Features

The new platform consists of two main parts:
1. **Public Side:** Showcases experience, projects, skills, and case studies.
2. **Private Dashboard:** Protected by auth. Used for managing clients, projects, tasks, financials (invoices via invoicely.gg), job application tracking, and an idea bank. Also acts as a CMS for the public site.

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js (latest) | Framework |
| TypeScript | Type safety |
| Tailwind CSS, tailwind-merge, clsx, cva, autoprefixer | Styling & conditional classes |
| Framer Motion | Animations |
| Material UI | Icons (filled, not Lucide) & potentially data tables |
| Supabase + Prisma | Database (PostgreSQL), Auth, and R2 Storage/Supabase Storage |
| Zustand | Global State Management |
| React Hook Form + Zod | Form handling and validation |
| Resend | Contact form & transactional emails |
| Google GenAI | AI Integration |
| Wrangler / Vercel | Deployment strategy (TBD based on Next.js feature usage) |

## Design DNA & Goals

- **Senior-Dev Aesthetic:** Minimalist, generous whitespace, "wow factor" without crazy gradients or AI vibes. Clean, modern glassmorphism (inspired by `inspo-roan`).
- **Modularity:** Highly modular design. Build a custom, reusable component library (buttons, dropdowns, cards, inputs) that can serve as a personal design system for future projects.
- **Inspiration References:** 
  - `inspo-roan` for glassmorphism, clean fonts, rounded corners, product cards.
  - `inspo-azmec` and `inspo-elta-creatives` for dashboard look and feel.
  - `inspo-accomozed` for additional UI/component snippets.
- **Data-Driven:** Keep content structured and manageable from the private CMS dashboard.

## Deployment Notes

- Need to decide between Cloudflare Pages (using Wrangler) or Vercel. (Next.js features might be better supported on Vercel, but current is Cloudflare Pages).
- API routes will likely be Next.js Route Handlers.
