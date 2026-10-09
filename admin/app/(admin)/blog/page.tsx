"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/lib/toast"
import { removeFromList } from "@/lib/queries"
import { responseError } from "@/lib/http"
import type { Post } from "./PostForm"
import { BLOG_CATEGORIES, categoryLabel } from "@/data/blogCategories"

type PostSummary = Omit<Post, "content">

async function fetchPosts(): Promise<PostSummary[]> {
  const res = await fetch("/api/posts")
  if (!res.ok) throw new Error()
  return res.json()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export default function BlogPage() {
  const queryClient = useQueryClient()
  const { data: posts = [], isLoading, isError, refetch } = useQuery({ queryKey: ["posts"], queryFn: fetchPosts })

  const publishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      })
      if (!res.ok) throw await responseError(res, "Update")
    },
    onSuccess: (_, { id, published }) => {
      toast.success(published ? "Published" : "Moved back to drafts")
      queryClient.invalidateQueries({ queryKey: ["post", id] })
      return queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: e => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
      if (!res.ok) throw await responseError(res, "Delete")
    },
    onSuccess: (_, id) => {
      removeFromList(queryClient, ["posts"], id)
      toast.success("Post deleted")
      return queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: e => toast.error(e.message),
  })

  const [category, setCategory] = useState("all")
  const publishedCount = posts.filter(p => p.published).length
  const visiblePosts = category === "all" ? posts : posts.filter(p => p.category === category)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Blog</h1>
          <p className="text-sm text-muted mt-0.5">{posts.length} posts, {publishedCount} published</p>
        </div>
        <Link href="/blog/new"
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors">
          New post
        </Link>
      </div>

      {posts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[{ key: "all", label: "All" }, ...BLOG_CATEGORIES].map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-colors ${
                category === c.key ? "bg-primary text-white" : "bg-white text-muted hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {isError ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
          <p className="text-danger font-medium">Couldn&apos;t load posts.</p>
          <button onClick={() => refetch()}
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors">
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl text-muted">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
          <p className="text-muted">No posts yet.</p>
          <Link href="/blog/new" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {visiblePosts.length === 0 && (
            <p className="px-6 py-12 text-center text-sm text-muted">No posts in this category yet.</p>
          )}
          {visiblePosts.map((post, i) => {
            const toggling = publishMutation.isPending && publishMutation.variables?.id === post.id
            const deleting = deleteMutation.isPending && deleteMutation.variables === post.id
            return (
              <div key={post.id} className={`flex items-center gap-4 px-4 sm:px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="relative w-16 h-12 rounded-2xl overflow-hidden bg-surface shrink-0 hidden sm:block">
                  {post.coverImage && <Image src={post.coverImage} alt="" fill className="object-cover" sizes="64px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/blog/${post.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors text-sm block truncate">
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    <span className="font-semibold text-primary">{categoryLabel(post.category)}</span>
                    <span> · </span>
                    <span className="font-mono">/{post.slug}</span>
                    <span className="hidden md:inline"> · {formatDate(post.publishedAt ?? post.createdAt)}</span>
                    {post.tags.length > 0 && <span className="hidden lg:inline"> · {post.tags.slice(0, 3).join(", ")}</span>}
                  </p>
                </div>
                <button
                  onClick={() => publishMutation.mutate({ id: post.id, published: !post.published })}
                  disabled={toggling}
                  title={post.published ? "Move to drafts" : "Publish"}
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 transition-colors disabled:opacity-50 ${
                    post.published ? "bg-success-bg text-success" : "bg-neutral-bg text-muted hover:text-foreground"
                  }`}>
                  {toggling ? "..." : post.published ? "Live" : "Draft"}
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/blog/${post.id}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">
                    Edit
                  </Link>
                  <button
                    onClick={() => { if (confirm("Delete this post? This cannot be undone.")) deleteMutation.mutate(post.id) }}
                    disabled={deleting}
                    className="text-xs font-semibold text-danger transition-colors disabled:opacity-50">
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
