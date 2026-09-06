"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  { key: "backlog", label: "Backlog", color: "bg-neutral-bg text-muted", tip: "Not started, ideas and future work" },
  { key: "scoping", label: "Scoping", color: "bg-info-bg text-info", tip: "Defining requirements and pricing with the client" },
  { key: "active", label: "Active", color: "bg-primary-tint text-primary", tip: "Currently in progress" },
  { key: "review", label: "Review", color: "bg-warning-bg text-warning", tip: "Work is done, awaiting client feedback" },
  { key: "staged", label: "Staged", color: "bg-info-bg text-info", tip: "Approved and ready to deploy or hand off" },
  { key: "shipped", label: "Shipped", color: "bg-success-bg text-success", tip: "Delivered and complete" },
  { key: "paused", label: "Paused", color: "bg-neutral-bg text-muted", tip: "On hold, waiting on client or external blocker" },
]

const BILLING_LABELS: Record<string, string> = {
  fixed: "Fixed", hourly: "Hourly", retainer: "Retainer", pro_bono: "Pro Bono",
}

const BILLING_TIPS: Record<string, string> = {
  fixed: "Flat project fee agreed upfront",
  hourly: "Billed by hours worked at a set rate",
  retainer: "Recurring monthly fee for ongoing work",
  pro_bono: "No charge, volunteer or personal project",
}

function statusStyle(s: string) {
  return STATUSES.find(x => x.key === s)?.color ?? "bg-neutral-bg text-muted"
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
      className="bg-white rounded-3xl p-4 shadow-md cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none"
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

async function fetchWorkProjects(): Promise<WorkProject[]> {
  const res = await fetch("/api/studio/work")
  if (!res.ok) throw new Error()
  return res.json()
}

export default function WorkPage() {
  const [view, setView] = useState<"list" | "board">("board")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["work-projects"],
    queryFn: fetchWorkProjects,
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/studio/work/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["work-projects"] })
      const previous = queryClient.getQueryData<WorkProject[]>(["work-projects"])
      queryClient.setQueryData<WorkProject[]>(["work-projects"], old =>
        old?.map(p => p.id === id ? { ...p, status } : p))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["work-projects"], context.previous)
    },
  })

  const quickAddMutation = useMutation({
    mutationFn: async ({ title, status }: { title: string; status: string }) => {
      const res = await fetch("/api/studio/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, billingType: "fixed", currency: "USD" }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-projects"] }),
  })

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const targetStatus = over.id as string
    if (!STATUSES.find(s => s.key === targetStatus)) return

    const project = projects.find(p => p.id === active.id)
    if (!project || project.status === targetStatus) return

    statusMutation.mutate({ id: active.id as string, status: targetStatus })
  }

  function handleQuickAdd(status: string) {
    const title = (quickAdd[status] ?? "").trim()
    if (!title) return
    quickAddMutation.mutate({ title, status })
    setQuickAdd(prev => ({ ...prev, [status]: "" }))
  }

  const activeProject = projects.find(p => p.id === activeId)

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
          <div className="flex items-center bg-surface rounded-full p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "list" ? "bg-white text-foreground shadow-md" : "text-muted hover:text-foreground"}`}
            >
              <ViewList sx={{ fontSize: 15 }} /> List
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === "board" ? "bg-white text-foreground shadow-md" : "text-muted hover:text-foreground"}`}
            >
              <ViewKanban sx={{ fontSize: 15 }} /> Board
            </button>
          </div>
          <Link
            href="/work/new"
            className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors"
          >
            <Add sx={{ fontSize: 18 }} /> New project
          </Link>
        </div>
      </div>

      {/* ── List view ─────────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {isError ? (
            <div className="px-6 py-12 text-center space-y-3">
              <p className="text-danger font-medium text-sm">Couldn&apos;t load projects. This is a display error, not data loss.</p>
              <button
                onClick={() => refetch()}
                className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <p className="px-6 py-12 text-sm text-muted text-center">Loading…</p>
          ) : projects.length === 0 ? (
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
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/work/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{p.title}</Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-muted">{p.client ? (p.client.company ?? p.client.name) : "No client"}</p>
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
                      <p className="text-sm text-muted">{fmt(p.dueDate) ?? "Not set"}</p>
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
                      className="space-y-2 min-h-[60px] rounded-3xl p-2 bg-surface"
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (activeId) {
                          const project = projects.find(p => p.id === activeId)
                          if (project && project.status !== col.key) {
                            statusMutation.mutate({ id: activeId, status: col.key })
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
                      className="w-full px-3 py-2 text-xs text-muted bg-transparent rounded-3xl hover:bg-white focus:bg-white focus:text-foreground outline-none transition-colors placeholder:text-muted"
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
