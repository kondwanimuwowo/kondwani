import Image from "next/image"
import Link from "next/link"
import { categoryLabel } from "@/data/blogCategories"
import { formatDate, type PostSummary } from "@/lib/blogPosts"

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 340px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary-tint">
            <span className="text-4xl font-extrabold text-primary">[&lt;</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 text-xs font-bold text-primary">{categoryLabel(post.category)}</p>
        <h3 className="mb-3 text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <p className="mt-auto text-xs text-muted">
          {formatDate(post.publishedAt)} · {post.readingMinutes} min read
        </p>
      </div>
    </Link>
  )
}
