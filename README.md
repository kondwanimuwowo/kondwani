# Kondwani Muwowo — Portfolio

> Personal portfolio of Kondwani Muwowo, a self-taught Software Developer & UI Designer from Lusaka, Zambia. Built with Next.js 15, Tailwind CSS, Framer Motion, and Supabase.

![Portfolio Preview](public/images/projects/portfolio.png)

[![Live](https://img.shields.io/badge/live-kondwanimuwowo.com-red?style=flat)](https://kondwanimuwowo.com)
[![GitHub](https://img.shields.io/badge/github-kondwanimuwowo-black?style=flat&logo=github)](https://github.com/kondwanimuwowo)
[![LinkedIn](https://img.shields.io/badge/linkedin-kondwanimuwowo-blue?style=flat&logo=linkedin)](https://linkedin.com/in/kondwanimuwowo)

---

## What This Is

A full-stack personal portfolio with multi-page routing, a headless CMS admin panel, a shared blog, and extensive SEO/AEO infrastructure. It replaced a Vite/React SPA — every section is now a real, crawlable, independently-linkable page.

**Live:** [kondwanimuwowo.com](https://kondwanimuwowo.com)

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, about, skills, featured projects, beyond code, CTA |
| `/projects` | All projects with category filter tabs |
| `/projects/[slug]` | Project detail with cover, tech stack, meta |
| `/case-studies/[slug]` | Rich case study — problem/solution, outcomes, gallery, testimonial |
| `/beyond-code` | Purpose-driven work — TAKUZA, GAN, Smile FX |
| `/blog` | Blog listing (conditionally shown in nav when posts exist) |
| `/blog/[slug]` | Blog post with Article JSON-LD |
| `/contact` | Contact form with Resend email delivery |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + tailwind-merge |
| Animations | Framer Motion |
| Icons | Material UI (icons only) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma 7 |
| Email | Resend |
| Smooth scroll | Lenis |

### Three-app architecture

The Supabase database is shared across three Next.js apps in this monorepo:

```
kondwani/          ← this repo — public portfolio
├── admin/         ← CMS admin panel (projects, case studies, blog, contacts)
└── blog/          ← blog subdomain (kondwanimuwowo.com/blog)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Resend account for the contact form

### 1. Clone and install

```bash
git clone https://github.com/kondwanimuwowo/kondwani-portfolio.git
cd kondwani-portfolio
npm install
```

### 2. Environment variables

Create a `.env` file in the root:

```env
# Supabase — use the session-mode connection string (port 5432) for DIRECT_URL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Resend
RESEND_API_KEY=re_...
RESEND_TO_EMAIL=kondwanimuwowo@gmail.com
```

### 3. Push the schema

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev       # Development server (Turbopack)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

---

## Project Structure

```
kondwani/
├── app/
│   ├── (public)/          # Public-facing pages (layout with Header/Footer)
│   │   ├── page.tsx       # Home
│   │   ├── projects/      # /projects + /projects/[slug]
│   │   ├── case-studies/  # /case-studies/[slug]
│   │   ├── beyond-code/   # /beyond-code
│   │   ├── blog/          # /blog + /blog/[slug]
│   │   └── contact/       # /contact
│   ├── api/
│   │   ├── contact/       # Resend email handler
│   │   └── analytics/     # Page view tracking
│   ├── sitemap.ts         # Dynamic sitemap (all published slugs)
│   ├── robots.ts          # robots.txt
│   └── layout.tsx         # Root layout with base metadata
├── components/
│   ├── layout/            # Header, Footer, SmoothScrolling, AnalyticsTracker
│   ├── sections/          # Hero, About, Skills, Projects, BeyondCode, Contact, ContactForm, ProjectsGrid
│   └── ui/                # PillLink, Button
├── data/                  # Static fallback data (projects, skills, beyondCode)
├── hooks/                 # useReveal (intersection observer), others
├── lib/                   # prisma.ts, utils.ts
├── prisma/
│   ├── schema.prisma      # DB schema (Project, CaseStudy, BlogPost, SiteConfig, ContactMessage)
│   └── prisma.config.ts   # Prisma 7 config (loads .env, sets DIRECT_URL)
└── public/
    ├── images/
    │   ├── logos/         # TAKUZA, Love Justice, GAN, Smile FX logos
    │   └── projects/      # Project screenshots
    ├── kondwani.png        # Profile photo
    └── kondwani-resume.pdf
```

---

## SEO & AEO

Every page exports `generateMetadata()` with:

- Canonical URLs
- Open Graph tags + images
- Twitter card meta
- `metadataBase` set in root layout for absolute URL resolution

Structured data (JSON-LD) is injected at the page level:

| Page | Schema |
|---|---|
| Home | `Person` + `FAQPage` |
| Project detail | `SoftwareApplication` |
| Blog post | `Article` |
| Case study | `WebPage` + `BreadcrumbList` |

`/sitemap.xml` is generated dynamically from all published project, case study, and blog slugs. `/robots.txt` allows all crawlers and points to the sitemap.

---

## Dynamic Skills via CMS

Skills are stored in the `SiteConfig` table as a JSON blob (key: `"skills"`), editable from the admin panel. The home page fetches from the database with a static fallback — no redeploy needed to update the tech stack display.

---

## Contact

**Kondwani Muwowo**

- Website: [kondwanimuwowo.com](https://kondwanimuwowo.com)
- GitHub: [@kondwanimuwowo](https://github.com/kondwanimuwowo)
- LinkedIn: [linkedin.com/in/kondwanimuwowo](https://linkedin.com/in/kondwanimuwowo)
- X/Twitter: [@kondwanimuwow0](https://x.com/kondwanimuwow0)
- Email: kondwanimuwowo@gmail.com

---

## License

MIT — free to use as inspiration. Please don't copy the personal content directly (bio, project details, beyond-code section). Make it your own.

---

<div align="center">Made in Lusaka, Zambia 🇿🇲</div>
