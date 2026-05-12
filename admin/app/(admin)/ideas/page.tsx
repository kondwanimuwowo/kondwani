"use client"

import { useState, useEffect } from "react"

type Idea = { id: string; title: string; body?: string | null; tags: string[]; createdAt: string }

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", body: "", tags: "" })

  async function load() {
    const res = await fetch("/api/ideas")
    setIdeas(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/ideas/${editId}` : "/api/ideas"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, body: form.body || null, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
    })
    setShowForm(false)
    setEditId(null)
    setForm({ title: "", body: "", tags: "" })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this idea?")) return
    await fetch(`/api/ideas/${id}`, { method: "DELETE" })
    load()
  }

  function startEdit(idea: Idea) {
    setForm({ title: idea.title, body: idea.body ?? "", tags: idea.tags.join(", ") })
    setEditId(idea.id)
    setShowForm(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Ideas</h1>
          <p className="text-sm text-muted">{ideas.length} ideas captured</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors">
          Add idea
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-md">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "New"} Idea</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">Save</button>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-surface transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-border px-6 py-16 text-center">
            <p className="text-muted">No ideas yet. Start capturing them!</p>
          </div>
        ) : ideas.map(idea => (
          <div key={idea.id} className="bg-white rounded-2xl border border-border p-5 flex flex-col">
            <p className="font-semibold text-foreground mb-2 leading-snug">{idea.title}</p>
            {idea.body && <p className="text-sm text-muted leading-relaxed flex-1 mb-3">{idea.body}</p>}
            {idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {idea.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold tracking-wider uppercase bg-surface border border-border text-muted px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 pt-3 border-t border-border mt-auto">
              <button onClick={() => startEdit(idea)} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</button>
              <button onClick={() => handleDelete(idea.id)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
