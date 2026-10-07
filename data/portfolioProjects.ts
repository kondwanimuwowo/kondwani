export interface PortfolioProject {
  slug: string
  // Older slugs this project may already be stored under
  aliases?: string[]
  title: string
  excerpt: string
  description: string[]
  tech: string[]
  category: string
  role: string
  year: number
  status: string
  liveUrl: string | null
  githubUrl: string | null
  featured: boolean
  order: number
}

const ROLE = "Design and full-stack development"

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "titunge",
    aliases: ["tailoring-erp-marketplace"],
    title: "Titunge",
    excerpt: "Multi-tenant ERP and marketplace for tailoring businesses, with a workspace for each business and a shared shop for their finished goods.",
    description: [
      "Titunge started as a custom system for one tailoring business and became a platform any garment business can sign up to. Each business gets its own workspace on its own subdomain, and that first business was migrated in as the first tenant.",
      "The workspace covers the running of the shop: orders and receipts, production batches, materials and stock movements, products, customers, employees, payments, expenses, overheads and costing per garment type, with analytics on top. Menus change with each member's role, and deleted records go to a recycle bin instead of disappearing.",
      "Businesses can list finished pieces on the Titunge marketplace, where buyers browse shops, pay through Lenco and track their orders. Every table is scoped to a business and protected by Postgres row-level security, so one tenant can never read another's data. The free plan covers one user, and the team plan bills monthly for each extra seat.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Lenco", "Resend", "Recharts", "Vitest", "Cloudflare Workers"],
    category: "Web App",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://titunge.com",
    githubUrl: "https://github.com/kondwanimuwowo/titunge",
    featured: true,
    order: 1,
  },
  {
    slug: "accommozed",
    title: "AccommoZED",
    excerpt: "Booking, payments and escrow payouts for a Lusaka property agent who used to run her business through Facebook and WhatsApp.",
    description: [
      "An independent agent in Lusaka was letting furnished and unfurnished properties through Facebook posts and WhatsApp chats. Availability lived in her head, payments came in over mobile money with nothing tying them to a date, and two guests could book the same nights without anyone noticing.",
      "AccommoZED puts all of that in one system. Guests check a live calendar and request dates, the host approves, and only then does the guest pay by mobile money or bank transfer through Lenco. Confirmed dates lock automatically, so a double booking can't happen.",
      "Payments sit in escrow until check-in, then pay out to the host automatically, with commission taken off and cleaning fees passed through in full. Refunds follow the cancellation policy the host set for each property. Pricing handles nightly rates, weekend premiums, weekly and monthly discounts and extra guest fees.",
      "Most enquiries still start on WhatsApp, so an AI assistant called Kristy answers availability, pricing and booking questions there and hands anything else to the host.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma", "Supabase Auth", "Lenco", "WhatsApp Cloud API", "Claude API", "Cloudflare R2", "Leaflet"],
    category: "Web App",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://accommozed.com",
    githubUrl: null,
    featured: true,
    order: 2,
  },
  {
    slug: "smile-fx-traders",
    title: "Smile FX Traders",
    excerpt: "A trading journal and learning platform for forex traders in Zambia who trade Smart Money Concepts and supply and demand.",
    description: [
      "Smile FX Traders is the community I run for forex traders in Zambia and across Africa. I built the platform members use to journal their trades, follow my alerts and study the methods I teach.",
      "The journal is the centre of it. Each trade records the setup model, session, entry, stop, target, risk and whether the trader kept to their rules. From that, the dashboard works out net R, win rate, expectancy and a discipline score. Every trade has its own page with price levels, timing, the pip move and the chart.",
      "Around the journal sit instructor trade alerts, an academy of courses and lessons, a community feed, COT positioning data, a macro calendar, session times and a trade validator. Members pay in kwacha or dollars, and an admin area handles students, pricing, alerts and course content.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Supabase", "TanStack Query", "Zustand", "Lightweight Charts", "Upstash Redis", "Lenco", "Claude API", "Cloudflare Workers"],
    category: "Web App",
    role: "Founder, design and development",
    year: 2026,
    status: "Live",
    liveUrl: "https://smilefxtraders.com",
    githubUrl: "https://github.com/kondwanimuwowo/smilefxtraders",
    featured: true,
    order: 3,
  },
  {
    slug: "takuza",
    title: "Takuza",
    excerpt: "Website and staff dashboard for Talitha Kum Zambia, a network of Catholic congregations working against human trafficking.",
    description: [
      "TAKUZA is Talitha Kum Zambia, a network of 45 Catholic congregations across all 11 dioceses of Zambia, working against human trafficking through awareness, youth ambassadors and survivor support. I built their public site and the dashboard their team runs it from.",
      "The site covers their story, network, ambassadors, survivor stories, events, gallery, downloads and pages on trafficking and safe migration. Every page reads from the database, and staff edit all of it from a dashboard on its own subdomain.",
      "Some of the features handle sensitive information, so they were built carefully. Anyone can report a concern anonymously. Staff alerts carry a subject and a dashboard link, never the report itself, because email sits outside the system. Team members file field reports with attachments using a five-digit code, and those files are stored privately and only served to signed-in staff.",
      "Gina, the site assistant, answers common questions from a script and only sends free text to a model. She never takes a report and never makes up a phone number.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Drizzle ORM", "PostgreSQL", "Claude API", "Cloudflare Workers", "Framer Motion"],
    category: "Nonprofit",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://takuza.org",
    githubUrl: null,
    featured: false,
    order: 4,
  },
  {
    slug: "migration-solutions-hub",
    title: "Migration Solutions Hub",
    excerpt: "Website and event platform for a pan-African migration organisation, built around its Migration Governance Exchange.",
    description: [
      "Migration Solutions Hub brings together people who work on migration across Africa: immigration and border officials, customs, law enforcement, civil aviation, identity management and the companies that build for them. Its main event is the Migration Governance Exchange, two days of meetings between decision-makers and solution providers.",
      "I rebuilt their static prototype as a Next.js app. Each event page lets visitors request to attend, sponsor or book an exhibition stand. Those requests land in an admin dashboard next to general enquiries, partners and newsletter subscribers, and staff manage events and users from the same place.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Drizzle ORM", "PostgreSQL", "Supabase", "Resend", "Zod", "TanStack Query", "Framer Motion"],
    category: "Website",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://migrationsolutionshub.com",
    githubUrl: null,
    featured: false,
    order: 5,
  },
  {
    slug: "teleiosis-mandate",
    title: "Teleiosis Mandate",
    excerpt: "Website for a Lusaka ministry, with streamed audio teachings, event registration, partner giving and a full admin.",
    description: [
      "Teleiosis Mandate is a Christian ministry in Lusaka. The site carries their programmes, events, blog and a library of recorded teachings.",
      "Teachings are grouped into series and categories and stream from Cloudflare R2 through a custom audio player. Visitors register for events and give as partners, with payments through Lenco confirmed by webhook.",
      "The ministry runs everything from an admin area: teachings and series, events and registrations, store products, payments, blog posts, messages, newsletter subscribers and the team page. The type is Cinzel and EB Garamond on a mostly white layout with square corners throughout.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Cloudflare R2", "Lenco", "Resend", "Upstash Redis", "Framer Motion"],
    category: "Website",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://teleiosis.org",
    githubUrl: "https://github.com/kondwanimuwowo/teleiosis",
    featured: false,
    order: 6,
  },
  {
    slug: "hope-alive-tour",
    title: "Hope Alive Tour",
    excerpt: "Volunteer platform for Charis Gospel Reachout's mission tour, covering sign-up, onboarding, event registration, payments and team chat.",
    description: [
      "Hope Alive Tour is a missions initiative run by Charis Gospel Reachout. Volunteers sign up, fill in an onboarding profile with the details the trip needs, and register for tour events, which moderators then review.",
      "Payments go through Lenco. Supabase Edge Functions start and verify each payment and receive Lenco's webhook, so the secret key never reaches the browser. Confirmation emails go out through Resend from the tour's own mail subdomain.",
      "Once they're in, volunteers keep in touch through a feed, a community chat with private messages and a forum. Admins manage events and users from inside the same app.",
    ],
    tech: ["React", "TypeScript", "Vite", "Tailwind CSS", "Supabase", "Supabase Edge Functions", "Lenco", "Resend", "React Router"],
    category: "Nonprofit",
    role: ROLE,
    year: 2026,
    status: "Live",
    liveUrl: "https://hopealivetour.com",
    githubUrl: null,
    featured: false,
    order: 7,
  },
  {
    slug: "smile-enterprise-pos",
    title: "Smile Enterprise POS",
    excerpt: "Offline point of sale and stock system for Zambian grocery stores, packaged as a Windows desktop app.",
    description: [
      "Smile Enterprise POS runs a grocery till on one Windows machine without needing the internet. It's an Electron app that starts its own Express server and SQLite database, so sales keep working when the connection drops.",
      "Cashiers scan a barcode or search for a product to build a sale. Each sale runs in a single database transaction that checks stock, applies 16% VAT for ZRA, records the items and reduces stock together, so the inventory always matches what was sold.",
      "Admins get inventory with low-stock alerts, sales history and reports. Cashiers and admins have separate permissions, and reports, users and settings are admin-only. A user manual is built into the app.",
    ],
    tech: ["Electron", "React", "TypeScript", "Vite", "Tailwind CSS", "Node.js", "Express", "Prisma", "SQLite", "Zustand", "Zod"],
    category: "Desktop App",
    role: ROLE,
    year: 2026,
    status: "In Progress",
    liveUrl: null,
    githubUrl: null,
    featured: false,
    order: 8,
  },
  {
    slug: "kondwanimuwowo",
    title: "kondwanimuwowo.com",
    excerpt: "My portfolio, my blog and the private hub I run my studio from, as three Next.js apps on Cloudflare Workers.",
    description: [
      "This site is one of three apps in a single repo. The portfolio is what you're reading, the blog is at blog.kondwanimuwowo.com, and hub.kondwanimuwowo.com is a private admin where I manage what the other two show and the client work behind them.",
      "The hub holds projects, case studies, skills and blog posts, along with clients, jobs, contracts, milestones and invoices. Clients get a portal on this site where they follow their project, message me, sign contracts and pay invoices by mobile money through Lenco.",
      "All three apps moved from Vercel to Cloudflare Workers this year. That meant replacing Prisma with Drizzle, because Prisma's query engine doesn't run on Workers, and putting Hyperdrive in front of the shared Postgres database.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "vinext", "Cloudflare Workers", "Hyperdrive", "Drizzle ORM", "PostgreSQL", "Supabase", "Cloudflare R2", "TanStack Query", "Lenco", "Resend", "Framer Motion"],
    category: "Portfolio",
    role: "Design and development",
    year: 2026,
    status: "Live",
    liveUrl: "https://kondwanimuwowo.com",
    githubUrl: "https://github.com/kondwanimuwowo/kondwani",
    featured: false,
    order: 9,
  },
]
