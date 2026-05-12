"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TiptapEditor } from "@/components/editor/TiptapEditor"

async function uploadImage(file: File): Promise<string> {
  const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`)
  const { url, publicUrl } = await res.json()
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
  return publicUrl
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [tags, setTags] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.json())
      .then(post => {
        setTitle(post.title)
        setSlug(post.slug)
        setExcerpt(post.excerpt)
        setTags(post.tags.join(", "))
        setContent(post.content)
        setCoverImage(post.coverImage ?? "")
        setPublished(post.published)
        setLoading(false)
      })
  }, [id])

  async function handleSave(publish?: boolean) {
    setSaving(true)
    setError("")
    const nextPublished = publish !== undefined ? publish : published
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, slug, excerpt, content,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        coverImage: coverImage || null,
        published: nextPublished,
        publishedAt: nextPublished && !published ? new Date().toISOString() : undefined,
      }),
    })
    if (!res.ok) { setError("Failed to save"); setSaving(false); return }
    if (publish !== undefined) setPublished(publish)
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString())
  }

  if (loading) return <div className="container-custom py-10"><p className="text-muted">Loading…</p></div>

  return (
    <div className="container-custom py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/cms")} className="text-sm text-muted hover:text-foreground transition-colors">
            ← Posts
          </button>
          {savedAt && <span className="text-xs text-muted/60">Saved at {savedAt}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave()} disabled={saving}
            className="text-sm font-medium text-foreground px-5 py-2 rounded-full border border-border hover:border-foreground/40 transition-colors disabled:opacity-50">
            Save
          </button>
          {published ? (
            <button onClick={() => handleSave(false)} disabled={saving}
              className="text-sm font-medium text-foreground px-5 py-2 rounded-full border border-border hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50">
              Unpublish
            </button>
          ) : (
            <button onClick={() => handleSave(true)} disabled={saving}
              className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Publish"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="space-y-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full text-3xl font-bold text-foreground placeholder:text-muted/40 border-0 border-b border-border pb-3 focus:outline-none focus:border-primary bg-transparent transition-colors" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Cover image URL</label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
          {content !== undefined && (
            <TiptapEditor content={content} onChange={setContent} onImageUpload={uploadImage} />
          )}
        </div>
      </div>
    </div>
  )
}
