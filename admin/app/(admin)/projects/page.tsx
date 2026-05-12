"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

type Project = {
  id: string; title: string; description: string; tech: string[]
  liveUrl?: string | null; githubUrl?: string | null; imageUrl?: string | null
  featured: boolean; category: string; status?: string | null; order: number; published: boolean
}

const empty = { title: "", description: "", tech: "", liveUrl: "", githubUrl: "", imageUrl: "", category: "", status: "", featured: false, published: true, order: 0 }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  async function load() {
    const res = await fetch("/api/projects")
    setProjects(await res.json())
  }

  useEffect(() => { load() }, [])

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/projects/${editId}` : "/api/projects"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tech: typeof form.tech === "string" ? form.tech.split(",").map(t => t.trim()).filter(Boolean) : form.tech,
        liveUrl: form.liveUrl || null,
        githubUrl: form.githubUrl || null,
        imageUrl: form.imageUrl || null,
        status: form.status || null,
        order: Number(form.order),
      }),
    })
    setShowForm(false)
    setEditId(null)
    setForm(empty)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    load()
  }

  function startEdit(p: Project) {
    setForm({ ...p, tech: p.tech.join(", "), liveUrl: p.liveUrl ?? "", githubUrl: p.githubUrl ?? "", imageUrl: p.imageUrl ?? "", status: p.status ?? "" })
    setEditId(p.id)
    setShowForm(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Projects</h1>
          <p className="text-sm text-muted">{projects.length} projects</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors">
          Add project
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-lg my-8">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "New"} Project</h2>
            <div className="space-y-4">
              {(["title", "description", "category"] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-foreground mb-1.5 capitalize">{field}</label>
                  {field === "description" ? (
                    <textarea value={form[field]} onChange={f(field)} rows={3}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                  ) : (
                    <input value={form[field]} onChange={f(field)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tech (comma separated)</label>
                <input value={form.tech as string} onChange={f("tech")}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["liveUrl", "githubUrl"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{field === "liveUrl" ? "Live URL" : "GitHub URL"}</label>
                    <input value={form[field] as string} onChange={f(field)}
                      className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Image URL</label>
                <input value={form.imageUrl as string} onChange={f("imageUrl")}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status badge</label>
                  <input value={form.status as string} onChange={f("status")} placeholder="e.g. Live"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Order</label>
                  <input type="number" value={form.order} onChange={f("order")}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))} className="rounded" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(v => ({ ...v, published: e.target.checked }))} className="rounded" />
                  Published
                </label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-border px-6 py-16 text-center">
            <p className="text-muted">No projects yet.</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-border overflow-hidden">
            {p.imageUrl && (
              <div className="relative h-36 bg-surface">
                <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="400px" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-foreground leading-snug">{p.title}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${p.published ? "bg-green-50 text-green-700" : "bg-surface text-muted"}`}>
                  {p.published ? "Live" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-3">{p.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {p.tech.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] bg-surface border border-border text-muted px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <button onClick={() => startEdit(p)} className="text-xs font-medium text-muted hover:text-foreground transition-colors">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>
                {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:text-primary-hover ml-auto transition-colors">View ↗</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
