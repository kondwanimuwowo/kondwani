import Link from "next/link"
import { AnimateIn } from "@/components/ui/AnimateIn"

interface Category {
  key: string
  label: string
}

interface BlogHeroProps {
  title: string
  subtitle: string
  categories: readonly Category[]
  active: string
  // Extra room at the bottom when a card overlaps the band
  overlap?: boolean
}

// Maroon band with category buttons; categories without posts are left out by the caller
export function BlogHero({ title, subtitle, categories, active, overlap }: BlogHeroProps) {
  const links = [{ key: "all", label: "All", href: "/" }, ...categories.map((c) => ({ ...c, href: `/category/${c.key}` }))]

  return (
    <section className={`bg-primary pt-40 ${overlap ? "pb-32 md:pb-40" : "pb-24"}`}>
      <AnimateIn className="container-custom max-w-3xl text-center">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-primary-tint">{subtitle}</p>
        {categories.length > 0 && (
          <nav aria-label="Categories" className="flex flex-wrap justify-center gap-2">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={active === link.key ? "page" : undefined}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-[color,background-color,scale] duration-200 active:scale-[0.97] ${
                  active === link.key ? "bg-white text-primary" : "bg-primary-dark text-white hover:bg-primary-hover"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </AnimateIn>
    </section>
  )
}
