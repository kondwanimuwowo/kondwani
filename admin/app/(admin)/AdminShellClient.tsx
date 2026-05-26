"use client"

import { useState, useCallback } from "react"
import { motion } from "motion/react"
import { Sidebar } from "./Sidebar"
import { MobileHeader } from "./MobileHeader"
import { AdminMobileDrawer } from "./AdminMobileDrawer"

export function AdminShellClient({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <Sidebar userEmail={userEmail} />
      </div>

      {/* Mobile Top Bar Header */}
      <MobileHeader onMenuToggle={() => setDrawerOpen(true)} />

      {/* Main Content Area */}
      <motion.main
        className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-thin min-w-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Mobile Drawer */}
      <AdminMobileDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </div>
  )
}
