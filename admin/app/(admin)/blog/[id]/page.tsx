"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PostForm, type Post } from "../PostForm"

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()

  const { data: post, isFetchedAfterMount, isError, refetch } = useQuery({
    queryKey: ["post", id],
    // Forms seed state once, so never render them from a cached copy.
    refetchOnMount: "always",
    queryFn: async (): Promise<Post> => {
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    },
  })

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-3xl px-6 py-16 text-center space-y-3">
        <p className="text-danger font-medium">Couldn&apos;t load this post.</p>
        <button onClick={() => refetch()}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors">
          Retry
        </button>
      </div>
    )
  }

  if (!isFetchedAfterMount || !post) {
    return <div className="max-w-4xl mx-auto bg-white shadow-md rounded-3xl px-6 py-16 text-center text-muted text-sm">Loading...</div>
  }

  return <PostForm key={post.id} post={post} />
}
