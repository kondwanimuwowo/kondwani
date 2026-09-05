import { SmoothScrolling } from "@/components/layout/SmoothScrolling"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker"
import { db, blogPost } from "@/lib/db"
import { count, eq } from "drizzle-orm"

async function getPublishedBlogCount() {
  try {
    const [row] = await db.select({ count: count() }).from(blogPost).where(eq(blogPost.published, true))
    return row?.count ?? 0
  } catch {
    return 0
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const blogCount = await getPublishedBlogCount()

  return (
    <SmoothScrolling>
      <AnalyticsTracker />
      <Header showBlog={blogCount > 0} />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScrolling>
  )
}
