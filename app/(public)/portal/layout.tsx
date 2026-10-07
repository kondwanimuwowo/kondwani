import type { Metadata } from "next"

// The client portal is private; keep it and its login page out of search results
export const metadata: Metadata = {
  title: "Client portal",
  robots: { index: false, follow: false },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
