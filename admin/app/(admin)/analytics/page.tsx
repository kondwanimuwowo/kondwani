import { db, pageView } from "@/lib/db"
import { count, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const [[{ total }], byPathRaw] = await Promise.all([
    db.select({ total: count() }).from(pageView),
    db
      .select({ path: pageView.path, count: count() })
      .from(pageView)
      .groupBy(pageView.path)
      .orderBy(desc(count()))
      .limit(20),
  ])
  const byPath = byPathRaw.map((r) => ({ path: r.path, _count: { path: r.count } }))

  const recent = await db
    .select({ path: pageView.path, referrer: pageView.referrer, createdAt: pageView.createdAt })
    .from(pageView)
    .orderBy(desc(pageView.createdAt))
    .limit(50)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted">{total.toLocaleString()} total page views</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="px-6 py-4 shadow-[0_1px_0_0_var(--color-border)]">
            <h2 className="font-semibold text-foreground">Top Pages</h2>
          </div>
          <div>
            {byPath.map(({ path, _count }: { path: string; _count: { path: number } }, i: number) => (
              <div key={path} className={`px-6 py-3 flex items-center justify-between ${i % 2 === 1 ? "bg-surface" : ""}`}>
                <span className="text-sm text-foreground font-mono">{path}</span>
                <span className="text-sm font-semibold text-foreground">{_count.path.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="px-6 py-4 shadow-[0_1px_0_0_var(--color-border)]">
            <h2 className="font-semibold text-foreground">Recent Visits</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {recent.map((v: { path: string; referrer: string | null; createdAt: Date }, i) => (
              <div key={i} className={`px-6 py-3 ${i % 2 === 1 ? "bg-surface" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-foreground">{v.path}</span>
                  <time className="text-xs text-muted">
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
