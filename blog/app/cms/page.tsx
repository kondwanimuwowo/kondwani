import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DeletePostButton } from "./DeletePostButton"
import { PublishToggle } from "./PublishToggle"

export const dynamic = "force-dynamic"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

export default async function CMSHome() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, publishedAt: true, tags: true, createdAt: true },
  })

  return (
    <div className="container-custom py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-sm text-muted mt-1">{posts.length} total · {posts.filter(p => p.published).length} published</p>
        </div>
        <Link href="/cms/new"
          className="text-sm font-medium bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary-hover transition-colors">
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <p className="text-muted mb-4">No posts yet.</p>
          <Link href="/cms/new" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
            Write your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden sm:table-cell">Tags</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/cms/${post.id}/edit`}
                      className="font-medium text-foreground hover:text-primary transition-colors text-sm">
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-bold tracking-wide uppercase bg-surface border border-border text-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <PublishToggle id={post.id} published={post.published} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/cms/${post.id}/edit`}
                        className="text-xs font-medium text-muted hover:text-foreground transition-colors">
                        Edit
                      </Link>
                      <DeletePostButton id={post.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
