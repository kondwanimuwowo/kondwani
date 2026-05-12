import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [projects, contacts, jobs, ideas] = await Promise.all([
    prisma.project.count(),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.jobApplication.count(),
    prisma.idea.count(),
  ])

  const recentContacts = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const stats = [
    { label: "Projects", value: projects },
    { label: "Unread Messages", value: contacts },
    { label: "Job Applications", value: jobs },
    { label: "Ideas", value: ideas },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-sm text-muted mb-8">Welcome back, Kondwani.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-5">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Messages</h2>
        </div>
        {recentContacts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">No messages yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentContacts.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {!c.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted truncate">{c.email}</p>
                  {c.subject && <p className="text-xs text-muted/70 truncate">{c.subject}</p>}
                </div>
                <time className="text-xs text-muted/60 shrink-0">
                  {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(c.createdAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
