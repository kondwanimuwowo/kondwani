import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminShellClient } from "./AdminShellClient"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <AdminShellClient userEmail={user.email ?? ""}>
      {children}
    </AdminShellClient>
  )
}
