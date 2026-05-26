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
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Contact Submissions</h1>
        <p className="text-sm text-slate-500 mt-0.5">{contacts.length} messages total · {unread} unread</p>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white border border-slate-200 px-6 py-16 text-center shadow-sm">
          <p className="text-slate-400">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`bg-white border p-6 hover:shadow-md transition-all duration-200 ${
                !c.read
                  ? "border-amber-300 ring-2 ring-amber-300/5 shadow-sm bg-amber-50/5"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-800 tracking-tight text-[15px]">{c.name}</p>
                    {!c.read && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 border border-amber-100 rounded">
                        New Message
                      </span>
                    )}
                  </div>
                  <a href={`mailto:${c.email}`} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mt-0.5 block">
                    {c.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                  <time className="text-xs text-slate-400 font-semibold">{formatDate(c.createdAt)}</time>
                  {!c.read && <MarkReadButton id={c.id} />}
                </div>
              </div>

              {c.subject && (
                <p className="text-sm font-bold text-slate-700 mb-2 italic">
                  &ldquo;{c.subject}&rdquo;
                </p>
              )}
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-4 border border-slate-100 rounded-lg">
                {c.message}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`mailto:${c.email}`}
                  className="text-xs font-semibold text-[#7E1416] hover:text-[#601012] transition-colors flex items-center gap-0.5"
                >
                  Reply via email ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
