"use client"

import { useState, useEffect } from "react"
import { Business, Email, Phone, Language, Add, Edit, Delete } from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"

type Client = {
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

const statusColors: Record<string, string> = {
  active: "bg-success-bg text-success",
  lead: "bg-warning-bg text-warning",
  inactive: "bg-neutral-bg text-muted",
}
const statusTips: Record<string, string> = {
  active: "Current client, actively working together",
  lead: "Prospective client, in discussion or negotiation",
  inactive: "Past client, no current active projects",
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch("/api/studio/clients")
    setClients(await res.json())
  }

  useEffect(() => { load() }, [])

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  function openCreate() {
    setForm(empty)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name, company: c.company ?? "", email: c.email,
      phone: c.phone ?? "", website: c.website ?? "",
      currency: c.currency, notes: c.notes ?? "", status: c.status,
    })
    setEditId(c.id)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/studio/clients/${editId}` : "/api/studio/clients"
    await fetch(url, {
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
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? All linked projects and documents will also be deleted.")) return
    await fetch(`/api/studio/clients/${id}`, { method: "DELETE" })
    load()
  }

  const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors"
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Clients</h1>
          <p className="text-sm text-muted">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          <Add sx={{ fontSize: 18 }} /> New client
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-lg my-8">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "New"} Client</h2>
            <div className="space-y-4">
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
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.email}
                className="flex-1 bg-primary text-white py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex-1 bg-surface py-2.5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client grid */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-md p-16 text-center">
          <Business sx={{ fontSize: 40 }} className="text-border mx-auto mb-4" />
          <p className="text-sm text-muted mb-1">No clients yet</p>
          <p className="text-xs text-muted">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-3xl shadow-md hover:shadow-md p-5 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{(c.company ?? c.name).charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.company ?? c.name}</p>
                    {c.company && <p className="text-xs text-muted">{c.name}</p>}
                  </div>
                </div>
                <Tooltip content={statusTips[c.status] ?? c.status}>
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full cursor-default ${statusColors[c.status] ?? statusColors.inactive}`}>
                    {c.status}
                  </span>
                </Tooltip>
              </div>

              <div className="space-y-1.5 mb-4">
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors">
                  <Email sx={{ fontSize: 14 }} /> {c.email}
                </a>
                {c.phone && (
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Phone sx={{ fontSize: 14 }} /> {c.phone}
                  </p>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors truncate">
                    <Language sx={{ fontSize: 14 }} /> {c.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted">{c.currency}</span>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1">
                    <Edit sx={{ fontSize: 14 }} /> Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-danger hover:text-danger transition-colors flex items-center gap-1">
                    <Delete sx={{ fontSize: 14 }} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
