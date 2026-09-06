"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { JobForm, fetchWithRetry, type Job } from "./JobForm"

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoadError(false)
    try {
      const res = await fetchWithRetry("/api/jobs", {})
      if (!res.ok) throw new Error()
      setJobs(await res.json())
      setLoaded(true)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return
    setDeletingId(id)
    try {
      const res = await fetchWithRetry(`/api/jobs/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Something went wrong deleting this application. Please try again.")
    } finally {
      setDeletingId(null)
    }
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
            <div key={s} className="bg-white rounded-3xl shadow-md p-4 hover:shadow-md transition-all flex flex-col justify-between">
              <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full self-start ${colors}`}>
                {s}
              </span>
              <p className="text-3xl font-extrabold text-foreground tracking-tight mt-3">{statusCounts[s] ?? 0}</p>
            </div>
          )
        })}
      </div>

      {/* Add Application modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-3xl overflow-hidden my-auto">
            <div className="px-6 py-4 shadow-md flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground text-base">Add Application</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              <JobForm
                onSaved={() => { setShowForm(false); load() }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        {loadError ? (
          <div className="px-6 py-16 text-center space-y-3">
            <p className="text-danger font-medium text-sm">Couldn&apos;t load applications. This is a display error, not data loss.</p>
            <button
              onClick={load}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !loaded ? (
          <p className="px-6 py-16 text-sm text-muted text-center">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="px-6 py-16 text-sm text-muted text-center">No applications tracked yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
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
                        <Link href={`/jobs/${job.id}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">Edit</Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          className="text-xs font-semibold text-danger hover:text-danger transition-colors disabled:opacity-50"
                        >
                          {deletingId === job.id ? "Deleting…" : "Delete"}
                        </button>
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
