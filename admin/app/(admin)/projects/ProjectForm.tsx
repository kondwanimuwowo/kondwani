"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/lib/toast"
import { removeFromList } from "@/lib/queries"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { GalleryUpload } from "@/components/ui/GalleryUpload"
import { responseError } from "@/lib/http"
import { PROJECT_CATEGORIES, PROJECT_ROLES, PROJECT_STATUSES, FIRST_PROJECT_YEAR } from "@/data/projectOptions"

export type Project = {
  id: string; title: string; slug?: string | null; description: string; excerpt?: string | null
  tech: string[]; liveUrl?: string | null; githubUrl?: string | null; imageUrl?: string | null
  gallery: string[]; featured: boolean; category: string; role?: string | null
  year?: number | null; status?: string | null; order: number; published: boolean
}

const empty = {
  title: "", slug: "", description: "", excerpt: "", tech: "", liveUrl: "", githubUrl: "",
  imageUrl: "", gallery: [] as string[], category: "", role: "", status: "", year: "", featured: false, published: true,
}

const YEARS = Array.from(
  { length: new Date().getFullYear() - FIRST_PROJECT_YEAR + 1 },
  (_, i) => String(new Date().getFullYear() - i),
)

// Keeps a stored value selectable even when it isn't one of the preset options
function withCurrent(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [current, ...options] : options
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function toFormState(p?: Project) {
  if (!p) return empty
  return {
    title: p.title,
    description: p.description,
    category: p.category,
    featured: p.featured,
    published: p.published,
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
  }
}

interface Props {
  project?: Project
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function ProjectForm({ project, onSaved, onCancel, onDeleted }: Props) {
  const [form, setForm] = useState(toFormState(project))
  const editId = project?.id
  const queryClient = useQueryClient()

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/projects/${editId}` : "/api/projects"
      const res = await fetch(url, {
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
        }),
      })
      if (!res.ok) throw await responseError(res, "Save")
      return res.json()
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"], refetchType: "all" }),
        editId && queryClient.invalidateQueries({ queryKey: ["project", editId], refetchType: "all" }),
      ])
      toast.success(editId ? "Changes saved" : "Project created")
      onSaved()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${editId}`, { method: "DELETE" })
      if (!res.ok) throw await responseError(res, "Delete")
    },
    onSuccess: async () => {
      removeFromList(queryClient, ["projects"], editId)
      await queryClient.invalidateQueries({ queryKey: ["projects"], refetchType: "all" })
      toast.success("Project deleted")
      onDeleted?.()
    },
  })

  function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this project?")) return
    deleteMutation.mutate()
  }

  const saving = saveMutation.isPending
  const deleting = deleteMutation.isPending
  const error = saveMutation.error?.message ?? deleteMutation.error?.message ?? null

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{error}</div>
      )}
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Title</label>
        <input
          value={form.title}
          onChange={e => {
            const title = e.target.value
            setForm(v => ({ ...v, title, slug: editId ? v.slug : toSlug(title) }))
          }}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Slug</label>
        <input
          value={form.slug as string}
          onChange={f("slug")}
          placeholder="auto-generated from title"
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
          Excerpt <span className="text-muted font-normal lowercase">(1 to 2 sentence teaser)</span>
        </label>
        <textarea
          value={form.excerpt as string}
          onChange={f("excerpt")}
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={f("description")}
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Category</label>
        <select value={form.category} onChange={f("category")} className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans">
          <option value="" disabled>Select a category</option>
          {withCurrent(PROJECT_CATEGORIES, form.category).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Role</label>
          <select value={form.role as string} onChange={f("role")} className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans">
            <option value="">None</option>
            {withCurrent(PROJECT_ROLES, form.role as string).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Year</label>
          <select value={form.year as string} onChange={f("year")} className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans">
            <option value="">None</option>
            {withCurrent(YEARS, form.year as string).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
          Tech <span className="text-muted font-normal lowercase">(comma separated)</span>
        </label>
        <input
          value={form.tech as string}
          onChange={f("tech")}
          placeholder="React, Next.js, Tailwind"
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(["liveUrl", "githubUrl"] as const).map(field => (
          <div key={field}>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              {field === "liveUrl" ? "Live URL" : "GitHub URL"}
            </label>
            <input
              value={form[field] as string}
              onChange={f(field)}
              placeholder="https://"
              className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
            />
          </div>
        ))}
      </div>
      <ImageUpload
        value={form.imageUrl as string}
        folder="project-cover"
        onChange={url => setForm(v => ({ ...v, imageUrl: url }))}
      />
      <GalleryUpload
        value={form.gallery as string[]}
        folder="project-gallery"
        onChange={urls => setForm(v => ({ ...v, gallery: urls }))}
      />
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Status badge</label>
        <select value={form.status as string} onChange={f("status")} className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans">
          <option value="">None</option>
          {withCurrent(PROJECT_STATUSES, form.status as string).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))}
            className="rounded text-primary focus:ring-primary"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => setForm(v => ({ ...v, published: e.target.checked }))}
            className="rounded text-primary focus:ring-primary"
          />
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
          className="bg-white shadow-md px-5 py-2 rounded-full text-sm font-semibold text-foreground hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saving || deleting}
          className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Project"}
        </button>
      </div>
    </div>
  )
}
