import Link from "next/link"
import { GitHub, LinkedIn, Twitter } from "@mui/icons-material"

const navLinks = [
  { name: "About", href: "/#about" },
  { name: "Skills", href: "/#skills" },
  { name: "Projects", href: "/#projects" },
  { name: "Beyond Code", href: "/#beyond-code" },
]

const socialLinks = [
  { name: "GitHub", href: "https://github.com/kondwanimuwowo", icon: GitHub },
  { name: "LinkedIn", href: "https://linkedin.com/in/kondwanimuwowo", icon: LinkedIn },
  { name: "Twitter / X", href: "https://x.com/kondwanimuwow0", icon: Twitter },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="container-custom pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight text-white hover:text-primary transition-colors duration-300"
            >
              [&lt;ondwani
            </Link>
            <p className="mt-4 text-sm text-white/50 max-w-xs leading-relaxed">
              Building clean, purposeful, and smooth digital experiences from Lusaka, Zambia.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="text-white/50 hover:text-white transition-colors duration-200"
                >
                  <Icon fontSize="small" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-5">
              Navigation
            </p>
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-5">
              Location
            </p>
            <p className="text-sm text-white/50">Lusaka, Zambia</p>
            <p className="text-sm text-white/30 mt-1">UTC+2</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Kondwani Muwowo. Built with Next.js &amp; Tailwind CSS.
          </p>
          <a
            href="https://blog.kondwanimuwowo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/15 hover:text-white/40 transition-colors duration-200"
          >
            Blog
          </a>
        </div>
      </div>
    </footer>
  )
}
