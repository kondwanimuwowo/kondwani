import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const [total, byPath] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 20,
    }),
  ])

  const recent = await prisma.pageView.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { path: true, referrer: true, createdAt: true },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted">{total.toLocaleString()} total page views</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Top Pages</h2>
          </div>
          <div className="divide-y divide-border">
            {byPath.map(({ path, _count }: { path: string; _count: { path: number } }) => (
              <div key={path} className="px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-foreground font-mono">{path}</span>
                <span className="text-sm font-semibold text-foreground">{_count.path.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Visits</h2>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recent.map((v: { path: string; referrer: string | null; createdAt: Date }, i) => (
              <div key={i} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-foreground">{v.path}</span>
                  <time className="text-xs text-muted/60">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(v.createdAt)}
                  </time>
                </div>
                {v.referrer && <p className="text-xs text-muted truncate mt-0.5">{v.referrer}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
