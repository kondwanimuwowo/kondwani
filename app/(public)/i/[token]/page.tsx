import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PrintButton } from "./PrintButton"
import { PaymentWidget } from "./PaymentWidget"

export const revalidate = 60

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const doc = await db.query.document.findFirst({ where: (t, { eq }) => eq(t.token, token), columns: { number: true, type: true } })
  if (!doc) return {}
  return {
    title: `${doc.number} — Kondwani Muwowo`,
    robots: { index: false },
  }
}

export default async function PublicDocumentPage({ params }: Props) {
  const { token } = await params
  const doc = await db.query.document.findFirst({
    where: (t, { eq }) => eq(t.token, token),
    with: {
      client: true,
      items: { orderBy: (t, { asc }) => asc(t.position) },
    },
  })
  if (!doc) return notFound()

  const subtotal = doc.items.reduce((s: number, i: { amount: number }) => s + i.amount, 0)
  const taxAmount = subtotal * (doc.taxRate / 100)
  const total = subtotal + taxAmount
  const { currency } = doc

  function fmt(date: Date | null) {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  function money(n: number) {
    return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const isPaid = doc.status === "paid"
  const isAccepted = doc.status === "accepted"
  const isVoid = doc.status === "void"

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 32px !important; }
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-border px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold tracking-tight text-foreground">[&lt;ondwani</span>
          <span className="text-muted/40">·</span>
          <span className="text-sm font-mono text-muted">{doc.number}</span>
        </div>
        <PrintButton />
      </div>

      {/* Document */}
      <div className="min-h-screen bg-[#f5f5f4] py-10 px-4 print:py-0 print:px-0">
        <div className="print-page max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:rounded-none print:shadow-none">
          {/* Header band */}
          <div className="bg-foreground text-white px-10 py-8 relative overflow-hidden">
            {/* Watermark for paid/accepted */}
            {(isPaid || isAccepted) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[80px] font-black uppercase text-emerald-400/20 rotate-[-30deg] tracking-widest">
                  {isPaid ? "PAID" : "ACCEPTED"}
                </span>
              </div>
            )}
            {isVoid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[80px] font-black uppercase text-red-400/20 rotate-[-30deg] tracking-widest">VOID</span>
              </div>
            )}
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-4xl font-black tracking-tight opacity-10 leading-none mb-1">
                  {doc.type.toUpperCase()}
                </p>
                <p className="text-2xl font-mono font-bold tracking-tight">{doc.number}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-lg tracking-tight">[&lt;ondwani</p>
                <p className="text-white/60 text-sm">kondwanimuwowo.com</p>
                <p className="text-white/60 text-sm">kondwanimuwowo@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="px-10 py-8">
            {/* Meta row */}
            <div className="flex items-start justify-between mb-8">
              {/* Client */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Billed to</p>
                <p className="font-bold text-foreground">{doc.client.company ?? doc.client.name}</p>
                {doc.client.company && <p className="text-sm text-muted">{doc.client.name}</p>}
                <p className="text-sm text-muted">{doc.client.email}</p>
              </div>
              {/* Dates + status */}
              <div className="text-right space-y-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Issue date</p>
                  <p className="text-sm font-medium text-foreground">{fmt(doc.issueDate)}</p>
                </div>
                {doc.dueDate && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      {doc.type === "invoice" ? "Due date" : "Valid until"}
                    </p>
                    <p className="text-sm font-medium text-foreground">{fmt(doc.dueDate)}</p>
                  </div>
                )}
                <div className="pt-1">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                    isPaid || isAccepted ? "bg-emerald-50 text-emerald-700" :
                    doc.status === "sent" ? "bg-blue-50 text-blue-700" :
                    doc.status === "review" ? "bg-amber-50 text-amber-700" :
                    isVoid ? "bg-slate-100 text-slate-400" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {doc.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="text-left text-xs font-bold uppercase tracking-widest text-muted pb-3">Description</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-muted pb-3 w-16">Qty</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-muted pb-3 w-28">Rate</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-muted pb-3 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item: { id: string; description: string; quantity: number; rate: number; amount: number }, i: number) => (
                  <tr key={item.id} className={i % 2 === 0 ? "" : "bg-surface/50"}>
                    <td className="py-3 text-sm text-foreground">{item.description}</td>
                    <td className="py-3 text-sm text-muted text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-muted text-right">{money(item.rate)}</td>
                    <td className="py-3 text-sm font-medium text-foreground text-right">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span><span>{money(subtotal)}</span>
                </div>
                {doc.taxRate > 0 && (
                  <div className="flex justify-between text-sm text-muted">
                    <span>Tax ({doc.taxRate}%)</span><span>{money(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground border-t border-foreground pt-2 mt-2">
                  <span>Total</span><span>{money(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {doc.notes && (
              <div className="border-t border-border pt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Notes</p>
                <p className="text-sm text-muted whitespace-pre-wrap">{doc.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Options Panel (no-print) */}
        {(doc.status === "sent" || doc.status === "review") && (
          <div className="no-print max-w-3xl mx-auto mt-6">
            <PaymentWidget token={token} currency={currency} total={total} />
          </div>
        )}
      </div>
    </>
  )
}
