"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// The vinext/Cloudflare stack intermittently 500s on route handlers (a
// confirmed bug in vinext's own request dispatch, not our code -- see
// ProjectForm.tsx history). A short retry with backoff papers over that
// without the user needing to notice or re-click.
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 2000),
        staleTime: 10_000,
      },
      mutations: {
        retry: 1,
        retryDelay: 300,
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
