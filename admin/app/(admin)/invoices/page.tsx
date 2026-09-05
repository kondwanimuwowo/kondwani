"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Add, ContentCopy, Check, Delete, Close } from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"

type Client = { id: string; name: string; company: string | null; currency: string }
type Project = { id: string; title: string; clientId: string | null }
type DocItem = { id?: string; description: string; quantity: number; rate: number; flat: boolean }
type Document = {
  id: string; type: string; number: string; status: string
  clientId: string; client: { name: string; company: string | null }
  projectId: string | null; project: { title: string } | null
  currency: string; issueDate: string; dueDate: string | null
  taxRate: number; notes: string | null; token: string
  items: { id: string; description: string; quantity: number; rate: number; amount: number; flat: boolean }[]
}

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

function newItem(): DocItem {
  return { description: "", quantity: 1, rate: 0, flat: false }
}

function calcSubtotal(items: DocItem[]) {
  return items.reduce((s, i) => s + (i.flat ? i.rate : i.quantity * i.rate), 0)
}

function fmt(date: string | null) {
  if (!date) return "Not set"
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatNum(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InvoicesContent() {
  const searchParams = useSearchParams()
  const [docs, setDocs] = useState<Document[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tab, setTab] = useState<"all" | "invoice" | "quote">("all")
  const [showPanel, setShowPanel] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form state
  const [fType, setFType] = useState<"invoice" | "quote">("invoice")
  const [fClientId, setFClientId] = useState("")
  const [fProjectId, setFProjectId] = useState("")
  const [fCurrency, setFCurrency] = useState("USD")
  const [fIssueDate, setFIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [fDueDate, setFDueDate] = useState("")
  const [fTaxRate, setFTaxRate] = useState(0)
  const [fNotes, setFNotes] = useState("")
  const [fItems, setFItems] = useState<DocItem[]>([newItem()])
  const [fStatus, setFStatus] = useState("draft")

  async function load() {
    const [dRes, cRes, pRes] = await Promise.all([
      fetch("/api/studio/invoices"),
      fetch("/api/studio/clients"),
      fetch("/api/studio/work"),
    ])
    setDocs(await dRes.json())
    setClients(await cRes.json())
    setProjects(await pRes.json())
  }

  useEffect(() => { load() }, [])

  // Handle ?new=invoice/quote&project=...&client=... from project detail quick-actions
  useEffect(() => {
    const newType = searchParams.get("new")
    if (newType === "invoice" || newType === "quote") {
      openCreate(newType)
      const clientId = searchParams.get("client")
      const projectId = searchParams.get("project")
      if (clientId) setFClientId(clientId)
      if (projectId) setFProjectId(projectId)
    }
  }, [searchParams])

  function openCreate(type: "invoice" | "quote" = "invoice") {
    setEditId(null)
    setFType(type)
    setFClientId("")
    setFProjectId("")
    setFCurrency("USD")
    setFIssueDate(new Date().toISOString().split("T")[0])
    setFDueDate("")
    setFTaxRate(0)
    setFNotes("")
    setFItems([newItem()])
    setFStatus("draft")
    setShowPanel(true)
  }

  function openEdit(doc: Document) {
    setEditId(doc.id)
    setFType(doc.type as "invoice" | "quote")
    setFClientId(doc.clientId)
    setFProjectId(doc.projectId ?? "")
    setFCurrency(doc.currency)
    setFIssueDate(doc.issueDate.split("T")[0])
    setFDueDate(doc.dueDate ? doc.dueDate.split("T")[0] : "")
    setFTaxRate(doc.taxRate)
    setFNotes(doc.notes ?? "")
    setFStatus(doc.status)
    setFItems(doc.items.map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate, flat: i.flat })))
    setShowPanel(true)
  }

  async function handleSave(status?: string) {
    setSaving(true)
    setSaveError(null)
    try {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/studio/invoices/${editId}` : "/api/studio/invoices"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fType,
          clientId: fClientId,
          projectId: fProjectId || null,
          currency: fCurrency,
          issueDate: fIssueDate,
          dueDate: fDueDate || null,
          taxRate: fTaxRate,
          notes: fNotes || null,
          status: status ?? fStatus,
          items: fItems.filter(i => i.description.trim()),
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setShowPanel(false)
      load()
    } catch {
      setSaveError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return
    try {
      const res = await fetch(`/api/studio/invoices/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Failed to delete. Please try again.")
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/studio/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin.replace(/admin\./, "")}/i/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function updateItem(idx: number, field: keyof DocItem, value: string | number | boolean) {
    setFItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const subtotal = calcSubtotal(fItems)
  const taxAmount = subtotal * (fTaxRate / 100)
  const total = subtotal + taxAmount

  const clientProjects = projects.filter(p => !fClientId || p.clientId === fClientId)
  const filtered = docs.filter(d => tab === "all" || d.type === tab)

  const inputCls = "w-full px-3 py-2 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors bg-surface"
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Invoices</h1>
          <p className="text-sm text-muted">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          <Add sx={{ fontSize: 18 }} /> New document
        </button>
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
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No documents yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="shadow-[0_1px_0_0_var(--color-border)]">
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
                        <button onClick={() => openEdit(doc)} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</button>
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

      {/* ── Slide-in panel ────────────────────────────────────────────────── */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setShowPanel(false)} />
          <div className="w-[560px] bg-white h-full flex flex-col overflow-hidden shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 shadow-[0_1px_0_0_var(--color-border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-surface rounded-full p-0.5">
                  {(["invoice", "quote"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setFType(t)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${fType === t ? "bg-white text-foreground shadow-md" : "text-muted"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {editId && <p className="text-xs text-muted">Editing</p>}
              </div>
              <button onClick={() => setShowPanel(false)} className="text-muted hover:text-foreground transition-colors">
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Client + project */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Client <span className="text-danger">*</span></label>
                  <select value={fClientId} onChange={e => { setFClientId(e.target.value); setFProjectId(""); const c = clients.find(c => c.id === e.target.value); if (c) setFCurrency(c.currency) }} className={inputCls}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Project</label>
                  <select value={fProjectId} onChange={e => setFProjectId(e.target.value)} className={inputCls}>
                    <option value="">No project</option>
                    {clientProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates + currency */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Issue date</label>
                  <input type="date" value={fIssueDate} onChange={e => setFIssueDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{fType === "invoice" ? "Due date" : "Expiry date"}</label>
                  <input type="date" value={fDueDate} onChange={e => setFDueDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={fCurrency} onChange={e => setFCurrency(e.target.value)} className={inputCls}>
                    <option value="USD">USD</option>
                    <option value="ZMW">ZMW</option>
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div>
                <label className={labelCls}>Line items</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_60px_80px_70px_28px] gap-2 text-[10px] font-bold uppercase tracking-widest text-muted px-1">
                    <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span />
                  </div>
                  {fItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_80px_70px_28px] gap-2 items-center">
                      <input
                        value={item.description}
                        onChange={e => updateItem(idx, "description", e.target.value)}
                        placeholder="Description"
                        className={inputCls}
                      />
                      {item.flat ? (
                        <div className="col-span-2">
                          <input type="number" value={item.rate} onChange={e => updateItem(idx, "rate", parseFloat(e.target.value) || 0)} className={inputCls} />
                        </div>
                      ) : (
                        <>
                          <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className={inputCls} />
                          <input type="number" value={item.rate} onChange={e => updateItem(idx, "rate", parseFloat(e.target.value) || 0)} className={inputCls} />
                        </>
                      )}
                      <span className="text-sm text-muted text-right">
                        {(item.flat ? item.rate : item.quantity * item.rate).toFixed(2)}
                      </span>
                      <button onClick={() => setFItems(prev => prev.filter((_, i) => i !== idx))} className="text-muted hover:text-danger transition-colors justify-self-center">
                        <Close sx={{ fontSize: 15 }} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => setFItems(prev => [...prev, newItem()])} className="text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                      <Add sx={{ fontSize: 14 }} /> Add line
                    </button>
                    <button onClick={() => setFItems(prev => [...prev, { ...newItem(), flat: true }])} className="text-xs text-muted hover:text-foreground transition-colors">
                      + Flat amount
                    </button>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-surface rounded-3xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span>{formatNum(subtotal, fCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Tax</span>
                    <input
                      type="number"
                      value={fTaxRate}
                      onChange={e => setFTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-xs bg-white rounded-full outline-none focus:ring-2 focus:ring-primary-tint"
                      min={0} max={100}
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                  <span className="text-sm text-muted">{formatNum(taxAmount, fCurrency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground pt-2 shadow-[0_-1px_0_0_var(--color-border)]">
                  <span>Total</span>
                  <span>{formatNum(total, fCurrency)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Payment terms, bank details, thank-you note…" />
              </div>
            </div>

            {/* Panel footer */}
            <div className="shrink-0 px-6 py-4 shadow-[0_-1px_0_0_var(--color-border)] space-y-3">
              {saveError && (
                <p className="text-xs text-danger bg-danger-bg rounded-3xl px-3 py-2">{saveError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving || !fClientId}
                  className="flex-1 bg-surface py-2.5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors disabled:opacity-60"
                >
                  Save draft
                </button>
                <button
                  onClick={() => handleSave("sent")}
                  disabled={saving || !fClientId}
                  className="flex-1 bg-primary text-white py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save & mark sent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesContent />
    </Suspense>
  )
}
