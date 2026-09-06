"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Add, ContentCopy, Check, Delete } from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"
import { fetchWithRetry, type Document } from "./InvoiceForm"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-bg text-muted", sent: "bg-info-bg text-info",
  paid: "bg-success-bg text-success", void: "bg-neutral-bg text-muted",
  accepted: "bg-success-bg text-success", declined: "bg-danger-bg text-danger",
  expired: "bg-neutral-bg text-muted",
}
const STATUS_TIPS: Record<string, string> = {
  draft: "Not sent, still being prepared",
  sent: "Delivered to client, awaiting payment/response",
  paid: "Invoice settled",
  void: "Cancelled, no longer valid",
  accepted: "Quote approved by client",
  declined: "Quote rejected by client",
  expired: "Quote deadline passed without a response",
}

const INVOICE_STATUSES = ["draft", "sent", "paid", "void"]
const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "expired"]

function fmt(date: string | null) {
  if (!date) return "Not set"
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatNum(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function InvoicesPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [tab, setTab] = useState<"all" | "invoice" | "quote">("all")
  const [copied, setCopied] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoadError(false)
    try {
      const res = await fetchWithRetry("/api/studio/invoices", {})
      if (!res.ok) throw new Error()
      setDocs(await res.json())
      setLoaded(true)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return
    try {
      const res = await fetchWithRetry(`/api/studio/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Failed to delete. Please try again.")
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetchWithRetry(`/api/studio/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Failed to update status. Please try again.")
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin.replace(/admin\./, "")}/i/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = docs.filter(d => tab === "all" || d.type === tab)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Invoices</h1>
          <p className="text-sm text-muted">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          <Add sx={{ fontSize: 18 }} /> New document
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-surface rounded-full p-1 w-fit">
        {(["all", "invoice", "quote"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-foreground shadow-md" : "text-muted hover:text-foreground"}`}
          >
            {t === "all" ? "All" : t === "invoice" ? "Invoices" : "Quotes"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        {loadError ? (
          <div className="px-6 py-12 text-center space-y-3">
            <p className="text-danger font-medium text-sm">Couldn&apos;t load documents. This is a display error, not data loss.</p>
            <button
              onClick={load}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !loaded ? (
          <p className="px-6 py-12 text-sm text-muted text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No documents yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Number</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Project</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden lg:table-cell">Due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(doc => {
                const total = doc.items.reduce((s, i) => s + i.amount, 0)
                const tax = total * (doc.taxRate / 100)
                const grand = total + tax
                return (
                  <tr key={doc.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-semibold text-foreground">{doc.number}</p>
                      <p className="text-xs text-muted capitalize">{doc.type}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-foreground">{doc.client.company ?? doc.client.name}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-muted">{doc.project?.title ?? "No project"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Tooltip content={STATUS_TIPS[doc.status] ?? doc.status}>
                        <select
                          value={doc.status}
                          onChange={e => updateStatus(doc.id, e.target.value)}
                          className={`text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[doc.status] ?? "bg-neutral-bg text-muted"}`}
                        >
                          {(doc.type === "invoice" ? INVOICE_STATUSES : QUOTE_STATUSES).map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-foreground">{formatNum(grand, doc.currency)}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-sm text-muted">{fmt(doc.dueDate)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => copyLink(doc.token)}
                          className="text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          {copied === doc.token ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
                          {copied === doc.token ? "Copied" : "Link"}
                        </button>
                        <Link href={`/invoices/${doc.id}`} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</Link>
                        <button onClick={() => handleDelete(doc.id)} className="text-xs font-medium text-danger hover:text-danger transition-colors">
                          <Delete sx={{ fontSize: 15 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
