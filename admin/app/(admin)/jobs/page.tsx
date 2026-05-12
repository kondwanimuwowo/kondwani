"use client"

import { useState, useEffect } from "react"

type Job = {
  id: string
  company: string
  role: string
  status: string
  appliedAt: string
  notes?: string | null
  url?: string | null
}

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  interview: "bg-yellow-50 text-yellow-700",
  offer: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  withdrawn: "bg-surface text-muted",
}

const STATUSES = ["applied", "interview", "offer", "rejected", "withdrawn"]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" })
  const [editId, setEditId] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/jobs")
    setJobs(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/jobs/${editId}` : "/api/jobs"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, appliedAt: new Date(form.appliedAt).toISOString() }),
    })
    setShowForm(false)
    setEditId(null)
    setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return
    await fetch(`/api/jobs/${id}`, { method: "DELETE" })
    load()
  }

  function startEdit(job: Job) {
    setForm({ company: job.company, role: job.role, status: job.status, appliedAt: job.appliedAt.split("T")[0], notes: job.notes ?? "", url: job.url ?? "" })
    setEditId(job.id)
    setShowForm(true)
  }

  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: jobs.filter(j => j.status === s).length }), {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Job Tracker</h1>
          <p className="text-sm text-muted">{jobs.length} applications tracked</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors">
          Add application
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {STATUSES.map(s => (
          <div key={s} className="bg-white rounded-xl border border-border px-4 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{statusCounts[s] ?? 0}</p>
            <p className="text-xs text-muted capitalize mt-0.5">{s}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-md">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "Add"} Application</h2>
            <div className="space-y-4">
              {(["company", "role", "url"] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-foreground mb-1.5 capitalize">{field}</label>
                  <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors">
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Applied date</label>
                  <input type="date" value={form.appliedAt} onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
                Save
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {jobs.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No applications yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Applied</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{job.company}</p>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View ↗</a>}
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-sm text-foreground">{job.role}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[job.status] ?? "bg-surface text-muted"}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.appliedAt))}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => startEdit(job)} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</button>
                      <button onClick={() => handleDelete(job.id)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
