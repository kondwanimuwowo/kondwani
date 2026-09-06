"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  DndContext, closestCenter, useSensor, useSensors, PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowBack, ViewList, ViewKanban, Add, Delete, DragIndicator,
  CalendarToday, RequestQuote, OpenInNew, Chat, Description,
  ReceiptLong, Send, Edit, PlayArrow, Pause, CheckCircle, Save
} from "@mui/icons-material"
import { Tooltip } from "@/components/ui/Tooltip"

// ── Types ─────────────────────────────────────────────────────────────────────

type Client = { id: string; name: string; company: string | null; email: string; currency: string }
type WorkTask = {
  id: string; projectId: string; title: string; description: string | null
  status: string; priority: string; dueDate: string | null; position: number
  subtasks: WorkTask[]
}
type DocumentSummary = {
  id: string; type: string; number: string; status: string; currency: string
  issueDate: string; dueDate: string | null
  items: { amount: number }[]
}
type WorkProject = {
  id: string; title: string; description: string | null
  clientId: string | null; client: Client | null
  status: string; billingType: string; rate: number | null; budget: number | null
  currency: string; startDate: string | null; dueDate: string | null
  portfolioId: string | null
  tasks: WorkTask[]
  documents: DocumentSummary[]
}

type BillingMilestone = {
  id: string
  projectId: string
  title: string
  percentage: number | null
  amount: number
  dueDate: string | null
  status: string
  position: number
  createdAt: string
  updatedAt: string
  invoice?: { id: string; number: string; status: string; token: string } | null
}

type RetainerContract = {
  id: string
  clientId: string
  projectId: string | null
  title: string
  amount: number
  currency: string
  frequency: string
  startDate: string
  endDate: string | null
  status: string
  lastInvoicedAt: string | null
  nextInvoiceAt: string
  createdAt: string
  updatedAt: string
}

type Contract = {
  id: string
  clientId: string
  projectId: string | null
  title: string
  content: string
  status: string
  signedAt: string | null
  signatureName: string | null
  signatureEmail: string | null
  signatureIp: string | null
  pdfUrl: string | null
  token: string
  createdAt: string
  updatedAt: string
}

type ProjectMessage = {
  id: string
  projectId: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  attachments: string[]
  createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUSES = ["backlog", "scoping", "active", "review", "staged", "shipped", "paused", "cancelled"]
const PROJECT_STATUS_TIPS: Record<string, string> = {
  backlog: "Not started, ideas and future work",
  scoping: "Defining requirements and pricing with the client",
  active: "Currently in progress",
  review: "Work done, awaiting client feedback",
  staged: "Approved and ready to deploy / hand off",
  shipped: "Delivered and complete",
  paused: "On hold, waiting on client or external blocker",
  cancelled: "No longer proceeding",
}
const TASK_STATUSES = ["todo", "in_progress", "review", "done", "blocked"]
const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "Todo", in_progress: "In Progress", review: "Review", done: "Done", blocked: "Blocked",
}
const TASK_STATUS_TIPS: Record<string, string> = {
  todo: "Not started yet",
  in_progress: "Actively being worked on",
  review: "Ready for review or testing",
  done: "Completed",
  blocked: "Cannot proceed, needs something resolved first",
}
const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "bg-neutral-bg text-muted",
  in_progress: "bg-info-bg text-info",
  review: "bg-warning-bg text-warning",
  done: "bg-success-bg text-success",
  blocked: "bg-danger-bg text-danger",
}
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted", medium: "text-warning", high: "text-danger", urgent: "text-danger",
}
const PRIORITY_TIPS: Record<string, string> = {
  low: "Nice to have, no deadline pressure",
  medium: "Standard priority",
  high: "Important, complete soon",
  urgent: "Drop everything, needs immediate attention",
}
const BILLING_TIPS: Record<string, string> = {
  fixed: "Flat project fee agreed upfront",
  hourly: "Billed by hours worked at a set rate",
  retainer: "Recurring monthly fee for ongoing work",
  pro_bono: "No charge, volunteer or personal project",
}
const PROJECT_STATUS_COLORS: Record<string, string> = {
  backlog: "bg-neutral-bg text-muted", scoping: "bg-neutral-bg text-muted",
  active: "bg-info-bg text-info", review: "bg-warning-bg text-warning",
  staged: "bg-info-bg text-info", shipped: "bg-success-bg text-success",
  paused: "bg-neutral-bg text-muted", cancelled: "bg-danger-bg text-danger",
}
const DOC_STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-bg text-muted", sent: "bg-info-bg text-info",
  paid: "bg-success-bg text-success", void: "bg-neutral-bg text-muted",
  accepted: "bg-success-bg text-success", declined: "bg-danger-bg text-danger",
  expired: "bg-neutral-bg text-muted",
}

function fmt(date: string | null | Date) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtDate(date: string | null | Date) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

function docTotal(doc: DocumentSummary) {
  return doc.items.reduce((s, i) => s + i.amount, 0)
}

// ── Sortable task row ─────────────────────────────────────────────────────────

