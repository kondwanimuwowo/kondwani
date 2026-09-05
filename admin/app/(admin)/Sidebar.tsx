"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import {
  Dashboard, Code, Work, Build, Contacts,
  BarChart, Article, Lightbulb, ExpandMore,
  Logout, People, ViewKanban, RequestQuote,
} from "@mui/icons-material"

type NavItem = {
  label: string
  href?: string
  icon: React.ElementType
  subItems?: { label: string; href: string }[]
}

type NavSection = {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "Portfolio",
    items: [
      { label: "Dashboard", href: "/", icon: Dashboard },
      { label: "Projects", href: "/projects", icon: Code },
      { label: "Case Studies", href: "/case-studies", icon: Work },
      { label: "Skills", href: "/skills", icon: Build },
    ],
  },
  {
    label: "Studio",
    items: [
      { label: "Clients", href: "/clients", icon: People },
      { label: "Work", href: "/work", icon: ViewKanban },
      { label: "Invoices", href: "/invoices", icon: RequestQuote },
    ],
  },
  {
    label: "Me",
    items: [
      { label: "Job Tracker", href: "/jobs", icon: Article },
      { label: "Ideas", href: "/ideas", icon: Lightbulb },
      { label: "Contacts", href: "/contacts", icon: Contacts },
      { label: "Analytics", href: "/analytics", icon: BarChart },
    ],
  },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const [openMenu, setOpenMenu] = useState(false)
  const { label, href, icon: Icon, subItems } = item

  const isActive = href
    ? href === "/" ? pathname === "/" : pathname.startsWith(href)
    : subItems?.some(s => pathname.startsWith(s.href))

  useEffect(() => {
    if (subItems?.some(s => pathname.startsWith(s.href))) setOpenMenu(true)
  }, [pathname, subItems])

  if (subItems) {
    return (
      <div>
        <button
          onClick={() => setOpenMenu(prev => !prev)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            isActive ? "bg-subtle-dark text-white" : "text-muted-dark hover:text-white"
          )}
        >
          <span className="flex items-center gap-3">
            <Icon sx={{ fontSize: 18 }} />
            {label}
          </span>
          <motion.span animate={{ rotate: openMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ExpandMore sx={{ fontSize: 16 }} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {openMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pl-9 space-y-0.5 mt-0.5">
                {subItems.map(sub => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      pathname === sub.href ? "text-white font-medium" : "text-muted-dark hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      pathname === sub.href ? "bg-white" : "bg-muted-dark"
                    )} />
                    {sub.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <Link
      href={href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive ? "bg-subtle-dark text-white" : "text-muted-dark hover:text-white"
      )}
    >
      <Icon sx={{ fontSize: 18 }} />
      {label}
    </Link>
  )
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="w-64 shrink-0 bg-foreground text-white flex flex-col h-screen">
      {/* Brand header */}
      <div className="flex-shrink-0 px-5 py-5 shadow-[0_1px_0_0_rgba(255,255,255,0.1)]">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-tight text-white hover:text-muted-dark transition-colors"
        >
          [&lt;ondwani / admin
        </Link>
      </div>

      {/* Scrollable navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-dark px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink key={item.label} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-4 shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
        <p className="text-xs text-muted-dark truncate mb-3">{userEmail}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-muted-dark hover:text-white transition-colors"
        >
          <Logout sx={{ fontSize: 15 }} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
