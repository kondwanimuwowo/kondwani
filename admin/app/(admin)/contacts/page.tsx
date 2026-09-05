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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Contact Submissions</h1>
        <p className="text-sm text-muted mt-0.5">{contacts.length} messages total, {unread} unread</p>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-3xl px-6 py-16 text-center shadow-md">
          <p className="text-muted">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-3xl p-6 hover:shadow-md transition-all duration-200 ${
                !c.read ? "shadow-md" : "shadow-md"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-foreground tracking-tight text-[15px]">{c.name}</p>
                    {!c.read && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-warning-bg text-warning px-1.5 py-0.5 rounded-full">
                        New Message
                      </span>
                    )}
                  </div>
                  <a href={`mailto:${c.email}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors mt-0.5 block">
                    {c.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                  <time className="text-xs text-muted font-semibold">{formatDate(c.createdAt)}</time>
                  {!c.read && <MarkReadButton id={c.id} />}
                </div>
              </div>

              {c.subject && (
                <p className="text-sm font-bold text-foreground mb-2 italic">
                  &quot;{c.subject}&quot;
                </p>
              )}
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap font-sans bg-surface p-4 rounded-3xl">
                {c.message}
              </p>

              <div className="mt-4 pt-4 flex items-center justify-between">
                <a
                  href={`mailto:${c.email}`}
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5"
                >
                  Reply via email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
