import type { QueryClient, QueryKey } from "@tanstack/react-query"

// Drops a deleted row from a cached list right away instead of waiting for the refetch.
export function removeFromList(queryClient: QueryClient, key: QueryKey, id: string | undefined) {
  if (!id) return
  queryClient.setQueryData<{ id: string }[]>(key, rows => rows?.filter(r => r.id !== id))
}
