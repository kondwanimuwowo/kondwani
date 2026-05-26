import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  Code, Mail, Article, Lightbulb,
  ChevronRight, Message, ViewKanban, RequestQuote,
} from "@mui/icons-material"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [projects, contacts, jobs, ideas, activeWork, unpaidDocs] = await Promise.all([
    prisma.project.count(),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.jobApplication.count(),
    prisma.idea.count(),
    prisma.workProject.count({ where: { status: { in: ["active", "review", "staged"] } } }),
    prisma.document.findMany({
      where: { type: "invoice", status: { in: ["sent", "draft"] } },
      include: { items: { select: { amount: true } } },
    }),
  ])

  const unpaidTotal = unpaidDocs.reduce((sum: number, doc) => {
    const sub = doc.items.reduce((s: number, i: { amount: number }) => s + i.amount, 0)
    return sum + sub
  }, 0)

  const recentContacts = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const portfolioStats = [
    { label: "Projects", value: projects, icon: Code, href: "/projects", color: "bg-blue-50 text-blue-600 border-blue-100", urgent: false, sub: null },
    { label: "Unread Messages", value: contacts, icon: Mail, href: "/contacts", color: "bg-amber-50 text-amber-600 border-amber-100", urgent: contacts > 0, sub: null },
    { label: "Job Applications", value: jobs, icon: Article, href: "/jobs", color: "bg-purple-50 text-purple-600 border-purple-100", urgent: false, sub: null },
    { label: "Ideas", value: ideas, icon: Lightbulb, href: "/ideas", color: "bg-emerald-50 text-emerald-600 border-emerald-100", urgent: false, sub: null },
  ]

  const studioStats = [
    { label: "Active Work", value: activeWork, icon: ViewKanban, href: "/work", color: "bg-blue-50 text-blue-600 border-blue-100", urgent: false, sub: "in progress" },
    { label: "Unpaid Invoices", value: unpaidDocs.length, icon: RequestQuote, href: "/invoices", color: "bg-amber-50 text-amber-600 border-amber-100", urgent: unpaidDocs.length > 0, sub: unpaidTotal > 0 ? `USD ${unpaidTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your portfolio, studio, and everything in between.</p>
      </div>

      {/* Studio stats */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">Studio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studioStats.map(({ label, value, icon: Icon, href, color, urgent, sub }) => (
            <Link
              key={label}
              href={href}
              className={`bg-white border p-5 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl ${urgent ? "border-amber-300 ring-2 ring-amber-300/10" : "border-slate-200"}`}
            >
              <div>
                <div className={`inline-flex p-2.5 rounded-lg border ${color} mb-4`}>
                  <Icon sx={{ fontSize: 20 }} />
                </div>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
              </div>
              {urgent && (
                <p className="text-xs text-amber-600 mt-3 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Needs attention
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Portfolio stats */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">Portfolio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioStats.map(({ label, value, icon: Icon, href, color, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`bg-white border p-5 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl ${
              urgent ? "border-amber-300 ring-2 ring-amber-300/10" : "border-slate-200"
            }`}
          >
            <div>
              <div className={`inline-flex p-2.5 rounded-lg border ${color} mb-4`}>
                <Icon sx={{ fontSize: 20 }} />
              </div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
            </div>
            {urgent && (
              <p className="text-xs text-amber-600 mt-3 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Needs attention
              </p>
            )}
          </Link>
        ))}
        </div>
      </div>

      {/* Recent messages */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Message className="text-slate-400" sx={{ fontSize: 18 }} />
            <h2 className="font-semibold text-slate-850">Recent Messages</h2>
          </div>
          <Link href="/contacts" className="text-xs font-semibold text-[#7E1416] hover:text-[#601012] flex items-center gap-0.5 transition-colors">
            View all <ChevronRight sx={{ fontSize: 14 }} />
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <p className="px-6 py-12 text-sm text-slate-400 text-center">No messages yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentContacts.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    {!c.read && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 border border-amber-100 rounded" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.email}</p>
                  {c.subject && <p className="text-xs text-slate-500 mt-1 italic font-medium truncate">{c.subject}</p>}
                </div>
                <time className="text-xs text-slate-400 font-medium shrink-0">
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
