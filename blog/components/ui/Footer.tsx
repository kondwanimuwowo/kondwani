import Link from "next/link"
import { GitHub, LinkedIn, X } from "@mui/icons-material"
import { NewsletterForm } from "@/components/ui/NewsletterForm"

const socialLinks = [
  { name: "GitHub", href: "https://github.com/kondwanimuwowo", icon: GitHub },
  { name: "LinkedIn", href: "https://linkedin.com/in/kondwanimuwowo", icon: LinkedIn },
  { name: "Twitter / X", href: "https://x.com/kondwanimuwow0", icon: X },
]

const footerLinks = [
  { name: "Portfolio", href: "https://kondwanimuwowo.com" },
  { name: "Projects", href: "https://kondwanimuwowo.com/#projects" },
  { name: "Beyond Code", href: "https://kondwanimuwowo.com/#beyond-code" },
  { name: "Contact", href: "https://kondwanimuwowo.com/contact" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-white overflow-hidden">
      {/* Wordmark + links block */}
      <div className="container-custom pt-16 pb-8 text-center">
        <p
          className="font-extrabold leading-none tracking-tighter text-white/[0.06] select-none whitespace-nowrap"
          style={{ fontSize: "clamp(48px, 9vw, 140px)" }}
        >
          [&lt;ondwani
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs text-white/30 hover:text-white transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div>
        <div className="container-custom py-12">
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container-custom py-4 flex items-center justify-between">
          <p className="text-xs text-white/20">
            &copy; {year} Kondwani Muwowo. Built with Next.js &amp; Tailwind CSS.
          </p>
          <div className="flex items-center gap-5">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-white/30 hover:text-white transition-colors duration-200"
              >
                <Icon sx={{ fontSize: 15 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
