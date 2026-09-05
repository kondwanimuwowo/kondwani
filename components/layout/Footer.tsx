import Link from "next/link"
import { GitHub, LinkedIn, X } from "@mui/icons-material"
import { NewsletterForm } from "@/components/ui/NewsletterForm"

const socialLinks = [
  { name: "GitHub", href: "https://github.com/kondwanimuwowo", icon: GitHub },
  { name: "LinkedIn", href: "https://linkedin.com/in/kondwanimuwowo", icon: LinkedIn },
  { name: "Twitter / X", href: "https://x.com/kondwanimuwow0", icon: X },
]

const footerLinks = [
  { name: "About", href: "/#about" },
  { name: "Skills", href: "/#skills" },
  { name: "Projects", href: "/#projects" },
  { name: "Beyond Code", href: "/#beyond-code" },
  { name: "Contact", href: "/contact" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-white overflow-hidden">
      {/* Wordmark + links block */}
      <div className="container-custom pt-16 pb-8 text-center">
        <p
          className="font-extrabold leading-none tracking-tighter text-subtle-dark select-none whitespace-nowrap"
          style={{ fontSize: "clamp(48px, 9vw, 140px)" }}
        >
          [&lt;ondwani
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs text-muted-dark hover:text-white transition-colors duration-200"
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
      <div className="shadow-[0_-1px_0_0_rgba(255,255,255,0.06)]">
        <div className="container-custom py-4 flex items-center justify-between">
          <p className="text-xs text-muted-dark">
            &copy; {year} Kondwani Muwowo. Built with Next.js and Tailwind CSS.
          </p>
          <div className="flex items-center gap-5">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-muted-dark hover:text-white transition-colors duration-200"
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
