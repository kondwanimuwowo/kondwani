"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  DndContext, DragOverlay, closestCorners,
  useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ViewKanban, ViewList, Add, OpenInNew, CalendarToday } from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"

type Client = { id: string; name: string; company: string | null }

type WorkProject = {
  id: string
  title: string
  description: string | null
  clientId: string | null
  client: Client | null
  status: string
  billingType: string
  rate: number | null
  budget: number | null
  currency: string
  startDate: string | null
  dueDate: string | null
  _count: { tasks: number }
  doneTaskCount: number
}

const STATUSES = [
  { key: "backlog", label: "Backlog", color: "bg-slate-100 text-slate-600", tip: "Not started — ideas and future work" },
  { key: "scoping", label: "Scoping", color: "bg-purple-50 text-purple-700", tip: "Defining requirements and pricing with the client" },
  { key: "active", label: "Active", color: "bg-blue-50 text-blue-700", tip: "Currently in progress" },
  { key: "review", label: "Review", color: "bg-amber-50 text-amber-700", tip: "Work is done — awaiting client feedback" },
  { key: "staged", label: "Staged", color: "bg-orange-50 text-orange-700", tip: "Approved and ready to deploy / hand off" },
  { key: "shipped", label: "Shipped", color: "bg-emerald-50 text-emerald-700", tip: "Delivered and complete" },
  { key: "paused", label: "Paused", color: "bg-slate-100 text-slate-400", tip: "On hold — waiting on client or external blocker" },
]

const BILLING_LABELS: Record<string, string> = {
  fixed: "Fixed", hourly: "Hourly", retainer: "Retainer", pro_bono: "Pro Bono",
}

const BILLING_TIPS: Record<string, string> = {
  fixed: "Flat project fee agreed upfront",
  hourly: "Billed by hours worked at a set rate",
  retainer: "Recurring monthly fee for ongoing work",
  pro_bono: "No charge — volunteer or personal project",
}

const empty = {
  title: "", clientId: "", status: "backlog", billingType: "fixed",
  rate: "", budget: "", currency: "USD", startDate: "", dueDate: "", description: "",
}

function statusStyle(s: string) {
  return STATUSES.find(x => x.key === s)?.color ?? "bg-slate-100 text-slate-500"
}