function TaskRow({ task, onStatusCycle, onDelete, onTitleSave }: {
  task: WorkTask
  onStatusCycle: (id: string) => void
  onDelete: (id: string) => void
  onTitleSave: (id: string, title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  function handleBlur() {
    setEditing(false)
    if (title.trim() && title !== task.title) onTitleSave(task.id, title.trim())
    else setTitle(task.title)
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-surface rounded-3xl transition-colors">
      <span {...attributes} {...listeners} className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing">
        <DragIndicator sx={{ fontSize: 16 }} />
      </span>
      <Tooltip content={`${TASK_STATUS_TIPS[task.status]} · Click to advance`}>
        <button
          onClick={() => onStatusCycle(task.id)}
          className={`shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors ${TASK_STATUS_COLORS[task.status]}`}
        >
          {TASK_STATUS_LABELS[task.status]}
        </button>
      </Tooltip>
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setTitle(task.title); setEditing(false) } }}
          className="flex-1 text-sm bg-transparent outline-none shadow-[0_1px_0_0_var(--color-primary)]"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-text ${task.status === "done" ? "line-through text-muted" : "text-foreground"}`}
        >
          {task.title}
        </span>
      )}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-muted shrink-0">
            <CalendarToday sx={{ fontSize: 11 }} />{fmt(task.dueDate)}
          </span>
        )}
        <Tooltip content={PRIORITY_TIPS[task.priority] ?? task.priority}>
          <span className={`text-[10px] font-bold uppercase cursor-default ${PRIORITY_COLORS[task.priority] ?? "text-muted"}`}>{task.priority}</span>
        </Tooltip>
        <button onClick={() => onDelete(task.id)} className="text-muted hover:text-danger transition-colors">
          <Delete sx={{ fontSize: 15 }} />
        </button>
      </div>
    </div>
  )
}

// ── Kanban task card ──────────────────────────────────────────────────────────

function TaskCard({ task, onStatusMove, onDelete }: {
  task: WorkTask
  onStatusMove: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-3xl p-3 group shadow-md hover:shadow-md transition-all">
      <p className={`text-sm mb-2 ${task.status === "done" ? "line-through text-muted" : "text-foreground"}`}>{task.title}</p>
      <div className="flex items-center justify-between">
        <Tooltip content={PRIORITY_TIPS[task.priority] ?? task.priority}>
          <span className={`text-[10px] font-bold uppercase cursor-default ${PRIORITY_COLORS[task.priority] ?? "text-muted"}`}>{task.priority}</span>
        </Tooltip>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:!text-danger transition-colors">
          <Delete sx={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}

// ── Sortable Milestone Row ───────────────────────────────────────────────────

function MilestoneRow({ milestone, onInvoice, onDelete }: {
  milestone: BillingMilestone
  onInvoice: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: milestone.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between px-4 py-3 bg-white rounded-3xl shadow-md transition-colors group">
      <div className="flex items-center gap-3">
        <span {...attributes} {...listeners} className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing">
          <DragIndicator sx={{ fontSize: 16 }} />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{milestone.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
            {milestone.percentage !== null && <span>{milestone.percentage}%</span>}
            {milestone.percentage !== null && milestone.dueDate && <span>·</span>}
            <span>{fmt(milestone.dueDate) || "No due date"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-mono font-bold text-foreground">
          {milestone.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        
        {milestone.invoice ? (
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${DOC_STATUS_COLORS[milestone.invoice.status] ?? "bg-neutral-bg text-muted"}`}>
            {milestone.invoice.status === "draft" ? "Draft INV" : milestone.invoice.status.toUpperCase()} ({milestone.invoice.number})
          </span>
        ) : (
          <button
            onClick={() => onInvoice(milestone.id)}
            className="text-xs font-semibold text-primary hover:text-primary-hover px-3 py-1 bg-primary-tint rounded-full transition-colors cursor-pointer"
          >
            Invoice
          </button>
        )}

        <button
          onClick={() => onDelete(milestone.id)}
          disabled={milestone.invoice?.status === "paid"}
          className="text-muted hover:text-danger disabled:opacity-30 transition-colors cursor-pointer"
        >
          <Delete sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<WorkProject | null>(null)
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [taskView, setTaskView] = useState<"list" | "board">("list")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const [activeTab, setActiveTab] = useState<"tasks" | "billing" | "contracts" | "chat">("tasks")

  // Milestones State
  const [milestones, setMilestones] = useState<BillingMilestone[]>([])
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [newMilestonePercentage, setNewMilestonePercentage] = useState<number | "">("")
  const [newMilestoneAmount, setNewMilestoneAmount] = useState<number | "">("")
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("")

  // Retainer State
  const [retainer, setRetainer] = useState<RetainerContract | null>(null)
  const [newRetainerTitle, setNewRetainerTitle] = useState("")
  const [newRetainerAmount, setNewRetainerAmount] = useState<number | "">("")
  const [newRetainerFrequency, setNewRetainerFrequency] = useState("monthly")
  const [newRetainerStartDate, setNewRetainerStartDate] = useState("")
  const [newRetainerEndDate, setNewRetainerEndDate] = useState("")

  // Contracts State
  const [contracts, setContracts] = useState<Contract[]>([])
  const [newContractTitle, setNewContractTitle] = useState("")
  const [newContractContent, setNewContractContent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [editingContractId, setEditingContractId] = useState<string | null>(null)

  // Messages State
  const [messages, setMessages] = useState<ProjectMessage[]>([])
  const [newMessageContent, setNewMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Load project details
  async function load() {
    const res = await fetch(`/api/studio/work/${id}`)
    const data = await res.json()
    setProject(data)
    setTasks(data.tasks ?? [])
    setTitle(data.title)
    setDesc(data.description ?? "")
  }

  // Load Milestones
  async function loadMilestones() {
    try {
      const res = await fetch(`/api/studio/work/${id}/milestones`)
      if (res.ok) {
        const data = await res.json()
        setMilestones(data)
      }
    } catch {
      // network failure — milestones panel stays empty
    }
  }

  // Load Retainer
  async function loadRetainer() {
    try {
      const res = await fetch(`/api/studio/retainers?projectId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setRetainer(data[0] || null)
        if (data[0]) {
          setNewRetainerTitle(data[0].title)
          setNewRetainerAmount(data[0].amount)
          setNewRetainerFrequency(data[0].frequency)
        }
      }
    } catch {
      // network failure — retainer panel stays empty
    }
  }

  // Load Contracts
  async function loadContracts() {
    try {
      const res = await fetch(`/api/studio/work/${id}/contracts`)
      if (res.ok) {
        const data = await res.json()
        setContracts(data)
      }
    } catch {
      // network failure — contracts panel stays empty
    }
  }

  // Load Messages
  async function loadMessages() {
    try {
      const res = await fetch(`/api/studio/work/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // network failure — messages panel stays empty
    }
  }

  useEffect(() => {
    load()
    loadMilestones()
    loadRetainer()
    loadContracts()
    loadMessages()
  }, [id])

  // Poll chat messages every 5 seconds when chat tab is active
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTab === "chat") {
      loadMessages()
      interval = setInterval(loadMessages, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab])

  // Scroll to chat bottom
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeTab])

  async function patchProject(body: Record<string, unknown>) {
    await fetch(`/api/studio/work/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    load()
  }

  // Tasks Handlers
  async function addTask(status = "todo") {
    const t = newTaskTitle.trim()
    if (!t) return
    setNewTaskTitle("")
    await fetch(`/api/studio/work/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, status }),
    })
    load()
  }

  async function cycleStatus(taskId: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const idx = TASK_STATUSES.indexOf(task.status)
    const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length]
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t))
    await fetch(`/api/studio/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  async function moveTaskStatus(taskId: string, status: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    await fetch(`/api/studio/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  async function deleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await fetch(`/api/studio/tasks/${taskId}`, { method: "DELETE" })
  }

  async function saveTaskTitle(taskId: string, newTitle: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: newTitle } : t))
    await fetch(`/api/studio/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    })
  }

  async function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(tasks, oldIndex, newIndex)
    setTasks(reordered)
    await fetch(`/api/studio/tasks/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: newIndex }),
    })
  }

  async function deleteProject() {
    if (!confirm("Delete this project and all its tasks?")) return
    await fetch(`/api/studio/work/${id}`, { method: "DELETE" })
    router.push("/work")
  }

  // Milestones Handlers
  async function addMilestone() {
    if (!newMilestoneTitle.trim() || !newMilestoneAmount) return
    const body = {
      title: newMilestoneTitle.trim(),
      amount: parseFloat(newMilestoneAmount.toString()),
      percentage: newMilestonePercentage ? parseFloat(newMilestonePercentage.toString()) : null,
      dueDate: newMilestoneDueDate || null,
    }
    const res = await fetch(`/api/studio/work/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setNewMilestoneTitle("")
      setNewMilestoneAmount("")
      setNewMilestonePercentage("")
      setNewMilestoneDueDate("")
      loadMilestones()
    }
  }

  async function deleteMilestone(mId: string) {
    if (!confirm("Delete this milestone? Any linked draft invoice will be deleted as well.")) return
    const res = await fetch(`/api/studio/work/${id}/milestones?milestoneId=${mId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      loadMilestones()
      load()
    } else {
      const err = await res.json()
      alert(err.error || "Failed to delete milestone")
    }
  }

  async function invoiceMilestone(mId: string) {
    const res = await fetch(`/api/studio/work/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invoice", milestoneId: mId }),
    })
    if (res.ok) {
      loadMilestones()
      load()
    } else {
      const err = await res.json()
      alert(err.error || "Failed to invoice milestone")
    }
  }

  async function handleMilestoneDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = milestones.findIndex(m => m.id === active.id)
    const newIndex = milestones.findIndex(m => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(milestones, oldIndex, newIndex)
    setMilestones(reordered)
    
    const payload = reordered.map((m, idx) => ({ id: m.id, position: idx }))
    await fetch(`/api/studio/work/${id}/milestones`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestones: payload }),
    })
    loadMilestones()
  }

  // Retainer Handlers
  async function createRetainer() {
    if (!newRetainerTitle.trim() || !newRetainerAmount || !newRetainerStartDate || !project) return
    const body = {
      clientId: project.clientId,
      projectId: id,
      title: newRetainerTitle.trim(),
      amount: parseFloat(newRetainerAmount.toString()),
      frequency: newRetainerFrequency,
      startDate: newRetainerStartDate,
      endDate: newRetainerEndDate || null,
      status: "active",
    }
    const res = await fetch(`/api/studio/retainers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      loadRetainer()
    } else {
      const err = await res.json()
      alert(err.error || "Failed to create retainer")
    }
  }

  async function updateRetainerStatus(status: string) {
    if (!retainer) return
    const res = await fetch(`/api/studio/retainers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: retainer.id, status }),
    })
    if (res.ok) {
      loadRetainer()
    }
  }

  async function deleteRetainer() {
    if (!confirm("Are you sure you want to cancel and delete this retainer contract?")) return
    const res = await fetch(`/api/studio/retainers?id=${retainer?.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setRetainer(null)
      loadRetainer()
    }
  }

  // Contracts Handlers
  const CONTRACT_TEMPLATES: Record<string, { title: string; content: string }> = {
    web_dev: {
      title: "Web Development Services Agreement",
      content: `WEB DEVELOPMENT AGREEMENT\n\nThis Web Development Agreement (the "Agreement") is entered into by and between Kondwani Muwowo ("Developer") and the Client named in this project.\n\n1. Services & Scope\nDeveloper agrees to perform the web development services described in the project tasks and milestones. Any additional work outside this scope will require a new agreement or written change order.\n\n2. Compensation & Payment\nClient agrees to pay Developer according to the agreed billing type (Fixed-Price Milestones or Retainer Agreement). For Fixed-Price projects, payments are due upon completion of each milestone. For Retainers, payment is due on the recurring billing date.\n\n3. Intellectual Property\nUpon final payment, all intellectual property rights in the custom code and deliverables created by Developer for Client under this Agreement will transfer to the Client. Developer retains rights to developer tools, library components, and pre-existing code.\n\n4. Client Responsibilities\nClient agrees to provide all necessary assets, copy, credentials, and feedback in a timely manner. Developer is not responsible for project delays caused by client responsiveness.\n\n5. Termination\nEither party may terminate this agreement with 14 days written notice if the other party breaches any material term and fails to cure it.\n\nBy signing below, both parties agree to the terms of this Agreement.`
    },
    web_design: {
      title: "UI/UX Design Services Agreement",
      content: `UI/UX DESIGN AGREEMENT\n\nThis Agreement is between Kondwani Muwowo ("Designer") and the Client.\n\n1. Scope of Work\nDesigner will provide professional user interface and user experience design services including wireframes, mockups, design systems, and interactive prototypes.\n\n2. Revisions\nUp to 3 rounds of design revisions are included in the project scope. Additional revision cycles will be billed at standard hourly rates.\n\n3. Source Files\nSource Figma files and assets will be delivered to the Client upon receipt of final project payment.`
    },
    retainer: {
      title: "Ongoing Support & Maintenance Retainer Agreement",
      content: `RECURRING RETAINER AGREEMENT\n\nThis Retainer Agreement is between Kondwani Muwowo ("Developer") and the Client.\n\n1. Services & Scope\nDeveloper will provide ongoing design, development, maintenance, and support services on a retainer basis. The scope of work is limited to the hours/tasks specified in the retainer plan.\n\n2. Monthly Retainer Fee\nClient agrees to pay the recurring retainer amount in advance of each billing period. Invoices will be generated automatically and are due upon receipt.\n\n3. Unused Hours\nUnused retainer hours do not roll over to the next month unless agreed in writing.\n\n4. Termination\nEither party may terminate this recurring agreement with 30 days written notice.`
    }
  }

  function applyTemplate(key: string) {
    setSelectedTemplate(key)
    if (key && CONTRACT_TEMPLATES[key]) {
      setNewContractTitle(CONTRACT_TEMPLATES[key].title)
      setNewContractContent(CONTRACT_TEMPLATES[key].content)
    }
  }

  async function createContract() {
    if (!newContractTitle.trim() || !newContractContent.trim()) return
    const res = await fetch(`/api/studio/work/${id}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newContractTitle.trim(),
        content: newContractContent.trim(),
      }),
    })
    if (res.ok) {
      setNewContractTitle("")
      setNewContractContent("")
      setSelectedTemplate("")
      loadContracts()
    }
  }

  async function sendContract(cId: string) {
    const res = await fetch(`/api/studio/work/${id}/contracts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: cId, action: "send" }),
    })
    if (res.ok) {
      loadContracts()
    } else {
      const err = await res.json()
      alert(err.error || "Failed to send contract")
    }
  }

  async function updateContractContent(cId: string, titleStr: string, contentStr: string) {
    const res = await fetch(`/api/studio/work/${id}/contracts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: cId, title: titleStr, content: contentStr }),
    })
    if (res.ok) {
      setEditingContractId(null)
      loadContracts()
    }
  }

  async function deleteContract(cId: string) {
    if (!confirm("Are you sure you want to delete this contract? Signed contracts cannot be deleted.")) return
    const res = await fetch(`/api/studio/work/${id}/contracts?contractId=${cId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      loadContracts()
    } else {
      const err = await res.json()
      alert(err.error || "Failed to delete contract")
    }
  }

  // Messages Handlers
  async function sendMessage() {
    if (!newMessageContent.trim() || sendingMessage) return
    setSendingMessage(true)
    const content = newMessageContent.trim()
    setNewMessageContent("")
    
    try {
      const res = await fetch(`/api/studio/work/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
      }
    } catch {
      // send failed — user can retry
    } finally {
      setSendingMessage(false)
    }
  }

  if (!project) return <div className="p-8 text-sm text-muted">Loading…</div>

  const statusKey = project.status
  const billingLabel: Record<string, string> = {
    fixed: "Fixed", hourly: "Hourly", retainer: "Retainer", pro_bono: "Pro Bono",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white shadow-md px-8 py-3 flex items-center justify-between">
        <Link href="/work" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 16 }} /> Work
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={deleteProject} className="text-xs text-muted hover:text-danger transition-colors flex items-center gap-1">
            <Delete sx={{ fontSize: 15 }} /> Delete project
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10 flex gap-10">
        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {editingTitle ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); if (title.trim() !== project.title) patchProject({ title: title.trim() }) }}
              onKeyDown={e => { if (e.key === "Enter") { setEditingTitle(false); patchProject({ title: title.trim() }) } }}
              className="w-full text-4xl font-bold text-foreground bg-transparent outline-none shadow-[0_2px_0_0_var(--color-primary)] mb-2"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-4xl font-bold text-foreground mb-2 cursor-text hover:text-muted transition-colors"
            >
              {project.title}
            </h1>
          )}

          {/* Description */}
          {editingDesc ? (
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={() => { setEditingDesc(false); patchProject({ description: desc || null }) }}
              rows={3}
              className="w-full text-muted text-sm bg-surface outline-none rounded-3xl p-3 resize-none mb-8"
              placeholder="Add a description"
              autoFocus
            />
          ) : (
            <p
              onClick={() => setEditingDesc(true)}
              className={`text-sm mb-8 cursor-text hover:text-foreground transition-colors ${desc ? "text-muted" : "text-muted italic"}`}
            >
              {desc || "Click to add a description"}
            </p>
          )}

          {/* Tabs Selector */}
          <div className="flex gap-1.5 bg-surface p-1 rounded-full mb-6 w-fit">
            {(["tasks", "billing", "contracts", "chat"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all capitalize flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-foreground shadow-md"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab === "tasks" && <ViewList sx={{ fontSize: 16 }} />}
                {tab === "billing" && <ReceiptLong sx={{ fontSize: 16 }} />}
                {tab === "contracts" && <Description sx={{ fontSize: 16 }} />}
                {tab === "chat" && <Chat sx={{ fontSize: 16 }} />}
                {tab === "billing" ? "Billing & Milestones" : tab}
              </button>
            ))}
          </div>

          {/* ── Tasks Tab ────────────────────────────────────────────────── */}
          {activeTab === "tasks" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tasks <span className="text-sm font-normal text-muted ml-1">{tasks.length}</span></h2>
                <div className="flex items-center bg-surface rounded-full p-1">
                  <button
                    onClick={() => setTaskView("list")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${taskView === "list" ? "bg-white text-foreground shadow-md" : "text-muted hover:text-foreground"}`}
                  >
                    <ViewList sx={{ fontSize: 14 }} /> List
                  </button>
                  <button
                    onClick={() => setTaskView("board")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${taskView === "board" ? "bg-white text-foreground shadow-md" : "text-muted hover:text-foreground"}`}
                  >
                    <ViewKanban sx={{ fontSize: 14 }} /> Board
                  </button>
                </div>
              </div>

              {/* List view */}
              {taskView === "list" && (
                <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                  {tasks.length === 0 && (
                    <p className="px-6 py-6 text-sm text-muted text-center">No tasks yet, add one below.</p>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="divide-y divide-border">
                        {tasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onStatusCycle={cycleStatus}
                            onDelete={deleteTask}
                            onTitleSave={saveTaskTitle}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Add sx={{ fontSize: 18 }} className="text-muted" />
                    <input
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTask()}
                      placeholder="Add a task"
                      className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted"
                    />
                    {newTaskTitle && (
                      <button onClick={() => addTask()} className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">Add</button>
                    )}
                  </div>
                </div>
              )}

              {/* Board view */}
              {taskView === "board" && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {TASK_STATUSES.map(col => {
                    const colTasks = tasks.filter(t => t.status === col)
                    return (
                      <div key={col} className="shrink-0 w-52">
                        <div className="flex items-center gap-2 mb-2">
                          <Tooltip content={TASK_STATUS_TIPS[col] ?? col}>
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full cursor-default ${TASK_STATUS_COLORS[col]}`}>
                              {TASK_STATUS_LABELS[col]}
                            </span>
                          </Tooltip>
                          <span className="text-xs text-muted">{colTasks.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[40px] bg-surface rounded-3xl p-2">
                          {colTasks.map(t => (
                            <TaskCard key={t.id} task={t} onStatusMove={moveTaskStatus} onDelete={deleteTask} />
                          ))}
                        </div>
                        <input
                          onKeyDown={async e => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              const val = (e.target as HTMLInputElement).value.trim()
                              ;(e.target as HTMLInputElement).value = ""
                              await fetch(`/api/studio/work/${id}/tasks`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ title: val, status: col }),
                              })
                              load()
                            }
                          }}
                          placeholder="+ Add task"
                          className="w-full mt-1.5 px-2 py-1.5 text-xs text-muted bg-transparent rounded-3xl hover:bg-white focus:bg-white outline-none transition-colors placeholder:text-muted"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Billing & Milestones Tab ───────────────────────────────────── */}
          {activeTab === "billing" && (
            <div className="space-y-8">
              {/* Retainer Section */}
              {project.billingType === "retainer" && (
                <div className="bg-white rounded-3xl shadow-md p-6">
                  <h3 className="text-base font-bold text-foreground mb-4">Retainer Contract</h3>

                  {retainer ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface p-4 rounded-3xl">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Plan Details</span>
                          <p className="text-sm font-semibold text-foreground mt-1">{retainer.title}</p>
                          <p className="text-lg font-mono font-bold text-primary mt-1">
                            {project.currency} {retainer.amount.toLocaleString()}/{retainer.frequency}
                          </p>
                        </div>
                        <div className="bg-surface p-4 rounded-3xl">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Schedule</span>
                          <div className="text-xs text-foreground mt-1 space-y-1">
                            <p><strong>Starts:</strong> {fmt(retainer.startDate)}</p>
                            {retainer.endDate && <p><strong>Ends:</strong> {fmt(retainer.endDate)}</p>}
                            <p><strong>Next Invoice:</strong> {fmt(retainer.nextInvoiceAt)}</p>
                            {retainer.lastInvoicedAt && <p><strong>Last Invoiced:</strong> {fmt(retainer.lastInvoicedAt)}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {retainer.status === "active" ? (
                          <button
                            onClick={() => updateRetainerStatus("paused")}
                            className="flex items-center gap-1 px-4 py-2 bg-surface rounded-full text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Pause sx={{ fontSize: 14 }} /> Pause Retainer
                          </button>
                        ) : (
                          <button
                            onClick={() => updateRetainerStatus("active")}
                            className="flex items-center gap-1 px-4 py-2 bg-success-bg rounded-full text-xs font-semibold text-success hover:bg-success-bg transition-colors cursor-pointer"
                          >
                            <PlayArrow sx={{ fontSize: 14 }} /> Resume Retainer
                          </button>
                        )}
                        <button
                          onClick={deleteRetainer}
                          className="flex items-center gap-1 px-4 py-2 bg-danger-bg rounded-full text-xs font-semibold text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                        >
                          <Delete sx={{ fontSize: 14 }} /> Cancel Retainer
                        </button>
                        <span className={`ml-auto text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          retainer.status === "active" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                        }`}>
                          {retainer.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted mb-4">Setup recurring retainer payments for this project.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Contract Title</label>
                          <input
                            value={newRetainerTitle}
                            onChange={e => setNewRetainerTitle(e.target.value)}
                            placeholder="e.g. Monthly Support Agreement"
                            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Amount / Rate ({project.currency})</label>
                          <input
                            type="number"
                            value={newRetainerAmount}
                            onChange={e => setNewRetainerAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            placeholder="0.00"
                            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Billing Frequency</label>
                          <select
                            value={newRetainerFrequency}
                            onChange={e => setNewRetainerFrequency(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Start Date</label>
                          <input
                            type="date"
                            value={newRetainerStartDate}
                            onChange={e => setNewRetainerStartDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                          />
                        </div>
                      </div>
                      <button
                        onClick={createRetainer}
                        disabled={!newRetainerTitle || !newRetainerAmount || !newRetainerStartDate}
                        className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors mt-2 cursor-pointer"
                      >
                        Activate Retainer Agreement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Fixed Price Milestones Section */}
              {project.billingType === "fixed" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">Billing Milestones</h3>
                    <span className="text-xs font-mono font-bold text-muted">
                      Total: {project.currency} {milestones.reduce((s, m) => s + m.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {project.budget && ` / ${project.currency} ${project.budget.toLocaleString()} budget`}
                    </span>
                  </div>

                  <div className="bg-surface rounded-3xl p-4 space-y-4">
                    {/* Add Milestone Form */}
                    <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-3xl shadow-md">
                      <div className="col-span-2">
                        <input
                          value={newMilestoneTitle}
                          onChange={e => setNewMilestoneTitle(e.target.value)}
                          placeholder="Milestone Title (e.g. Initial Deposit, MVP Delivery)"
                          className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-3xl outline-none focus:ring-2 focus:ring-primary-tint"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newMilestoneAmount}
                          onChange={e => {
                            setNewMilestoneAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
                            if (project.budget && e.target.value !== "") {
                              const pct = (parseFloat(e.target.value) / project.budget) * 100
                              setNewMilestonePercentage(parseFloat(pct.toFixed(1)))
                            }
                          }}
                          placeholder={`Amount (${project.currency})`}
                          className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-3xl outline-none focus:ring-2 focus:ring-primary-tint"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={newMilestoneDueDate}
                          onChange={e => setNewMilestoneDueDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-3xl outline-none focus:ring-2 focus:ring-primary-tint text-muted"
                        />
                      </div>
                      <div className="col-span-4 flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newMilestonePercentage}
                            onChange={e => {
                              setNewMilestonePercentage(e.target.value === "" ? "" : parseFloat(e.target.value))
                              if (project.budget && e.target.value !== "") {
                                const amt = (parseFloat(e.target.value) / 100) * project.budget
                                setNewMilestoneAmount(parseFloat(amt.toFixed(2)))
                              }
                            }}
                            placeholder="Split %"
                            className="w-16 px-2 py-1 text-[10px] bg-surface border border-border rounded-3xl outline-none focus:ring-2 focus:ring-primary-tint"
                          />
                          <span className="text-[10px] text-muted font-medium">Split of project budget</span>
                        </div>
                        <button
                          onClick={addMilestone}
                          disabled={!newMilestoneTitle || !newMilestoneAmount}
                          className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Add Milestone
                        </button>
                      </div>
                    </div>

                    {/* Milestones List */}
                    {milestones.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted italic">No milestones defined yet.</p>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMilestoneDragEnd}>
                        <SortableContext items={milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {milestones.map(m => (
                              <MilestoneRow
                                key={m.id}
                                milestone={m}
                                onInvoice={invoiceMilestone}
                                onDelete={deleteMilestone}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              )}

              {/* Invoices List */}
              <div>
                <h3 className="text-base font-bold text-foreground mb-3">Invoices & Quotes</h3>
                {project.documents.length === 0 ? (
                  <p className="p-6 text-xs text-muted rounded-3xl text-center italic bg-surface">
                    No documents generated yet. Use the milestones builder or panel to create documents.
                  </p>
                ) : (
                  <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface">
                          <th className="text-left text-[10px] uppercase font-bold text-muted tracking-wider px-5 py-3">Number</th>
                          <th className="text-left text-[10px] uppercase font-bold text-muted tracking-wider px-4 py-3">Type</th>
                          <th className="text-left text-[10px] uppercase font-bold text-muted tracking-wider px-4 py-3">Status</th>
                          <th className="text-left text-[10px] uppercase font-bold text-muted tracking-wider px-4 py-3">Total</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {project.documents.map(doc => (
                          <tr key={doc.id} className="hover:bg-surface transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-xs font-mono font-medium text-foreground">{doc.number}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted capitalize">{doc.type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full capitalize ${DOC_STATUS_COLORS[doc.status] ?? "bg-neutral-bg text-muted"}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-foreground font-mono">{doc.currency} {docTotal(doc).toFixed(2)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Link href="/invoices" className="text-xs font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1">
                                <OpenInNew sx={{ fontSize: 13 }} /> View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Contracts Tab ──────────────────────────────────────────────── */}
          {activeTab === "contracts" && (
            <div className="space-y-6">
              {contracts.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-md p-6">
                  <h3 className="text-base font-bold text-foreground mb-4">Draft New Project Contract</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Use Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={e => applyTemplate(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                      >
                        <option value="">Choose a standard template</option>
                        <option value="web_dev">Web Development Agreement</option>
                        <option value="web_design">UI/UX Design Agreement</option>
                        <option value="retainer">Maintenance & Support Retainer Agreement</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Contract Title</label>
                      <input
                        value={newContractTitle}
                        onChange={e => setNewContractTitle(e.target.value)}
                        placeholder="e.g. Software Services Agreement"
                        className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Agreement Text</label>
                      <textarea
                        value={newContractContent}
                        onChange={e => setNewContractContent(e.target.value)}
                        rows={12}
                        placeholder="Write or copy-paste contract content here..."
                        className="w-full mt-1 px-3 py-3 bg-surface border border-border rounded-3xl text-sm outline-none font-sans leading-relaxed resize-y focus:ring-2 focus:ring-primary-tint"
                      />
                    </div>
                    <button
                      onClick={createContract}
                      disabled={!newContractTitle.trim() || !newContractContent.trim()}
                      className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Save Contract Draft
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {contracts.map(contract => (
                    <div key={contract.id} className="bg-white rounded-3xl shadow-md p-6">
                      {editingContractId === contract.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Contract Title</label>
                            <input
                              value={newContractTitle}
                              onChange={e => setNewContractTitle(e.target.value)}
                              className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-primary-tint"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted uppercase font-bold tracking-wider">Agreement Text</label>
                            <textarea
                              value={newContractContent}
                              onChange={e => setNewContractContent(e.target.value)}
                              rows={12}
                              className="w-full mt-1 px-3 py-3 bg-surface border border-border rounded-3xl text-sm outline-none font-sans leading-relaxed resize-y focus:ring-2 focus:ring-primary-tint"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateContractContent(contract.id, newContractTitle, newContractContent)}
                              className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                            >
                              <Save sx={{ fontSize: 14 }} /> Save
                            </button>
                            <button
                              onClick={() => setEditingContractId(null)}
                              className="px-4 py-2 bg-surface rounded-full text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-base font-bold text-foreground">{contract.title}</h3>
                              <p className="text-[10px] text-muted mt-0.5">Created on {fmt(contract.createdAt)}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              contract.status === "signed" ? "bg-success-bg text-success" :
                              contract.status === "sent" ? "bg-info-bg text-info" : "bg-neutral-bg text-muted"
                            }`}>
                              {contract.status}
                            </span>
                          </div>

                          <div className="bg-surface rounded-3xl p-4 max-h-60 overflow-y-auto text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap">
                            {contract.content}
                          </div>

                          {contract.status === "signed" && (
                            <div className="bg-success-bg rounded-3xl p-4 text-xs text-success space-y-1">
                              <p className="font-semibold flex items-center gap-1"><CheckCircle sx={{ fontSize: 14 }} /> Contract Signed Digitally</p>
                              <p><strong>Signed by:</strong> {contract.signatureName} ({contract.signatureEmail})</p>
                              <p><strong>Date signed:</strong> {fmt(contract.signedAt)}</p>
                              <p><strong>Signing IP:</strong> {contract.signatureIp}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {contract.status === "draft" && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingContractId(contract.id)
                                    setNewContractTitle(contract.title)
                                    setNewContractContent(contract.content)
                                  }}
                                  className="flex items-center gap-1 px-4 py-2 bg-surface rounded-full text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Edit sx={{ fontSize: 14 }} /> Edit Content
                                </button>
                                <button
                                  onClick={() => sendContract(contract.id)}
                                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                                >
                                  <Send sx={{ fontSize: 14 }} /> Send signature request
                                </button>
                              </>
                            )}

                            {contract.status === "sent" && (
                              <>
                                <button
                                  onClick={() => sendContract(contract.id)}
                                  className="flex items-center gap-1 px-4 py-2 bg-surface rounded-full text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Send sx={{ fontSize: 14 }} /> Resend signature request
                                </button>
                                <button
                                  onClick={() => {
                                    const link = `${window.location.origin.replace(":3001", ":3000")}/portal?contract=${contract.token}`
                                    navigator.clipboard.writeText(link)
                                    alert("Link copied to clipboard!")
                                  }}
                                  className="px-4 py-2 bg-surface rounded-full text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                                >
                                  Copy signing link
                                </button>
                              </>
                            )}

                            {contract.status !== "signed" && (
                              <button
                                onClick={() => deleteContract(contract.id)}
                                className="flex items-center gap-1 px-4 py-2 bg-danger-bg rounded-full text-xs font-semibold text-danger transition-colors ml-auto cursor-pointer"
                              >
                                <Delete sx={{ fontSize: 14 }} /> Delete Contract
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Project Chat Tab ───────────────────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="bg-white rounded-3xl shadow-md flex flex-col h-[550px] overflow-hidden">
              <div className="bg-surface px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Project Workspace Chat</h3>
                  <p className="text-[10px] text-muted mt-0.5">Communication with {project.client?.company ?? project.client?.name ?? "Client"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  <span className="text-[10px] font-semibold text-muted">Active</span>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-surface">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted">
                    <Chat sx={{ fontSize: 40 }} />
                    <p className="text-xs font-medium mt-2">No messages in project chat yet.</p>
                    <p className="text-[10px] mt-1 max-w-[280px]">Send a greeting message or files to initiate conversation with your client.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isDev = msg.senderRole === "developer"
                    return (
                      <div key={msg.id} className={`flex flex-col ${isDev ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-foreground">{msg.senderName}</span>
                          <span className="text-[9px] text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-md p-3 rounded-3xl text-xs leading-relaxed ${
                          isDev 
                            ? "bg-foreground text-white rounded-tr-none"
                            : "bg-surface text-foreground rounded-tl-none"
                        }`}>
                          <p className="white-space-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <div className="p-4 bg-white flex items-center gap-2">
                <input
                  value={newMessageContent}
                  onChange={e => setNewMessageContent(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message to the client"
                  className="flex-1 px-4 py-2 bg-surface border border-border rounded-3xl text-xs outline-none focus:ring-2 focus:ring-primary-tint"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessageContent.trim() || sendingMessage}
                  className="p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Send sx={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Properties panel ──────────────────────────────────────────── */}
        <div className="w-72 shrink-0 space-y-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">Properties</p>

          {/* Status */}
          <div className="bg-white rounded-3xl shadow-md p-4">
            <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Status</p>
            <Tooltip content={PROJECT_STATUS_TIPS[statusKey] ?? statusKey} side="left">
              <select
                value={statusKey}
                onChange={e => patchProject({ status: e.target.value })}
                className={`text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer ${PROJECT_STATUS_COLORS[statusKey] ?? "bg-neutral-bg text-muted"}`}
              >
                {PROJECT_STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Tooltip>
          </div>

          {/* Client */}
          <div className="bg-white rounded-3xl shadow-md p-4">
            <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Client</p>
            {project.client ? (
              <div>
                <p className="text-sm font-medium text-foreground">{project.client.company ?? project.client.name}</p>
                <a href={`mailto:${project.client.email}`} className="text-xs text-muted hover:text-primary transition-colors">{project.client.email}</a>
              </div>
            ) : (
              <p className="text-sm text-muted italic">No client linked</p>
            )}
          </div>

          {/* Billing */}
          <div className="bg-white rounded-3xl shadow-md p-4">
            <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Billing</p>
            <Tooltip content={BILLING_TIPS[project.billingType] ?? project.billingType} side="left">
              <p className="text-sm font-medium text-foreground cursor-default">{billingLabel[project.billingType] ?? project.billingType}</p>
            </Tooltip>
            {project.budget != null && (
              <p className="text-xs text-muted mt-1">{project.currency} {project.budget.toFixed(2)} budget</p>
            )}
            {project.rate != null && (
              <p className="text-xs text-muted mt-1">{project.currency} {project.rate.toFixed(2)}/hr</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-3xl shadow-md p-4">
            <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Dates</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider">Start</label>
                <input
                  type="date"
                  defaultValue={fmtDate(project.startDate)}
                  onBlur={e => patchProject({ startDate: e.target.value || null })}
                  className="block w-full text-sm text-foreground bg-transparent outline-none rounded-3xl px-1 -mx-1 hover:bg-surface border border-border focus:ring-2 focus:ring-primary-tint transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider">Due</label>
                <input
                  type="date"
                  defaultValue={fmtDate(project.dueDate)}
                  onBlur={e => patchProject({ dueDate: e.target.value || null })}
                  className="block w-full text-sm text-foreground bg-transparent outline-none rounded-3xl px-1 -mx-1 hover:bg-surface border border-border focus:ring-2 focus:ring-primary-tint transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="pt-2 space-y-2">
            <Link
              href={`/invoices/new?new=invoice&project=${project.id}&client=${project.clientId ?? ""}`}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-primary-tint text-primary text-sm font-medium rounded-full transition-colors"
            >
              <RequestQuote sx={{ fontSize: 18 }} /> New Invoice
            </Link>
            <Link
              href={`/invoices/new?new=quote&project=${project.id}&client=${project.clientId ?? ""}`}
              className="flex items-center gap-2 w-full px-4 py-2.5 bg-surface text-foreground text-sm font-medium rounded-full transition-colors"
            >
              <RequestQuote sx={{ fontSize: 18 }} /> New Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
