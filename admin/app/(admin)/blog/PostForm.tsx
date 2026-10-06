"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowBack, OpenInNew } from "@mui/icons-material"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "@/lib/toast"
import { removeFromList } from "@/lib/queries"
import { responseError } from "@/lib/http"
import { uploadImage } from "@/lib/upload"
import { BLOG_URL } from "@/lib/site"

export type Post = {
  id: string; title: string; slug: string; excerpt: string; content: string
  coverImage: string | null; tags: string[]; published: boolean
  publishedAt: string | null; createdAt: string; updatedAt: string
}

type FormState = {
  title: string; slug: string; excerpt: string; tags: string; content: string; coverImage: string
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function toFormState(post?: Post): FormState {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    tags: post?.tags.join(", ") ?? "",
    content: post?.content ?? "",
    coverImage: post?.coverImage ?? "",
  }
}

const uploadBlogImage = (file: File) => uploadImage(file, "blog-image")

const inputCls = "w-full px-4 py-2.5 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-colors"
const labelCls = "block text-xs font-bold text-muted uppercase tracking-wider mb-1.5"

export function PostForm({ post }: { post?: Post }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const editId = post?.id
  const [form, setForm] = useState(() => toFormState(post))
  const [saved, setSaved] = useState(() => toFormState(post))
  const [published, setPublished] = useState(post?.published ?? false)
  const [slugTouched, setSlugTouched] = useState(Boolean(post))
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(v => ({ ...v, [key]: value }))
  }

  function handleTitle(title: string) {
    setForm(v => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }))
  }

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean | undefined) => {
      if (!form.title.trim() || !form.slug.trim()) throw new Error("Title and slug are required")
      const res = await fetch(editId ? `/api/posts/${editId}` : "/api/posts", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: slugify(form.slug),
          excerpt: form.excerpt.trim(),
          content: form.content,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          coverImage: form.coverImage || null,
          published: publish ?? published,
        }),
      })
      if (!res.ok) throw await responseError(res, "Save")
      return (await res.json()) as Post
    },
    onSuccess: async (saved, publish) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" }),
        queryClient.setQueryData(["post", saved.id], saved),
      ])
      const state = toFormState(saved)
      setForm(state)
      setSaved(state)
      setPublished(saved.published)

      if (publish === true) toast.success("Published. The blog can take up to 5 minutes to show it.")
      else if (publish === false && editId) toast.success("Moved back to drafts")
      else toast.success(editId ? "Changes saved" : "Draft saved")

      if (!editId) router.replace(`/blog/${saved.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${editId}`, { method: "DELETE" })
      if (!res.ok) throw await responseError(res, "Delete")
    },
    onSuccess: async () => {
      removeFromList(queryClient, ["posts"], editId)
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" })
      toast.success("Post deleted")
      router.push("/blog")
    },
    onError: e => toast.error(e.message),
  })

  const busy = saveMutation.isPending || deleteMutation.isPending
  const pendingAction = saveMutation.isPending ? saveMutation.variables : null
  // Drafts stay drafts on plain save; existing posts keep their current status.
  const saveAction = editId ? undefined : false

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/blog" className="text-muted hover:text-foreground transition-colors" aria-label="Back to posts">
            <ArrowBack sx={{ fontSize: 20 }} />
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{editId ? "Edit post" : "New post"}</h1>
          {editId && (
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              published ? "bg-success-bg text-success" : "bg-neutral-bg text-muted"
            }`}>
              {published ? "Live" : "Draft"}
            </span>
          )}
          {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-3">
          {editId && published && (
            <a href={`${BLOG_URL}/${saved.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground transition-colors">
              View <OpenInNew sx={{ fontSize: 14 }} />
            </a>
          )}
          <button type="button" onClick={() => saveMutation.mutate(saveAction)} disabled={busy}
            className="bg-white shadow-md px-5 py-2 rounded-full text-sm font-semibold text-foreground hover:bg-neutral-bg transition-colors disabled:opacity-50">
            {saveMutation.isPending && pendingAction === saveAction ? "Saving..." : editId ? "Save" : "Save draft"}
          </button>
          {published ? (
            <button type="button" onClick={() => saveMutation.mutate(false)} disabled={busy}
              className="bg-white shadow-md px-5 py-2 rounded-full text-sm font-semibold text-foreground hover:text-danger transition-colors disabled:opacity-50">
              Unpublish
            </button>
          ) : (
            <button type="button" onClick={() => saveMutation.mutate(true)} disabled={busy}
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
              {pendingAction === true ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      {saveMutation.isError && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{saveMutation.error.message}</div>
      )}

      <div className="bg-white shadow-md rounded-3xl p-6 space-y-5">
        <input value={form.title} onChange={e => handleTitle(e.target.value)} placeholder="Post title"
          className="w-full text-3xl font-bold text-foreground placeholder:text-muted focus:outline-none bg-transparent" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Slug</label>
            <input value={form.slug} onChange={e => { setSlugTouched(true); set("slug", e.target.value) }}
              className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className={labelCls}>Tags <span className="font-normal lowercase">(comma separated)</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="nextjs, design, tips" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Excerpt</label>
          <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2}
            placeholder="A short summary shown in the listing" className={`${inputCls} resize-none`} />
        </div>

        <ImageUpload value={form.coverImage} onChange={url => set("coverImage", url)} folder="blog-cover" />
      </div>

      <TiptapEditor content={form.content} onChange={html => set("content", html)} onImageUpload={uploadBlogImage} />

      {editId && (
        <div className="flex justify-end">
          <button type="button" disabled={busy}
            onClick={() => { if (confirm("Delete this post? This cannot be undone.")) deleteMutation.mutate() }}
            className="text-sm font-semibold text-danger transition-colors disabled:opacity-50">
            {deleteMutation.isPending ? "Deleting..." : "Delete post"}
          </button>
        </div>
      )}
    </div>
  )
}
