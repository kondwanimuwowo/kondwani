import Link from "next/link"
import { Header } from "@/components/ui/Header"
import { Footer } from "@/components/ui/Footer"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary pb-24 pt-40">
          <div className="container-custom max-w-3xl text-center">
            <h1 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl">Page not found</h1>
            <p className="mb-10 text-lg text-primary-tint">This post may have moved, or the link is wrong.</p>
            <Link href="/" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-tint">
              Back to the blog
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
