"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { GalleryUpload } from "@/components/ui/GalleryUpload"

type Project = {
  id: string; title: string; slug?: string | null; description: string; excerpt?: string | null
  tech: string[]; liveUrl?: string | null; githubUrl?: string | null; imageUrl?: string | null
  gallery: string[]; featured: boolean; category: string; role?: string | null
  year?: number | null; status?: string | null; order: number; published: boolean
}

const empty = {
  title: "", slug: "", description: "", excerpt: "", tech: "", liveUrl: "", githubUrl: "",
  imageUrl: "", gallery: [] as string[], category: "", role: "", status: "", year: "", featured: false, published: true, order: 0,
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

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
        slug: (form.slug as string).trim() || toSlug(form.title) || null,
        excerpt: (form.excerpt as string).trim() || null,
        tech: typeof form.tech === "string" ? form.tech.split(",").map(t => t.trim()).filter(Boolean) : form.tech,
        gallery: form.gallery,
        liveUrl: form.liveUrl || null,
        githubUrl: form.githubUrl || null,
        imageUrl: form.imageUrl || null,
        role: (form.role as string).trim() || null,
        year: form.year ? Number(form.year) : null,
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
    setForm({
      ...p,
      slug: p.slug ?? "",
      excerpt: p.excerpt ?? "",
      tech: p.tech.join(", "),
      gallery: p.gallery ?? [],
      liveUrl: p.liveUrl ?? "",
      githubUrl: p.githubUrl ?? "",
      imageUrl: p.imageUrl ?? "",
      role: p.role ?? "",
      year: p.year?.toString() ?? "",
      status: p.status ?? "",
    })
    setEditId(p.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{projects.length} projects total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-[#7E1416] text-white px-4 py-2 rounded-lg hover:bg-[#601012] transition-colors"
        >
          Add Project
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-slate-850 text-base">{editId ? "Edit" : "New"} Project</h2>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(empty) }}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value
                    setForm(v => ({ ...v, title, slug: editId ? v.slug : toSlug(title) }))
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug</label>
                <input
                  value={form.slug as string}
                  onChange={f("slug")}
                  placeholder="auto-generated from title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Excerpt <span className="text-slate-400 font-normal lowercase">(1–2 sentence teaser)</span>
                </label>
                <textarea
                  value={form.excerpt as string}
                  onChange={f("excerpt")}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={f("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={f("category")}
                  placeholder="e.g. Web App"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                  <input
                    value={form.role as string}
                    onChange={f("role")}
                    placeholder="e.g. Lead Developer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                  <input
                    type="number"
                    value={form.year as string}
                    onChange={f("year")}
                    placeholder="2025"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tech <span className="text-slate-400 font-normal lowercase">(comma separated)</span>
                </label>
                <input
                  value={form.tech as string}
                  onChange={f("tech")}
                  placeholder="React, Next.js, Tailwind"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(["liveUrl", "githubUrl"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {field === "liveUrl" ? "Live URL" : "GitHub URL"}
                    </label>
                    <input
                      value={form[field] as string}
                      onChange={f(field)}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                    />
                  </div>
                ))}
              </div>
              <ImageUpload
                value={form.imageUrl as string}
                onChange={url => setForm(v => ({ ...v, imageUrl: url }))}
              />
              <GalleryUpload
                value={form.gallery as string[]}
                onChange={urls => setForm(v => ({ ...v, gallery: urls }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status badge</label>
                  <input
                    value={form.status as string}
                    onChange={f("status")}
                    placeholder="e.g. Live · In Progress"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={f("order")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))}
                    className="rounded border-slate-300 text-[#7E1416] focus:ring-[#7E1416]"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(v => ({ ...v, published: e.target.checked }))}
                    className="rounded border-slate-300 text-[#7E1416] focus:ring-[#7E1416]"
                  />
                  Published
                </label>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(empty) }}
                className="flex-1 border border-slate-200 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#7E1416] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#601012] transition-colors"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 px-6 py-16 text-center shadow-sm">
            <p className="text-slate-400">No projects yet.</p>
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div>
                {p.imageUrl ? (
                  <div className="relative h-40 bg-slate-50 border-b border-slate-100">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover animate-fade-in" sizes="400px" />
                  </div>
                ) : (
                  <div className="h-40 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center">
                    <span className="text-xs text-slate-350 tracking-wider uppercase font-bold">No Cover Image</span>
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-800 leading-snug tracking-tight text-[15px]">{p.title}</p>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      p.published
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {p.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  {p.slug && <p className="text-[10px] font-mono text-slate-400">/{p.slug}</p>}
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.tech.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] font-medium bg-slate-50 border border-slate-150 text-slate-500 px-2 py-0.5 rounded">{t}</span>
                    ))}
                    {p.tech.length > 4 && (
                      <span className="text-[10px] font-medium text-slate-400 self-center pl-1">+{p.tech.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <button onClick={() => startEdit(p)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-red-500 hover:text-red-650 transition-colors">Delete</button>
                </div>
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#7E1416] hover:text-[#601012] transition-colors"
                  >
                    View site ↗
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
