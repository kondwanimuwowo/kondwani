"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IdeaForm, fetchWithRetry, type Idea } from "./IdeaForm"

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoadError(false)
    try {
      const res = await fetchWithRetry("/api/ideas", {})
      if (!res.ok) throw new Error()
      setIdeas(await res.json())
      setLoaded(true)
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this idea?")) return
    setDeletingId(id)
    try {
      const res = await fetchWithRetry(`/api/ideas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      load()
    } catch {
      alert("Something went wrong deleting this idea. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Ideas</h1>
          <p className="text-sm text-muted mt-0.5">{ideas.length} ideas captured total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          Add Idea
        </button>
      </div>

      {/* Add Idea modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground text-base">New Idea</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              <IdeaForm
                onSaved={() => { setShowForm(false); load() }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadError ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
            <p className="text-danger font-medium">Couldn&apos;t load ideas. This is a display error, not data loss.</p>
            <button
              onClick={load}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !loaded ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl">
            <p className="text-muted">Loading…</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl">
            <p className="text-muted">No ideas captured yet. Start brainstorming.</p>
          </div>
        ) : (
          ideas.map(idea => (
            <div key={idea.id} className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-md hover:shadow-md transition-shadow duration-200">
              <div>
                <p className="font-bold text-foreground leading-snug tracking-tight text-[15px] mb-2">{idea.title}</p>
                {idea.body && <p className="text-sm text-muted leading-relaxed line-clamp-4 mb-4">{idea.body}</p>}
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {idea.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-extrabold uppercase tracking-wider bg-surface text-muted px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-3.5 bg-surface -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                <Link href={`/ideas/${idea.id}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">Edit</Link>
                <button
                  onClick={() => handleDelete(idea.id)}
                  disabled={deletingId === idea.id}
                  className="text-xs font-semibold text-danger hover:text-primary-hover transition-colors disabled:opacity-50"
                >
                  {deletingId === idea.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
