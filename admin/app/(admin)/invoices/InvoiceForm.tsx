"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Add, Close } from "@mui/icons-material"

type Client = { id: string; name: string; company: string | null; currency: string }
type Project = { id: string; title: string; clientId: string | null }
type DocItem = { id?: string; description: string; quantity: number; rate: number; flat: boolean }
export type Document = {
  id: string; type: string; number: string; status: string
  clientId: string; client: { name: string; company: string | null }
  projectId: string | null; project: { title: string } | null
  currency: string; issueDate: string; dueDate: string | null
  taxRate: number; notes: string | null; token: string
  items: { id: string; description: string; quantity: number; rate: number; amount: number; flat: boolean }[]
}

const INVOICE_STATUSES = ["draft", "sent", "paid", "void"]
const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined", "expired"]

function newItem(): DocItem {
  return { description: "", quantity: 1, rate: 0, flat: false }
}

function calcSubtotal(items: DocItem[]) {
  return items.reduce((s, i) => s + (i.flat ? i.rate : i.quantity * i.rate), 0)
}

function formatNum(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  document?: Document
  initialType?: "invoice" | "quote"
  initialProjectId?: string
  initialClientId?: string
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function InvoiceForm({ document: doc, initialType, initialProjectId, initialClientId, onSaved, onCancel, onDeleted }: Props) {
  const editId = doc?.id
  const queryClient = useQueryClient()

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async (): Promise<Client[]> => {
      const res = await fetch("/api/studio/clients")
      if (!res.ok) throw new Error()
      return res.json()
    },
  })
  const { data: projects = [] } = useQuery({
    queryKey: ["work-projects"],
    queryFn: async (): Promise<Project[]> => {
      const res = await fetch("/api/studio/work")
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  const [fType, setFType] = useState<"invoice" | "quote">((doc?.type as "invoice" | "quote") ?? initialType ?? "invoice")
  const [fClientId, setFClientId] = useState(doc?.clientId ?? initialClientId ?? "")
  const [fProjectId, setFProjectId] = useState(doc?.projectId ?? initialProjectId ?? "")
  const [fCurrency, setFCurrency] = useState(doc?.currency ?? "USD")
  const [fIssueDate, setFIssueDate] = useState(doc?.issueDate.split("T")[0] ?? new Date().toISOString().split("T")[0])
  const [fDueDate, setFDueDate] = useState(doc?.dueDate ? doc.dueDate.split("T")[0] : "")
  const [fTaxRate, setFTaxRate] = useState(doc?.taxRate ?? 0)
  const [fNotes, setFNotes] = useState(doc?.notes ?? "")
  const [fItems, setFItems] = useState<DocItem[]>(
    doc ? doc.items.map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate, flat: i.flat })) : [newItem()]
  )
  const [fStatus, setFStatus] = useState(doc?.status ?? "draft")

  function updateItem(idx: number, field: keyof DocItem, value: string | number | boolean) {
    setFItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const saveMutation = useMutation({
    mutationFn: async (status?: string) => {
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
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      if (editId) queryClient.invalidateQueries({ queryKey: ["invoice", editId] })
      onSaved()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/studio/invoices/${editId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      onDeleted?.()
    },
  })

  function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this document?")) return
    deleteMutation.mutate()
  }

  const saving = saveMutation.isPending
  const deleting = deleteMutation.isPending
  const saveError = saveMutation.isError
    ? "Something went wrong. Please try again."
    : deleteMutation.isError
    ? "Failed to delete. Please try again."
    : null

  const subtotal = calcSubtotal(fItems)
  const taxAmount = subtotal * (fTaxRate / 100)
  const total = subtotal + taxAmount

  const clientProjects = projects.filter(p => !fClientId || p.clientId === fClientId)

  const inputCls = "w-full px-3 py-2 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors bg-surface border border-border"
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"

  return (
    <div className="space-y-5">
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

      {editId && (
        <div>
          <label className={labelCls}>Status</label>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={inputCls}>
            {(fType === "invoice" ? INVOICE_STATUSES : QUOTE_STATUSES).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

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
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
          <span>Total</span>
          <span>{formatNum(total, fCurrency)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Payment terms, bank details, thank-you note…" />
      </div>

      {saveError && (
        <p className="text-xs text-danger bg-danger-bg rounded-3xl px-3 py-2">{saveError}</p>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {editId && (
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="text-sm font-semibold text-danger hover:text-danger transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onCancel}
          disabled={saving || deleting}
          className="bg-surface py-2.5 px-5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        {editId ? (
          <button
            onClick={() => saveMutation.mutate(undefined)}
            disabled={saving || deleting || !fClientId}
            className="bg-primary text-white py-2.5 px-5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : (
          <>
            <button
              onClick={() => saveMutation.mutate("draft")}
              disabled={saving || !fClientId}
              className="bg-surface py-2.5 px-5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              onClick={() => saveMutation.mutate("sent")}
              disabled={saving || !fClientId}
              className="bg-primary text-white py-2.5 px-5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & mark sent"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
