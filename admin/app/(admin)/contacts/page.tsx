import { prisma } from "@/lib/prisma"
import { MarkReadButton } from "./MarkReadButton"

export const dynamic = "force-dynamic"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
}

export default async function ContactsPage() {
  const contacts = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } })
  const unread = contacts.filter(c => !c.read).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Contact Submissions</h1>
        <p className="text-sm text-muted">{contacts.length} total · {unread} unread</p>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border px-6 py-16 text-center">
          <p className="text-muted">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border p-6 ${!c.read ? "border-primary/30" : "border-border"}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    {!c.read && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">New</span>}
                  </div>
                  <p className="text-sm text-muted">{c.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <time className="text-xs text-muted/60">{formatDate(c.createdAt)}</time>
                  {!c.read && <MarkReadButton id={c.id} />}
                </div>
              </div>
              {c.subject && <p className="text-sm font-medium text-foreground mb-2">{c.subject}</p>}
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{c.message}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <a href={`mailto:${c.email}`} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                  Reply ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