function fmt(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Kanban card (sortable) ───────────────────────────────────────────────────

function KanbanCard({ project }: { project: WorkProject }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const total = project._count.tasks
  const done = project.doneTaskCount

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all select-none"
    >
      <Link href={`/work/${project.id}`} onClick={e => e.stopPropagation()} className="block mb-2">
        <p className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">{project.title}</p>
      </Link>
      {project.client && (
        <p className="text-xs text-muted mb-3">{project.client.company ?? project.client.name}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <Tooltip content={BILLING_TIPS[project.billingType] ?? project.billingType}>
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full cursor-default ${statusStyle(project.billingType === "pro_bono" ? "paused" : project.billingType === "hourly" ? "scoping" : "active")}`}>
            {BILLING_LABELS[project.billingType]}
          </span>
        </Tooltip>
        <div className="flex items-center gap-2">
          {project.dueDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <CalendarToday sx={{ fontSize: 11 }} />{fmt(project.dueDate)}
            </span>
          )}
          {total > 0 && (
            <span className="text-[11px] text-muted">{done}/{total}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkPage() {
  const [projects, setProjects] = useState<WorkProject[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [view, setView] = useState<"list" | "board">("board")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/studio/work"),
      fetch("/api/studio/clients"),
    ])
    setProjects(await pRes.json())
    setClients(await cRes.json())
  }

  useEffect(() => { load() }, [])

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/studio/work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        clientId: form.clientId || null,
        status: form.status,
        billingType: form.billingType,
        rate: form.rate ? parseFloat(form.rate) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        currency: form.currency,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        description: form.description || null,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm(empty)
    load()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const targetStatus = over.id as string
    if (!STATUSES.find(s => s.key === targetStatus)) return

    const project = projects.find(p => p.id === active.id)
    if (!project || project.status === targetStatus) return

    setProjects(prev => prev.map(p => p.id === active.id ? { ...p, status: targetStatus } : p))
    await fetch(`/api/studio/work/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    })
  }

  async function handleQuickAdd(status: string) {
    const title = (quickAdd[status] ?? "").trim()
    if (!title) return
    await fetch("/api/studio/work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, billingType: "fixed", currency: "USD" }),
    })
    setQuickAdd(prev => ({ ...prev, [status]: "" }))
    load()
  }

  const activeProject = projects.find(p => p.id === activeId)
  const inputCls = "w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
  const labelCls = "block text-sm font-medium text-foreground mb-1.5"

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Work</h1>
          <p className="text-sm text-muted">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-surface border border-border rounded-full p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "list" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              <ViewList sx={{ fontSize: 15 }} /> List
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "board" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              <ViewKanban sx={{ fontSize: 15 }} /> Board
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
          >
            <Add sx={{ fontSize: 18 }} /> New project
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border p-6 w-full max-w-lg my-8">
            <h2 className="font-bold text-foreground mb-5">New Project</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={f("title")} className={inputCls} placeholder="Project name" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Client</label>
                  <select value={form.clientId} onChange={f("clientId")} className={inputCls}>
                    <option value="">No client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company ?? c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={f("status")} className={inputCls}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Billing type</label>
                  <select value={form.billingType} onChange={f("billingType")} className={inputCls}>
                    <option value="fixed">Fixed price</option>
                    <option value="hourly">Hourly rate</option>
                    <option value="retainer">Retainer</option>
                    <option value="pro_bono">Pro Bono</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={form.currency} onChange={f("currency")} className={inputCls}>
                    <option value="USD">USD</option>
                    <option value="ZMW">ZMW</option>
                  </select>
                </div>
              </div>
              {(form.billingType === "fixed") && (
                <div>
                  <label className={labelCls}>Budget</label>
                  <input type="number" value={form.budget} onChange={f("budget")} className={inputCls} placeholder="0.00" />
                </div>
              )}
              {(form.billingType === "hourly" || form.billingType === "retainer") && (
                <div>
                  <label className={labelCls}>{form.billingType === "retainer" ? "Monthly rate" : "Hourly rate"}</label>
                  <input type="number" value={form.rate} onChange={f("rate")} className={inputCls} placeholder="0.00" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start date</label>
                  <input type="date" value={form.startDate} onChange={f("startDate")} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Due date</label>
                  <input type="date" value={form.dueDate} onChange={f("dueDate")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={f("description")} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} disabled={saving || !form.title}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60">
                {saving ? "Saving…" : "Create project"}
              </button>
              <button onClick={() => { setShowForm(false); setForm(empty) }}
                className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-surface transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {projects.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted text-center">No projects yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-6 py-3">Project</th>
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden md:table-cell">Client</th>
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden lg:table-cell">Billing</th>
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden lg:table-cell">Due</th>
                  <th className="text-left text-xs font-semibold text-muted tracking-wider px-4 py-3 hidden sm:table-cell">Tasks</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/work/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{p.title}</Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-muted">{p.client ? (p.client.company ?? p.client.name) : "—"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Tooltip content={STATUSES.find(s => s.key === p.status)?.tip ?? p.status}>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-default ${statusStyle(p.status)}`}>
                          {STATUSES.find(s => s.key === p.status)?.label ?? p.status}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Tooltip content={BILLING_TIPS[p.billingType] ?? p.billingType}>
                        <p className="text-sm text-muted cursor-default">{BILLING_LABELS[p.billingType]}</p>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-sm text-muted">{fmt(p.dueDate) ?? "—"}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-muted">{p.doneTaskCount}/{p._count.tasks}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/work/${p.id}`} className="text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1">
                        <OpenInNew sx={{ fontSize: 14 }} /> Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Board view ────────────────────────────────────────────────────── */}
      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
            {STATUSES.map(col => {
              const colProjects = projects.filter(p => p.status === col.key)
              return (
                <div key={col.key} className="shrink-0 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tooltip content={col.tip}>
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full cursor-default ${col.color}`}>
                          {col.label}
                        </span>
                      </Tooltip>
                      <span className="text-xs text-muted">{colProjects.length}</span>
                    </div>
                  </div>

                  <SortableContext items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div
                      data-droppable-id={col.key}
                      className="space-y-2 min-h-[60px] rounded-xl p-2 bg-surface/50 border border-border/50"
                      onDragOver={e => e.preventDefault()}
                      onDrop={async () => {
                        if (activeId) {
                          const project = projects.find(p => p.id === activeId)
                          if (project && project.status !== col.key) {
                            setProjects(prev => prev.map(p => p.id === activeId ? { ...p, status: col.key } : p))
                            await fetch(`/api/studio/work/${activeId}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: col.key }),
                            })
                          }
                        }
                      }}
                    >
                      {colProjects.map(p => <KanbanCard key={p.id} project={p} />)}
                    </div>
                  </SortableContext>

                  {/* Quick add */}
                  <div className="mt-2">
                    <input
                      value={quickAdd[col.key] ?? ""}
                      onChange={e => setQuickAdd(prev => ({ ...prev, [col.key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleQuickAdd(col.key)}
                      placeholder="+ Add project"
                      className="w-full px-3 py-2 text-xs text-muted bg-transparent border border-transparent rounded-lg hover:border-border focus:border-border focus:text-foreground outline-none transition-colors placeholder:text-muted/40"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {activeProject && <KanbanCard project={activeProject} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
