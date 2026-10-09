export interface CaseStudyContent {
  slug: string
  title: string
  client: string
  role: string
  year: number
  duration: string
  excerpt: string
  problem: string
  solution: string
  // HTML, rendered with the site's prose styles
  content: string
  outcomes: string[]
  tech: string[]
  liveUrl: string | null
  githubUrl: string | null
}

export const caseStudies: CaseStudyContent[] = [
  {
    slug: "accommozed-case-study",
    title: "AccommoZED",
    client: "An independent property agent in Lusaka",
    role: "Design and full-stack development",
    year: 2026,
    duration: "7 months",
    excerpt: "How a Lusaka property agent moved her lettings business out of Facebook comments and WhatsApp chats into one system for bookings, payments and payouts.",
    problem: "Her whole business ran on Facebook posts and WhatsApp. Availability lived in her head, payments came in by mobile money with nothing tying them to a date, and two guests could ask for the same nights without anyone noticing until one arrived at the door.",
    solution: "A booking platform built around how she already worked: guests request dates on a live calendar, she approves, the guest pays, and the money is held until check-in before it pays out to her automatically.",
    content: `
<h2>Background</h2>
<p>The client lets furnished and unfurnished properties around Lusaka. Before this project, guests found her through Facebook, asked questions on WhatsApp and paid by mobile money. Nothing connected a payment to a booking, so a guest could pay without a confirmed date, or hold a date without paying.</p>

<h2>Pricing that matches the market</h2>
<p>Short stays in Lusaka aren't priced per night alone. Each property can have a nightly rate, a weekend premium, weekly and monthly discounts, a fee per extra guest and an optional cleaning fee. Furnished and unfurnished properties use different pricing models, so the listing form changes with the property type.</p>

<h2>Request first, pay second</h2>
<p>Guests check a live calendar and request dates. The host approves the request, and only then does the guest pay, by mobile money or bank transfer through Lenco. Confirmed dates lock automatically, so a double booking can't happen through the system.</p>

<h2>Escrow and automatic payouts</h2>
<p>Payments are held in escrow until check-in, then released on a schedule. AccommoZED's commission comes off the stay amount, cleaning fees pass through in full, and the balance goes to the host's mobile money or bank account. Every booking shows the gross amount, the commission and the net payout. Refunds follow the cancellation policy the host chose for that property: flexible, moderate or strict.</p>

<h2>Meeting guests where they already are</h2>
<p>Most enquiries still start on WhatsApp, so an AI assistant called Kristy answers questions there about availability, pricing, amenities and how to book. Anything it can't answer goes to the host.</p>
`.trim(),
    outcomes: [
      "Bookings, payments and payouts are linked records instead of three separate conversations",
      "Double bookings are blocked by the calendar itself",
      "Guest payments are held until check-in, protecting both sides if a stay is disputed",
      "Refunds are calculated from the host's cancellation policy instead of negotiated by message",
      "Common WhatsApp questions are answered without the host stepping in",
      "The platform supports more hosts without a rebuild",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma", "Supabase Auth", "Lenco", "WhatsApp Cloud API", "Claude API", "Cloudflare R2"],
    liveUrl: "https://accommozed.com",
    githubUrl: null,
  },
  {
    slug: "titunge",
    title: "Titunge",
    client: "Gloria'z Daughter, then any garment business",
    role: "Design and full-stack development",
    year: 2026,
    duration: "10 months",
    excerpt: "How a custom system for one tailoring business grew into a multi-tenant ERP and marketplace for garment businesses.",
    problem: "A tailoring business needed one place to run orders, production, materials, staff and money. Once it worked, other garment businesses needed the same thing, but a system built for one shop couldn't safely hold anyone else's data.",
    solution: "I rebuilt it as a platform where each business gets its own isolated workspace and subdomain, moved the first business in as tenant one, and added a shared marketplace where businesses sell finished pieces.",
    content: `
<h2>Where it started</h2>
<p>Titunge began in December 2025 as an ERP for Gloria'z Daughter, a tailoring business. It covered the work of running the shop: orders and receipts, production batches, materials and stock movements, customers, employees, payments, expenses and overheads, with costing per garment type so the owner could see what each piece really costs to make.</p>

<h2>One system, many businesses</h2>
<p>To open it to other businesses, every table gained a business id, and Postgres row-level security enforces the boundary at the database level, so one tenant can't read another's data even if an application query is wrong. Each business works on its own subdomain, and the original standalone app was migrated in as the first tenant and retired.</p>
<p>Menus adjust to each member's role, deleted records go to a recycle bin, and every server action checks which business the signed-in user belongs to before it touches data.</p>

<h2>A marketplace with real money in it</h2>
<p>Businesses can list finished pieces on the Titunge marketplace, where buyers browse shops, pay through Lenco and track their orders. Paying sellers safely needed more than a checkout:</p>
<ul>
  <li>Payouts wait for a 24-hour dispute window after delivery before any money moves.</li>
  <li>Lenco doesn't send a webhook when a payment fails, so a scheduled job reconciles orders whose payment never confirmed.</li>
  <li>Payout transfers are checked against Lenco until they settle, and retried a limited number of times if they fail.</li>
  <li>Webhooks are treated as hints: every payment is re-verified with Lenco directly before an order changes state.</li>
</ul>

<h2>Plans and billing</h2>
<p>The free plan covers one user. The team plan allows unlimited users and is billed monthly for each seat after the first, charged automatically by a scheduled job.</p>
`.trim(),
    outcomes: [
      "The first tailoring business runs its daily operations in Titunge",
      "Any garment business can sign up and get an isolated workspace on its own subdomain",
      "Tenant data is separated at the database level, not just in application code",
      "Sellers are paid automatically after a dispute window, with failed transfers retried",
      "Missed or failed payment notifications are caught by scheduled reconciliation",
      "Team plans are billed per seat without manual invoicing",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Lenco", "Resend", "Recharts", "Vitest", "Cloudflare Workers"],
    liveUrl: "https://titunge.com",
    githubUrl: "https://github.com/kondwanimuwowo/titunge",
  },
  {
    slug: "takuza-case-study",
    title: "TAKUZA",
    client: "TAKUZA (Talitha Kum Zambia)",
    role: "Design and full-stack development",
    year: 2026,
    duration: "1 month",
    excerpt: "Building a public site and staff dashboard for an anti-trafficking network, where some features handle reports about people who may be in danger.",
    problem: "TAKUZA, a network of 45 Catholic congregations across Zambia's 11 dioceses, needed a site its staff could update without a developer. It also needed safe ways for the public to report concerns and for its team to file field reports, where a careless design could expose someone at risk.",
    solution: "A public site that reads all its content from a database, a separate staff dashboard on its own subdomain, and submission flows designed so sensitive details never leave the system.",
    content: `
<h2>A site the team can run</h2>
<p>The public site covers TAKUZA's story, team, network and youth ambassadors, along with survivor stories, events, a gallery, downloads and learning pages on human trafficking, safe migration and St Josephine Bakhita. Every page reads from the database. Page text is stored as editable blocks, and staff manage everything from a dashboard on hub.takuza.org, kept separate from the public site.</p>

<h2>Designing for sensitive information</h2>
<p>Several features handle information about people who may be in danger, so they were built around what could go wrong:</p>
<ul>
  <li>Anyone can report a concern anonymously.</li>
  <li>Email alerts to staff carry only a subject and a link to the dashboard, never the report itself, because email sits outside the system.</li>
  <li>Team members file field reports with attachments using a five-digit code issued from the dashboard. The code screen is protected against guessing, and attachments are stored privately and served only to signed-in staff.</li>
</ul>

<h2>An assistant with limits</h2>
<p>Gina, the site assistant, answers common questions from a script and only passes free-typed questions to a language model. She is designed never to call an offer of work or travel safe, never to take a report, and never to make up a phone number, because a wrong answer here could send someone into danger.</p>

<h2>Built from their own material</h2>
<p>TAKUZA supplied about 200MB of content, including photos, reports and their brand palette. The palette was adjusted by role rather than copied colour for colour, so buttons and text meet accessibility contrast standards.</p>
`.trim(),
    outcomes: [
      "Staff update every page and record from the dashboard without a developer",
      "Concerns can be reported anonymously",
      "Report contents never leave the system by email",
      "Field reports and attachments are restricted to signed-in staff",
      "The assistant answers common questions without taking reports or giving unverified contact details",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Drizzle ORM", "PostgreSQL", "Claude API", "Cloudflare Workers"],
    liveUrl: "https://takuza.org",
    githubUrl: null,
  },
]
