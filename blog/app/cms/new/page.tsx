"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TiptapEditor } from "@/components/editor/TiptapEditor"

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function uploadImage(file: File): Promise<string> {
  const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`)
  const { url, publicUrl } = await res.json()
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
  return publicUrl
}

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [tags, setTags] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slug || slug === slugify(title)) setSlug(slugify(v))
  }

  async function handleSave(publish: boolean) {
    if (!title.trim() || !slug.trim()) { setError("Title and slug are required"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, slug, excerpt, content,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        coverImage: coverImage || null,
        published: publish,
        publishedAt: publish ? new Date().toISOString() : null,
      }),
    })
    if (!res.ok) { setError("Failed to save post"); setSaving(false); return }
    const post = await res.json()
    router.push(`/cms/${post.id}/edit`)
  }

  return (
    <div className="container-custom py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-foreground">New post</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="text-sm font-medium text-foreground px-5 py-2 rounded-full border border-border hover:border-foreground/40 transition-colors disabled:opacity-50">
            Save draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="space-y-5">
        <div>
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title"
            className="w-full text-3xl font-bold text-foreground placeholder:text-muted/40 border-0 border-b border-border pb-3 focus:outline-none focus:border-primary bg-transparent transition-colors" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nextjs, design, tips"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Excerpt</label>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2}
            placeholder="A short summary shown in the listing…"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Cover image URL</label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://assets.kondwanimuwowo.com/…"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
          <TiptapEditor content={content} onChange={setContent} onImageUpload={uploadImage} />
        </div>
      </div>
    </div>
  )
}
