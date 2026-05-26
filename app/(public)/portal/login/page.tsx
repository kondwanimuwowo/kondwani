"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ClientPortalLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/portal/auth/callback`,
        },
      })
      if (authError) {
        setError(authError.message)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between overflow-hidden font-sans">
      {/* Dynamic Glowing Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stone-900/40 blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white">[&lt;ondwani</span>
          <span className="text-white/20">·</span>
          <span className="text-xs font-mono tracking-wider uppercase text-white/50">Client Portal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative group hover:border-red-950/50 transition-all duration-500">
          
          {/* Accent Line top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
              Welcome back
            </h1>
            <p className="text-sm text-white/60 font-medium">
              Access your active projects, sign agreements, track milestones, and converse directly.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 py-3.5 px-5 rounded-xl font-bold text-sm tracking-tight transition-all duration-300 shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.26-.14-.54-.19-.82-.02-.27-.04-.55-.04-.81z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="mt-8 text-center text-xs text-white/30 border-t border-white/5 pt-6 font-mono">
            Secure client authentication powered by Supabase.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 border-t border-white/5 bg-black/10 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Kondwani Muwowo. All rights reserved.
      </footer>
    </div>
  )
}
