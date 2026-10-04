import { create } from "zustand"

export type ToastKind = "success" | "error"
export type Toast = { id: number; kind: ToastKind; message: string }

type ToastStore = {
  toasts: Toast[]
  push: (kind: ToastKind, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextId++
    set(s => ({ toasts: [...s.toasts, { id, kind, message }] }))
    setTimeout(() => get().dismiss(id), kind === "error" ? 6000 : 3500)
  },
  dismiss: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
}
