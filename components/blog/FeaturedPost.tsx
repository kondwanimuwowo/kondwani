import Image from "next/image"
import Link from "next/link"
import { ArrowForward } from "@mui/icons-material"
import { RevealImage } from "@/components/ui/RevealImage"
import { categoryLabel } from "@/data/blogCategories"
import { formatDate, type PostSummary } from "@/lib/blogPosts"

// The newest post, lifted over the hero band like the cover on project pages
export function FeaturedPost({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-frame-lift transition-[translate,scale] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 active:scale-[0.99] md:grid-cols-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface md:aspect-auto md:min-h-80">
        {post.coverImage ? (
          <RevealImage className="absolute inset-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </RevealImage>
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center bg-primary-tint">
            <span className="text-6xl font-extrabold text-primary">[&lt;</span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center p-8 md:p-12">
        <p className="mb-4 text-sm font-bold text-primary">
          Latest · {categoryLabel(post.category)}
        </p>
        <h2 className="mb-4 text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
          {post.title}
        </h2>
        <p className="mb-8 line-clamp-3 leading-relaxed text-muted">{post.excerpt}</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {formatDate(post.publishedAt)} · {post.readingMinutes} min read
          </p>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-primary-hover">
            Read <ArrowForward sx={{ fontSize: 16 }} />
          </span>
        </div>
      </div>
    </Link>
  )
}
