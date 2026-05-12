"use client"

import { useState, useEffect } from "react"

type CaseStudy = {
  id: string; title: string; slug: string; client?: string | null; excerpt: string
  tech: string[]; outcomes: string[]; published: boolean; publishedAt?: string | null
}

const empty = { title: "", slug: "", client: "", excerpt: "", tech: "", outcomes: "", published: false }

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  async function load() {
    const res = await fetch("/api/case-studies")
    setStudies(await res.json())
  }

  useEffect(() => { load() }, [])

  function handleTitleChange(v: string) {
    setForm(f => ({ ...f, title: v, slug: f.slug || slugify(v) }))
  }

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/case-studies/${editId}` : "/api/case-studies"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tech: form.tech.split(",").map((t: string) => t.trim()).filter(Boolean),
        outcomes: form.outcomes.split("\n").map((o: string) => o.trim()).filter(Boolean),
        publishedAt: form.published ? new Date().toISOString() : null,
      }),
    })
    setShowForm(false)
    setEditId(null)
    setForm(empty)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this case study?")) return
    await fetch(`/api/case-studies/${id}`, { method: "DELETE" })
    load()
  }

  function startEdit(s: CaseStudy) {
    setForm({ title: s.title, slug: s.slug, client: s.client ?? "", excerpt: s.excerpt, tech: s.tech.join(", "), outcomes: s.outcomes.join("\n"), published: s.published })
    setEditId(s.id)
    setShowForm(true)
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

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-lg my-8">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "New"} Case Study</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Client</label>
                  <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
                <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tech (comma separated)</label>
                <input value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Outcomes (one per line)</label>
                <textarea value={form.outcomes} onChange={e => setForm(f => ({ ...f, outcomes: e.target.value }))} rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                Published
              </label>
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

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {studies.length === 0 ? (
          <p className="px-6 py-12 text-sm text-muted text-center">No case studies yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden sm:table-cell">Client</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studies.map(s => (
                <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-sm text-muted">{s.client ?? "—"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.published ? "bg-green-50 text-green-700" : "bg-surface text-muted"}`}>
                      {s.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => startEdit(s)} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>
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
