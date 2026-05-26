"use client"

import { Print } from "@mui/icons-material"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 text-sm font-medium border border-border text-foreground px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors cursor-pointer"
    >
      <Print sx={{ fontSize: 16 }} />
      Print / Save PDF
    </button>
  )
}
