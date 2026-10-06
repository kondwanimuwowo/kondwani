import Link from "next/link"
import { db, project, contactSubmission, jobApplication, idea, workProject, blogPost, newsletterSubscriber } from "@/lib/db"
import { count, eq, inArray } from "drizzle-orm"
import {
  Code, Mail, Article, Lightbulb,
  ChevronRight, Message, ViewKanban, RequestQuote, EditNote, MarkEmailRead,
} from "@mui/icons-material"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [
    [{ count: projects }],
    [{ count: contacts }],
    [{ count: jobs }],
    [{ count: ideas }],
    [{ count: activeWork }],
    unpaidDocs,
    [{ count: publishedPosts }],
    [{ count: draftPosts }],
    [{ count: subscribers }],
  ] = await Promise.all([
    db.select({ count: count() }).from(project),
    db.select({ count: count() }).from(contactSubmission).where(eq(contactSubmission.read, false)),
    db.select({ count: count() }).from(jobApplication),
    db.select({ count: count() }).from(idea),
    db.select({ count: count() }).from(workProject).where(inArray(workProject.status, ["active", "review", "staged"])),
    db.query.document.findMany({
      where: (t, { eq, and, inArray }) => and(eq(t.type, "invoice"), inArray(t.status, ["sent", "draft"])),
      with: { items: { columns: { amount: true } } },
    }),
    db.select({ count: count() }).from(blogPost).where(eq(blogPost.published, true)),
    db.select({ count: count() }).from(blogPost).where(eq(blogPost.published, false)),
    db.select({ count: count() }).from(newsletterSubscriber),
  ])

  // Totals include tax and stay per currency rather than mixing them.
  const unpaidByCurrency = new Map<string, number>()
  for (const doc of unpaidDocs) {
    const subtotal = doc.items.reduce((s, i) => s + i.amount, 0)
    unpaidByCurrency.set(doc.currency, (unpaidByCurrency.get(doc.currency) ?? 0) + subtotal * (1 + doc.taxRate / 100))
  }
  const unpaidLabel = [...unpaidByCurrency]
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    .join(" + ") || null

  const recentContacts = await db.query.contactSubmission.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit: 5,
  })

  const portfolioStats = [
    { label: "Projects", value: projects, icon: Code, href: "/projects", color: "bg-info-bg text-info", urgent: false, sub: null },
    { label: "Unread Messages", value: contacts, icon: Mail, href: "/contacts", color: "bg-warning-bg text-warning", urgent: contacts > 0, sub: null },
    { label: "Job Applications", value: jobs, icon: Article, href: "/jobs", color: "bg-primary-tint text-primary", urgent: false, sub: null },
    { label: "Ideas", value: ideas, icon: Lightbulb, href: "/ideas", color: "bg-success-bg text-success", urgent: false, sub: null },
  ]

  const studioStats = [
    { label: "Active Work", value: activeWork, icon: ViewKanban, href: "/work", color: "bg-info-bg text-info", urgent: false, sub: "in progress" },
    { label: "Unpaid Invoices", value: unpaidDocs.length, icon: RequestQuote, href: "/invoices", color: "bg-warning-bg text-warning", urgent: unpaidDocs.length > 0, sub: unpaidLabel },
  ]

  const blogStats = [
    { label: "Published Posts", value: publishedPosts, icon: EditNote, href: "/blog", color: "bg-success-bg text-success", sub: draftPosts > 0 ? `${draftPosts} draft${draftPosts === 1 ? "" : "s"}` : null },
    { label: "Subscribers", value: subscribers, icon: MarkEmailRead, href: "/blog/subscribers", color: "bg-info-bg text-info", sub: null },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Your portfolio, studio, and everything in between.</p>
      </div>

      {/* Studio stats */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Studio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studioStats.map(({ label, value, icon: Icon, href, color, urgent, sub }) => (
            <Link
              key={label}
              href={href}
              className={`bg-white p-5 hover:shadow-md transition-all flex flex-col justify-between rounded-3xl shadow-md ${urgent ? "ring-2 ring-warning-bg" : ""}`}
            >
              <div>
                <div className={`inline-flex p-2.5 rounded-3xl ${color} mb-4`}>
                  <Icon sx={{ fontSize: 20 }} />
                </div>
                <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
                <p className="text-sm font-medium text-muted mt-1">{label}</p>
                {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
              </div>
              {urgent && (
                <p className="text-xs text-warning mt-3 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  Needs attention
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Portfolio stats */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Portfolio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioStats.map(({ label, value, icon: Icon, href, color, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`bg-white p-5 hover:shadow-md transition-all flex flex-col justify-between rounded-3xl shadow-md ${
              urgent ? "ring-2 ring-warning-bg" : ""
            }`}
          >
            <div>
              <div className={`inline-flex p-2.5 rounded-3xl ${color} mb-4`}>
                <Icon sx={{ fontSize: 20 }} />
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
              <p className="text-sm font-medium text-muted mt-1">{label}</p>
            </div>
            {urgent && (
              <p className="text-xs text-warning mt-3 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                Needs attention
              </p>
            )}
          </Link>
        ))}
        </div>
      </div>

      {/* Blog stats */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Blog</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {blogStats.map(({ label, value, icon: Icon, href, color, sub }) => (
            <Link key={label} href={href} className="bg-white p-5 hover:shadow-md transition-all rounded-3xl shadow-md">
              <div className={`inline-flex p-2.5 rounded-3xl ${color} mb-4`}>
                <Icon sx={{ fontSize: 20 }} />
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
              <p className="text-sm font-medium text-muted mt-1">{label}</p>
              {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent messages */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Message className="text-muted" sx={{ fontSize: 18 }} />
            <h2 className="font-semibold text-foreground">Recent Messages</h2>
          </div>
          <Link href="/contacts" className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5 transition-colors">
            View all <ChevronRight sx={{ fontSize: 14 }} />
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No messages yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentContacts.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-surface transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    {!c.read && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-warning-bg text-warning px-1.5 py-0.5 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{c.email}</p>
                  {c.subject && <p className="text-xs text-muted mt-1 italic font-medium truncate">{c.subject}</p>}
                </div>
                <time className="text-xs text-muted font-medium shrink-0">
                  {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(c.createdAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
