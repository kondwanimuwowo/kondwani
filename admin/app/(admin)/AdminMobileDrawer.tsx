"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import {
  Dashboard, Code, Work, Build, Contacts,
  BarChart, Article, Lightbulb, ExpandMore,
  Logout, Close,
} from "@mui/icons-material"

type NavItem = {
  label: string
  href?: string
  icon: React.ElementType
  subItems?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Dashboard },
  { label: "Projects", href: "/projects", icon: Code },
  { label: "Case Studies", href: "/case-studies", icon: Work },
  { label: "Skills", href: "/skills", icon: Build },
  { label: "Contacts", href: "/contacts", icon: Contacts },
  { label: "Analytics", href: "/analytics", icon: BarChart },
  { label: "Job Tracker", href: "/jobs", icon: Article },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
]

interface AdminMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminMobileDrawer({ isOpen, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const prevPathname = useRef(pathname)

  // Auto-open submenu matching current route
  useEffect(() => {
    const active = navItems.find(item =>
      item.subItems?.some(sub => pathname.startsWith(sub.href))
    )
    setOpenMenu(active?.label ?? null)
  }, [pathname])

  // Close drawer on route change
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-foreground text-white z-50 md:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 shadow-[0_1px_0_0_rgba(255,255,255,0.1)]">
              <span className="text-sm font-extrabold tracking-tight text-white">
                [&lt;ondwani / admin
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-subtle-dark transition-colors"
                aria-label="Close menu"
              >
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
              {navItems.map(({ label, href, icon: Icon, subItems }) => {
                const isActive = href
                  ? href === "/" ? pathname === "/" : pathname.startsWith(href)
                  : subItems?.some(s => pathname.startsWith(s.href))

                if (subItems) {
                  const open = openMenu === label
                  return (
                    <div key={label}>
                      <button
                        onClick={() => setOpenMenu(prev => prev === label ? null : label)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                          isActive ? "bg-subtle-dark text-white" : "text-muted-dark hover:text-white"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon sx={{ fontSize: 18 }} />
                          {label}
                        </span>
                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ExpandMore sx={{ fontSize: 16 }} />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
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
                                    pathname === sub.href
                                      ? "text-white font-medium"
                                      : "text-muted-dark hover:text-white"
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
                    key={label}
                    href={href!}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive ? "bg-subtle-dark text-white" : "text-muted-dark hover:text-white"
                    )}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-xs text-muted-dark hover:text-white transition-colors"
              >
                <Logout sx={{ fontSize: 15 }} />
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
