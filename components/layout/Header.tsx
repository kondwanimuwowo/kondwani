"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react"
import { Menu, X } from "@mui/icons-material"
import { cn } from "@/lib/utils"

const baseNavLinks = [
  { name: "Projects", href: "/projects" },
  { name: "Beyond Code", href: "/beyond-code" },
  { name: "Contact", href: "/contact" },
]

const blogNavLink = { name: "Blog", href: "/blog" }

interface HeaderProps {
  showBlog?: boolean
}

export function Header({ showBlog = false }: HeaderProps) {
  const navLinks = showBlog ? [...baseNavLinks.slice(0, 2), blogNavLink, baseNavLinks[2]] : baseNavLinks
  const { scrollY } = useScroll()
  const [hidden, setHidden] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const lastScrollDownStart = React.useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setIsScrolled(latest > 20)

    if (latest > previous) {
      // scrolling down — track where the downward run started
      if (previous <= lastScrollDownStart.current || lastScrollDownStart.current === 0) {
        lastScrollDownStart.current = previous
      }
      // hide only after 80px of downward movement from where we started going down
      if (!hidden && latest > 200 && latest - lastScrollDownStart.current > 80) {
        setHidden(true)
        setMobileOpen(false)
      }
    } else {
      // scrolling up — show instantly
      lastScrollDownStart.current = 0
      if (hidden) setHidden(false)
    }
  })

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "glass py-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.033)] border-border/50"
          : "bg-transparent py-5 border-transparent"
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-foreground hover:text-primary transition-colors duration-300"
        >
          [&lt;ondwani
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
          <Link
            href="/kondwani-resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors duration-200 shadow-sm"
          >
            Resume
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {mobileOpen ? <X /> : <Menu />}
          </motion.div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden glass border-t border-border/40"
          >
            <nav className="container-custom flex flex-col py-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3.5 text-sm font-medium text-foreground hover:text-primary transition-colors border-b border-border/30 last:border-0"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05, duration: 0.2 }}
                className="pt-4"
              >
                <Link
                  href="/kondwani-resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-sm font-medium bg-primary text-white py-2.5 rounded-full hover:bg-primary-hover transition-colors"
                >
                  Resume
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
