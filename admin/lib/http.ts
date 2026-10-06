export async function errorMessage(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string }
    if (data?.error) return `${data.error} (${res.status})`
  } catch {}
  return `${fallback} (${res.status})`
}

export async function responseError(res: Response, action: string) {
  return new Error(await errorMessage(res, `${action} failed`))
}

// JSON fetch that throws the server's error message on a non-2xx response.
export async function apiFetch<T = unknown>(
  url: string,
  { method = "GET", body, action = "Request" }: { method?: string; body?: unknown; action?: string } = {},
): Promise<T> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  })
  if (!res.ok) throw await responseError(res, action)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function errorText(e: unknown, fallback = "Something went wrong") {
  return e instanceof Error && e.message ? e.message : fallback
}
