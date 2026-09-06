"use client"

import { useState } from "react"

export type Idea = { id: string; title: string; body?: string | null; tags: string[]; createdAt: string }

const empty = { title: "", body: "", tags: "" }

function toFormState(idea?: Idea) {
  if (!idea) return empty
  return { title: idea.title, body: idea.body ?? "", tags: idea.tags.join(", ") }
}

// A transient vinext/Workers request can 500 with no body; one silent retry
// papers over that without making the user re-click.
export async function fetchWithRetry(url: string, init: RequestInit, retries = 1): Promise<Response> {
  const res = await fetch(url, init)
  if (!res.ok && retries > 0) return fetchWithRetry(url, init, retries - 1)
  return res
}

interface Props {
  idea?: Idea
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function IdeaForm({ idea, onSaved, onCancel, onDeleted }: Props) {
  const [form, setForm] = useState(toFormState(idea))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editId = idea?.id

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/ideas/${editId}` : "/api/ideas"
      const res = await fetchWithRetry(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body || null, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      onSaved()
    } catch {
      setError("Something went wrong saving this idea. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this idea?")) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetchWithRetry(`/api/ideas/${editId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      onDeleted?.()
    } catch {
      setError("Something went wrong deleting this idea. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{error}</div>
      )}
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Title</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Notes</label>
        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
          Tags <span className="text-muted font-normal lowercase">(comma separated)</span>
        </label>
        <input
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          placeholder="marketing, design, startup"
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
        />
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
          className="bg-white shadow-md px-5 py-2 rounded-full text-sm font-semibold text-foreground hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || deleting}
          className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Idea"}
        </button>
      </div>
    </div>
  )
}
