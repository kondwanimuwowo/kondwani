"use client"

import { Menu } from "@mui/icons-material"

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-foreground text-white">
      <span className="text-sm font-extrabold tracking-tight">[&lt;ondwani / admin</span>
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-full hover:bg-subtle-dark transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu sx={{ fontSize: 22 }} />
      </button>
    </header>
  )
}
