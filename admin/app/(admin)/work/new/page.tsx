"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"

type Client = { id: string; name: string; company: string | null }

const STATUSES = [
  { key: "backlog", label: "Backlog" },
  { key: "scoping", label: "Scoping" },
  { key: "active", label: "Active" },
  { key: "review", label: "Review" },
  { key: "staged", label: "Staged" },
  { key: "shipped", label: "Shipped" },
  { key: "paused", label: "Paused" },
]

const empty = {
  title: "", clientId: "", status: "backlog", billingType: "fixed",
  rate: "", budget: "", currency: "USD", startDate: "", dueDate: "", description: "",
}

export default function NewWorkProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(empty)

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async (): Promise<Client[]> => {
      const res = await fetch("/api/studio/clients")
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/studio/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          clientId: form.clientId || null,
          status: form.status,
          billingType: form.billingType,
          rate: form.rate ? parseFloat(form.rate) : null,
          budget: form.budget ? parseFloat(form.budget) : null,
          currency: form.currency,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          description: form.description || null,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}, project was not saved`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-projects"] })
      router.push("/work")
    },
  })

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  const saving = saveMutation.isPending
  const saveError = saveMutation.isError ? "Something went wrong, project was not saved. Please try again." : null

  const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors"
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/work" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">New Project</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Title <span className="text-danger">*</span></label>
          <input value={form.title} onChange={f("title")} className={inputCls} placeholder="Project name" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Client</label>
            <select value={form.clientId} onChange={f("clientId")} className={inputCls}>
              <option value="">No client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company ?? c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={f("status")} className={inputCls}>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Billing type</label>
            <select value={form.billingType} onChange={f("billingType")} className={inputCls}>
              <option value="fixed">Fixed price</option>
              <option value="hourly">Hourly rate</option>
              <option value="retainer">Retainer</option>
              <option value="pro_bono">Pro Bono</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select value={form.currency} onChange={f("currency")} className={inputCls}>
              <option value="USD">USD</option>
              <option value="ZMW">ZMW</option>
            </select>
          </div>
        </div>
        {(form.billingType === "fixed") && (
          <div>
            <label className={labelCls}>Budget</label>
            <input type="number" value={form.budget} onChange={f("budget")} className={inputCls} placeholder="0.00" />
          </div>
        )}
        {(form.billingType === "hourly" || form.billingType === "retainer") && (
          <div>
            <label className={labelCls}>{form.billingType === "retainer" ? "Monthly rate" : "Hourly rate"}</label>
            <input type="number" value={form.rate} onChange={f("rate")} className={inputCls} placeholder="0.00" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start date</label>
            <input type="date" value={form.startDate} onChange={f("startDate")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Due date</label>
            <input type="date" value={form.dueDate} onChange={f("dueDate")} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={f("description")} rows={3} className={`${inputCls} resize-none`} />
        </div>

        {saveError && (
          <p className="text-xs text-danger bg-danger-bg rounded-3xl px-3 py-2">{saveError}</p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => saveMutation.mutate()} disabled={saving || !form.title.trim()}
            className="flex-1 bg-primary text-white py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60">
            {saving ? "Saving..." : "Create project"}
          </button>
          <Link href="/work"
            className="flex-1 text-center bg-surface py-2.5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
