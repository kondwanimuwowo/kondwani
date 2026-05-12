"use client"

import { useState, useEffect } from "react"

type CaseStudy = {
  id: string; title: string; slug: string; client?: string | null; excerpt: string
  role?: string | null; year?: number | null; duration?: string | null
  problem?: string | null; solution?: string | null; content: string
  coverImage?: string | null; liveUrl?: string | null; githubUrl?: string | null
  gallery: string[]; tech: string[]; outcomes: string[]
  testimonial?: string | null; testimonialAuthor?: string | null; testimonialRole?: string | null
  featured: boolean; published: boolean; publishedAt?: string | null
}

const empty = {
  title: "", slug: "", client: "", excerpt: "", role: "", year: "", duration: "",
  problem: "", solution: "", content: "", coverImage: "", liveUrl: "", githubUrl: "",
  gallery: "", tech: "", outcomes: "",
  testimonial: "", testimonialAuthor: "", testimonialRole: "",
  featured: false, published: false,
}

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

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  function handleTitleChange(v: string) {
    setForm(prev => ({ ...prev, title: v, slug: editId ? prev.slug : slugify(v) }))
  }

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/case-studies/${editId}` : "/api/case-studies"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        year: form.year ? Number(form.year) : null,
        tech: form.tech.split(",").map((t: string) => t.trim()).filter(Boolean),
        outcomes: form.outcomes.split("\n").map((o: string) => o.trim()).filter(Boolean),
        gallery: form.gallery.split("\n").map((s: string) => s.trim()).filter(Boolean),
        client: form.client || null,
        role: form.role || null,
        duration: form.duration || null,
        problem: form.problem || null,
        solution: form.solution || null,
        coverImage: form.coverImage || null,
        liveUrl: form.liveUrl || null,
        githubUrl: form.githubUrl || null,
        testimonial: form.testimonial || null,
        testimonialAuthor: form.testimonialAuthor || null,
        testimonialRole: form.testimonialRole || null,
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
    setForm({
      title: s.title, slug: s.slug, client: s.client ?? "", excerpt: s.excerpt,
      role: s.role ?? "", year: s.year?.toString() ?? "", duration: s.duration ?? "",
      problem: s.problem ?? "", solution: s.solution ?? "", content: s.content,
      coverImage: s.coverImage ?? "", liveUrl: s.liveUrl ?? "", githubUrl: s.githubUrl ?? "",
      gallery: (s.gallery ?? []).join("\n"),
      tech: s.tech.join(", "), outcomes: s.outcomes.join("\n"),
      testimonial: s.testimonial ?? "", testimonialAuthor: s.testimonialAuthor ?? "",
      testimonialRole: s.testimonialRole ?? "",
      featured: s.featured, published: s.published,
    })
    setEditId(s.id)
    setShowForm(true)
  }

  const inputCls = "w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
  const textareaCls = `${inputCls} resize-none`
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"
  const sectionTitle = "text-xs font-bold uppercase tracking-widest text-muted pt-2"

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
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-2xl my-8">
            <h2 className="font-bold text-foreground mb-5">{editId ? "Edit" : "New"} Case Study</h2>
            <div className="space-y-4">

              {/* Identity */}
              <p className={sectionTitle}>Identity</p>
              <div>
                <label className={labelCls}>Title</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Slug</label>
                  <input value={form.slug} onChange={f("slug")} className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Client</label>
                  <input value={form.client} onChange={f("client")} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Role</label>
                  <input value={form.role} onChange={f("role")} placeholder="Lead Developer" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" value={form.year} onChange={f("year")} placeholder="2025" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <input value={form.duration} onChange={f("duration")} placeholder="3 months" className={inputCls} />
                </div>
              </div>

              {/* Content */}
              <p className={sectionTitle}>Content</p>
              <div>
                <label className={labelCls}>Excerpt <span className="font-normal text-muted">(shown on cards)</span></label>
                <textarea value={form.excerpt} onChange={f("excerpt")} rows={2} className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>The Problem</label>
                <textarea value={form.problem} onChange={f("problem")} rows={3} className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>The Solution</label>
                <textarea value={form.solution} onChange={f("solution")} rows={3} className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>Body content <span className="font-normal text-muted">(HTML)</span></label>
                <textarea value={form.content} onChange={f("content")} rows={6} className={`${textareaCls} font-mono text-xs`} />
              </div>
              <div>
                <label className={labelCls}>Outcomes <span className="font-normal text-muted">(one per line)</span></label>
                <textarea value={form.outcomes} onChange={f("outcomes")} rows={4} className={textareaCls} />
              </div>

              {/* Media */}
              <p className={sectionTitle}>Media</p>
              <div>
                <label className={labelCls}>Cover Image URL</label>
                <input value={form.coverImage} onChange={f("coverImage")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gallery <span className="font-normal text-muted">(one URL per line)</span></label>
                <textarea value={form.gallery} onChange={f("gallery")} rows={3} className={`${textareaCls} font-mono text-xs`} />
              </div>

              {/* Stack & Links */}
              <p className={sectionTitle}>Stack & Links</p>
              <div>
                <label className={labelCls}>Tech <span className="font-normal text-muted">(comma separated)</span></label>
                <input value={form.tech} onChange={f("tech")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Live URL</label>
                  <input value={form.liveUrl} onChange={f("liveUrl")} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>GitHub URL</label>
                  <input value={form.githubUrl} onChange={f("githubUrl")} className={inputCls} />
                </div>
              </div>

              {/* Testimonial */}
              <p className={sectionTitle}>Testimonial</p>
              <div>
                <label className={labelCls}>Quote</label>
                <textarea value={form.testimonial} onChange={f("testimonial")} rows={3} className={textareaCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Author</label>
                  <input value={form.testimonialAuthor} onChange={f("testimonialAuthor")} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Author Role</label>
                  <input value={form.testimonialRole} onChange={f("testimonialRole")} className={inputCls} />
                </div>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6 pt-2">
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
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(empty) }}
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
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Year</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studies.map(s => (
                <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs font-mono text-muted">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-sm text-muted">{s.client ?? "—"}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-muted">{s.year ?? "—"}</p>
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
