"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Dashboard, Code, Article, Work, Contacts,
  BarChart, Lightbulb, Build,
} from "@mui/icons-material"

const navItems = [
  { label: "Dashboard", href: "/", icon: Dashboard },
  { label: "Projects", href: "/projects", icon: Code },
  { label: "Case Studies", href: "/case-studies", icon: Work },
  { label: "Skills", href: "/skills", icon: Build },
  { label: "Contacts", href: "/contacts", icon: Contacts },
  { label: "Analytics", href: "/analytics", icon: BarChart },
  { label: "Job Tracker", href: "/jobs", icon: Article },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
]

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="w-56 shrink-0 bg-foreground text-white flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="font-extrabold tracking-tight text-white hover:text-primary transition-colors text-sm">
          [&lt;ondwani / admin
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link key={label} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
              )}>
              <Icon sx={{ fontSize: 18 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/30 truncate mb-3">{userEmail}</p>
        <button onClick={signOut} className="text-xs text-white/40 hover:text-white transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  )
}
