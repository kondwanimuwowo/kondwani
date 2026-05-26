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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Job Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">{jobs.length} applications tracked total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-[#7E1416] text-white px-4 py-2 rounded-lg hover:bg-[#601012] transition-colors"
        >
          Add Application
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {STATUSES.map(s => {
          const colors = STATUS_COLORS[s] ?? "bg-slate-50 text-slate-500"
          return (
            <div key={s} className="bg-white border border-slate-200 p-4 hover:shadow-md transition-all flex flex-col justify-between">
              <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border self-start ${colors}`}>
                {s}
              </span>
              <p className="text-3xl font-extrabold text-slate-850 tracking-tight mt-3">{statusCounts[s] ?? 0}</p>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-slate-850 text-base">{editId ? "Edit" : "Add"} Application</h2>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" }) }}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {(["company", "role", "url"] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {field === "url" ? "Listing URL" : field}
                  </label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={field === "url" ? "https://" : ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all capitalize"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Applied date</label>
                  <input
                    type="date"
                    value={form.appliedAt}
                    onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all resize-none"
                />
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" }) }}
                className="flex-1 border border-slate-200 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#7E1416] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#601012] transition-colors"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {jobs.length === 0 ? (
          <p className="px-6 py-16 text-sm text-slate-400 text-center">No applications tracked yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3.5">Company</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Role</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Applied</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{job.company}</p>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#7E1416] hover:text-[#601012] transition-colors flex items-center gap-0.5 mt-0.5"
                        >
                          View listing ↗
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-600 font-medium">{job.role}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border capitalize ${STATUS_COLORS[job.status] ?? "bg-slate-50 text-slate-500"}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-400 font-medium">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(job.appliedAt))}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => startEdit(job)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(job.id)} className="text-xs font-semibold text-red-500 hover:text-red-650 transition-colors">Delete</button>
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
