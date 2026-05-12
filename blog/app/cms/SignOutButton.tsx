"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button onClick={signOut} className="text-sm text-muted hover:text-foreground transition-colors">
      Sign out
    </button>
  )
}
