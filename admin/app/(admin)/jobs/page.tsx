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
  applied: "bg-info-bg text-info",
  interview: "bg-warning-bg text-warning",
  offer: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Job Tracker</h1>
          <p className="text-sm text-muted mt-0.5">{jobs.length} applications tracked total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          Add Application
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {STATUSES.map(s => {
          const colors = STATUS_COLORS[s] ?? "bg-neutral-bg text-muted"
          return (
            <div key={s} className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
              <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full self-start ${colors}`}>
                {s}
              </span>
              <p className="text-3xl font-extrabold text-foreground tracking-tight mt-3">{statusCounts[s] ?? 0}</p>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 shadow-sm flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground text-base">{editId ? "Edit" : "Add"} Application</h2>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" }) }}
                className="text-muted hover:text-foreground transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {(["company", "role", "url"] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    {field === "url" ? "Listing URL" : field}
                  </label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={field === "url" ? "https://" : ""}
                    className="w-full px-3 py-2 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all capitalize"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Applied date</label>
                  <input
                    type="date"
                    value={form.appliedAt}
                    onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all resize-none"
                />
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="px-6 py-4 shadow-[0_-1px_0_0_var(--color-border)] flex items-center gap-3 bg-surface flex-shrink-0">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" }) }}
                className="flex-1 bg-white py-2 rounded-full text-sm font-semibold text-muted hover:bg-neutral-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white py-2 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {jobs.length === 0 ? (
          <p className="px-6 py-16 text-sm text-muted text-center">No applications tracked yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="shadow-[0_1px_0_0_var(--color-border)] bg-surface">
                  <th className="text-left text-xs font-bold text-muted uppercase tracking-wider px-6 py-3.5">Company</th>
                  <th className="text-left text-xs font-bold text-muted uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs font-bold text-muted uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-left text-xs font-bold text-muted uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Applied</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground">{job.company}</p>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5 mt-0.5"
                        >
                          View listing &#8599;
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-muted font-medium">{job.role}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[job.status] ?? "bg-neutral-bg text-muted"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted font-medium">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.appliedAt))}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => startEdit(job)} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">Edit</button>
                        <button onClick={() => handleDelete(job.id)} className="text-xs font-semibold text-danger hover:text-danger transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
