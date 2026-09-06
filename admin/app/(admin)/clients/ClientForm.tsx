"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export type Client = {
  id: string
  name: string
  company: string | null
  email: string
  phone: string | null
  website: string | null
  currency: string
  notes: string | null
  status: string
  createdAt: string
  _count?: { workProjects: number }
}

const empty = {
  name: "", company: "", email: "", phone: "", website: "",
  currency: "USD", notes: "", status: "active",
}

function toFormState(c?: Client) {
  if (!c) return empty
  return {
    name: c.name, company: c.company ?? "", email: c.email,
    phone: c.phone ?? "", website: c.website ?? "",
    currency: c.currency, notes: c.notes ?? "", status: c.status,
  }
}

interface Props {
  client?: Client
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function ClientForm({ client, onSaved, onCancel, onDeleted }: Props) {
  const [form, setForm] = useState(toFormState(client))
  const editId = client?.id
  const queryClient = useQueryClient()

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/studio/clients/${editId}` : "/api/studio/clients"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company: form.company || null,
          phone: form.phone || null,
          website: form.website || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      if (editId) queryClient.invalidateQueries({ queryKey: ["client", editId] })
      onSaved()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/studio/clients/${editId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      onDeleted?.()
    },
  })

  function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this client? All linked projects and documents will also be deleted.")) return
    deleteMutation.mutate()
  }

  const saving = saveMutation.isPending
  const deleting = deleteMutation.isPending
  const error = saveMutation.isError
    ? "Something went wrong saving this client. Please try again."
    : deleteMutation.isError
    ? "Something went wrong deleting this client. Please try again."
    : null

  const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors"
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Name <span className="text-danger">*</span></label>
          <input value={form.name} onChange={f("name")} className={inputCls} placeholder="Full name" />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input value={form.company} onChange={f("company")} className={inputCls} placeholder="Company Ltd" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email <span className="text-red-500">*</span></label>
        <input type="email" value={form.email} onChange={f("email")} className={inputCls} placeholder="client@company.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Phone</label>
          <input value={form.phone} onChange={f("phone")} className={inputCls} placeholder="+260 97..." />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={form.website} onChange={f("website")} className={inputCls} placeholder="https://..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Currency</label>
          <select value={form.currency} onChange={f("currency")} className={inputCls}>
            <option value="USD">USD, US Dollar</option>
            <option value="ZMW">ZMW, Zambian Kwacha</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={f("status")} className={inputCls}>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={form.notes} onChange={f("notes")} rows={3} className={`${inputCls} resize-none`} placeholder="Any notes about this client..." />
      </div>

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
          className="bg-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saving || deleting || !form.name || !form.email}
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}
