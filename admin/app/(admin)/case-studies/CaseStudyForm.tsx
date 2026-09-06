"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { GalleryUpload } from "@/components/ui/GalleryUpload"

export type CaseStudy = {
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
  gallery: [] as string[], tech: "", outcomes: "",
  testimonial: "", testimonialAuthor: "", testimonialRole: "",
  featured: false, published: false,
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function toFormState(s?: CaseStudy) {
  if (!s) return empty
  return {
    title: s.title, slug: s.slug, client: s.client ?? "", excerpt: s.excerpt,
    role: s.role ?? "", year: s.year?.toString() ?? "", duration: s.duration ?? "",
    problem: s.problem ?? "", solution: s.solution ?? "", content: s.content,
    coverImage: s.coverImage ?? "", liveUrl: s.liveUrl ?? "", githubUrl: s.githubUrl ?? "",
    gallery: s.gallery ?? [],
    tech: s.tech.join(", "), outcomes: s.outcomes.join("\n"),
    testimonial: s.testimonial ?? "", testimonialAuthor: s.testimonialAuthor ?? "",
    testimonialRole: s.testimonialRole ?? "",
    featured: s.featured, published: s.published,
  }
}

// A transient vinext/Workers request can 500 with no body; one silent retry
// papers over that without making the user re-click.
export async function fetchWithRetry(url: string, init: RequestInit, retries = 1): Promise<Response> {
  const res = await fetch(url, init)
  if (!res.ok && retries > 0) return fetchWithRetry(url, init, retries - 1)
  return res
}

interface Props {
  caseStudy?: CaseStudy
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function CaseStudyForm({ caseStudy, onSaved, onCancel, onDeleted }: Props) {
  const [form, setForm] = useState(toFormState(caseStudy))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editId = caseStudy?.id

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  function handleTitleChange(v: string) {
    setForm(prev => ({ ...prev, title: v, slug: editId ? prev.slug : slugify(v) }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/case-studies/${editId}` : "/api/case-studies"
      const res = await fetchWithRetry(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : null,
          tech: form.tech.split(",").map((t: string) => t.trim()).filter(Boolean),
          outcomes: form.outcomes.split("\n").map((o: string) => o.trim()).filter(Boolean),
          gallery: form.gallery,
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
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      onSaved()
    } catch {
      setError("Something went wrong saving this case study. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this case study?")) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetchWithRetry(`/api/case-studies/${editId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      onDeleted?.()
    } catch {
      setError("Something went wrong deleting this case study. Please try again.")
      setDeleting(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors"
  const textareaCls = `${inputCls} resize-none`
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"
  const sectionTitle = "text-xs font-bold uppercase tracking-widest text-muted pt-2"

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{error}</div>
      )}

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
      <ImageUpload
        value={form.coverImage}
        onChange={url => setForm(v => ({ ...v, coverImage: url }))}
        label="Cover image"
      />
      <GalleryUpload
        value={form.gallery as string[]}
        onChange={urls => setForm(v => ({ ...v, gallery: urls }))}
      />

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
          className="bg-surface px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || deleting}
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}
