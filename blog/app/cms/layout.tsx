import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "./SignOutButton"

export default async function CMSLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="container-custom flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/cms" className="font-bold text-foreground hover:text-primary transition-colors text-sm">
              Blog CMS
            </Link>
            <Link href="/" target="_blank" className="text-sm text-muted hover:text-foreground transition-colors">
              View blog ↗
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:block">{user.email}</span>
            <Link href="/cms/new"
              className="text-sm font-medium bg-primary text-white px-4 py-1.5 rounded-full hover:bg-primary-hover transition-colors">
              New post
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-surface">{children}</main>
    </div>
  )
}
