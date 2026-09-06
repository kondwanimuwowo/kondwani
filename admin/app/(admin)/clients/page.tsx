"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Business, Email, Phone, Language, Add, Edit, Delete, Close } from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"
import { ClientForm, fetchWithRetry, type Client } from "./ClientForm"

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoadError(false)
    try {
      const res = await fetchWithRetry("/api/studio/clients", {})
      if (!res.ok) throw new Error()
      setClients(await res.json())
      setLoaded(true)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? All linked projects and documents will also be deleted.")) return
    setDeletingId(id)
    try {
      const res = await fetchWithRetry(`/api/studio/clients/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Something went wrong deleting this client. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Clients</h1>
          <p className="text-sm text-muted">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          <Add sx={{ fontSize: 18 }} /> New client
        </button>
      </div>

      {/* New client modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">New Client</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors">
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>
            <ClientForm
              onSaved={() => { setShowForm(false); load() }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Client grid */}
      {loadError ? (
        <div className="bg-white rounded-3xl shadow-md p-16 text-center space-y-3">
          <p className="text-danger font-medium text-sm">Couldn&apos;t load clients. This is a display error, not data loss.</p>
          <button
            onClick={load}
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
          >
            Retry
          </button>
        </div>
      ) : !loaded ? (
        <div className="bg-white rounded-3xl shadow-md p-16 text-center">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      ) : clients.length === 0 ? (
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
                  <Link href={`/clients/${c.id}`} className="text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1">
                    <Edit sx={{ fontSize: 14 }} /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="text-xs font-medium text-danger hover:text-danger transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Delete sx={{ fontSize: 14 }} /> {deletingId === c.id ? "Deleting…" : "Delete"}
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
