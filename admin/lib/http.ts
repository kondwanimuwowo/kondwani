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
