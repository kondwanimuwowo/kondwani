"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Close } from "@mui/icons-material"
import { CaseStudyForm, fetchWithRetry, type CaseStudy } from "./CaseStudyForm"

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoadError(false)
    try {
      const res = await fetchWithRetry("/api/case-studies", {})
      if (!res.ok) throw new Error()
      setStudies(await res.json())
      setLoaded(true)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this case study?")) return
    setDeletingId(id)
    try {
      const res = await fetchWithRetry(`/api/case-studies/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Something went wrong deleting this case study. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Case Studies</h1>
          <p className="text-sm text-muted">{studies.length} case studies</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors">
          New case study
        </button>
      </div>

      {/* New case study modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground">New Case Study</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors">
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>
            <CaseStudyForm
              onSaved={() => { setShowForm(false); load() }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        {loadError ? (
          <div className="px-6 py-12 text-center space-y-3">
            <p className="text-danger font-medium text-sm">Couldn&apos;t load case studies. This is a display error, not data loss.</p>
            <button
              onClick={load}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !loaded ? (
          <p className="px-6 py-12 text-sm text-muted text-center">Loading…</p>
        ) : studies.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No case studies yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden sm:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Year</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studies.map(s => (
                <tr key={s.id} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs font-mono text-muted">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-sm text-muted">{s.client ?? "Not set"}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-muted">{s.year ?? "Not set"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.published ? "bg-success-bg text-success" : "bg-surface text-muted"}`}>
                      {s.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/case-studies/${s.id}`} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</Link>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="text-xs font-medium text-danger hover:text-danger transition-colors disabled:opacity-50"
                      >
                        {deletingId === s.id ? "Deleting…" : "Delete"}
                      </button>
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
