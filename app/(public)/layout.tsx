import { SmoothScrolling } from "@/components/layout/SmoothScrolling"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker"
import { prisma } from "@/lib/prisma"

async function getPublishedBlogCount() {
  try {
    return await prisma.blogPost.count({ where: { published: true } })
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
