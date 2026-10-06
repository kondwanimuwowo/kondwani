const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

// For interpolating user-entered text into HTML emails.
export function escapeHtml(value: string | null | undefined) {
  return (value ?? "").replace(/[&<>"']/g, ch => entities[ch])
}
