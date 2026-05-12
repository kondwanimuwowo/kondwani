"use client"

import Link from "next/link"
import { GitHub, LinkedIn, Twitter } from "@mui/icons-material"

const socialLinks = [
  { name: "GitHub", href: "https://github.com/kondwanimuwowo", icon: GitHub },
  { name: "LinkedIn", href: "https://linkedin.com/in/kondwanimuwowo", icon: LinkedIn },
  { name: "Twitter / X", href: "https://x.com/kondwanimuwow0", icon: Twitter },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-14">
          <Link href="/" className="font-extrabold tracking-tight text-foreground hover:text-primary transition-colors">
            [&lt;ondwani / blog
          </Link>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}
                className="text-muted hover:text-foreground transition-colors">
                <Icon fontSize="small" />
              </a>
            ))}
            <Link href="https://kondwanimuwowo.com" target="_blank"
              className="text-sm font-medium bg-primary text-white px-4 py-1.5 rounded-full hover:bg-primary-hover transition-colors">
              Portfolio
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} Kondwani Muwowo
          </p>
          <Link href="/login" className="text-xs text-muted/40 hover:text-muted transition-colors">
            CMS
          </Link>
        </div>
      </footer>
    </div>
  )
}
