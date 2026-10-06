"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import { ExpandMore, Logout } from "@mui/icons-material"
import { navSections, isNavActive, type NavItem } from "@/data/navigation"

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { label, href, icon: Icon, subItems } = item
  const childActive = subItems?.some(s => isNavActive(s.href, pathname)) ?? false
  const [openMenu, setOpenMenu] = useState(childActive)
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Open the submenu when navigating into one of its routes.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    if (childActive) setOpenMenu(true)
  }

  const isActive = href
    ? isNavActive(href, pathname)
    : childActive

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
