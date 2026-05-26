"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ClientPortalDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientData, setClientData] = useState<any>(null)
  
  // Active states
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "billing" | "contracts">("overview")
  const [chatOpen, setChatOpen] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Contract signing state
  const [signingContract, setSigningContract] = useState<any | null>(null)
  const [sigName, setSigName] = useState("")
  const [sigEmail, setSigEmail] = useState("")
  const [signing, setSigning] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/portal/dashboard")
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/portal/login")
          return
        }
        const errData = await res.json()
        throw new Error(errData.error || "Failed to load dashboard data.")
      }
      const data = await res.json()
      setClientData(data)
      
      // Auto-select first project if none selected
      if (data.projects && data.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data.projects[0].id)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Poll messages every 5 seconds when chat is open and a project is selected
  useEffect(() => {
    if (!selectedProjectId) return
    
    // Initial fetch
    fetchMessages()
    
    const interval = setInterval(() => {
      fetchMessages(true) // silent background poll
    }, 5000)
    
    return () => clearInterval(interval)
  }, [selectedProjectId])

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async (silent = false) => {
    if (!selectedProjectId) return
    try {
      const res = await fetch(`/api/portal/projects/${selectedProjectId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      if (!silent) console.error("Error fetching messages:", err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProjectId || sendingMessage) return
    
    setSendingMessage(true)
    const text = newMessage
    setNewMessage("") // optimistic clear
    
    try {
      const res = await fetch(`/api/portal/projects/${selectedProjectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
      } else {
        setNewMessage(text) // restore on error
        const err = await res.json()
        alert(err.error || "Failed to send message.")
      }
    } catch (err) {
      setNewMessage(text)
      console.error(err)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signingContract || !sigName.trim() || !sigEmail.trim() || signing) return
    
    setSigning(true)
    try {
      const res = await fetch(`/api/portal/contracts/${signingContract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureName: sigName, signatureEmail: sigEmail }),
      })
      
      if (res.ok) {
        setSigningContract(null)
        setSigName("")
        setSigEmail("")
        await fetchDashboardData() // refresh dashboard
        alert("Contract successfully signed digitally!")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to sign contract.")
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred. Please try again.")
    } finally {
      setSigning(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/portal/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-mono">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-white/50 tracking-widest uppercase">Loading Client Portal...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 text-center font-sans">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="w-12 h-12 bg-red-950/40 border border-red-800/40 rounded-full flex items-center justify-center text-red-500 text-xl font-bold mx-auto mb-4">
            !
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Access Restrained</h2>
          <p className="text-sm text-white/60 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setError(null); setLoading(true); fetchDashboardData() }}
              className="bg-white text-black hover:bg-neutral-200 py-2 px-5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all"
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className="border border-white/15 hover:bg-white/5 text-white/80 py-2 px-5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { client, projects, documents, contracts, retainers } = clientData || {}
  const activeProject = projects?.find((p: any) => p.id === selectedProjectId)
  
  // Calculate project completeness
  const completedTasks = activeProject?.tasks?.filter((t: any) => t.status === "done").length || 0
  const totalTasks = activeProject?.tasks?.length || 0
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter invoices for current project
  const projectInvoices = documents?.filter((d: any) => d.projectId === selectedProjectId && d.type === "invoice") || []
  
  // Filter contract for current project
  const projectContract = contracts?.find((c: any) => c.projectId === selectedProjectId)

  // Status colors helper
  const getProjectStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      backlog: "bg-stone-900 border-stone-800 text-stone-400",
      todo: "bg-blue-950/30 border-blue-900/50 text-blue-400",
      "in-progress": "bg-amber-950/30 border-amber-900/50 text-amber-400",
      review: "bg-purple-950/30 border-purple-900/50 text-purple-400",
      done: "bg-emerald-950/30 border-emerald-900/50 text-emerald-400",
    }
    return map[status] || "bg-stone-900 text-stone-400"
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-950/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stone-900/20 blur-[180px] pointer-events-none" />

      {/* Portal Top Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-white">[&lt;ondwani</span>
          <span className="text-white/20">·</span>
          <span className="text-xs font-mono tracking-wider uppercase text-white/50">Client Studio Portal</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white/90">{client?.name}</p>
            <p className="text-[10px] font-mono text-white/40">{client?.company || "Independent Client"}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="border border-white/10 hover:border-red-900/50 hover:bg-red-950/10 hover:text-red-400 text-white/70 py-1.5 px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Master Content Pane */}
      <div className="flex-1 flex min-h-0 relative z-10">
        
        {/* Left Project Selector Sidebar (collapses on tiny view) */}
        <aside className="w-64 border-r border-white/5 bg-black/20 flex flex-col shrink-0 overflow-y-auto p-4 hidden md:flex">
          <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-4 px-2 font-mono">
            Active Projects ({projects?.length || 0})
          </h3>
          <div className="space-y-1">
            {projects?.map((proj: any) => (
              <button
                key={proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id)
                  setActiveTab("overview")
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group ${
                  selectedProjectId === proj.id
                    ? "bg-white/[0.04] border-red-900/40 text-white"
                    : "bg-transparent border-transparent text-white/60 hover:bg-white/[0.01] hover:text-white"
                }`}
              >
                <div className="font-semibold text-sm truncate">{proj.title}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold font-mono ${getProjectStatusBadge(proj.status)}`}>
                    {proj.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">
                    {proj.tasks?.length || 0} tasks
                  </span>
                </div>
              </button>
            ))}
            
            {(!projects || projects.length === 0) && (
              <div className="text-xs text-white/40 italic p-2">
                No registered projects found.
              </div>
            )}
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          {activeProject ? (
            <>
              {/* Project Header Row */}
              <div className="px-6 py-5 border-b border-white/5 bg-black/10 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {/* Small Screen Project Switcher Trigger */}
                  <div className="md:hidden mb-2">
                    <select
                      value={selectedProjectId || ""}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value)
                        setActiveTab("overview")
                      }}
                      className="bg-[#121212] border border-white/10 rounded-lg text-xs font-semibold px-2 py-1 focus:outline-none focus:border-red-900/50"
                    >
                      {projects?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                    {activeProject.title}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-mono tracking-wider ${getProjectStatusBadge(activeProject.status)}`}>
                      {activeProject.status.toUpperCase()}
                    </span>
                  </h1>
                  <p className="text-xs text-white/50 mt-1 truncate max-w-xl">
                    {activeProject.description || "No description provided."}
                  </p>
                </div>

                {/* Unified Tab Bar */}
                <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
                  {(["overview", "tasks", "billing", "contracts"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-xs font-medium px-3.5 py-1.5 rounded-lg capitalize transition-all duration-300 font-mono tracking-tight ${
                        activeTab === tab
                          ? "bg-white/[0.06] text-white border-b border-red-700/50"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Display Area */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-6">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Summary Card */}
                    <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                      <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                        Project Execution Progress
                      </h2>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-white/60">Overall Completion Rate</span>
                          <span className="text-red-400 font-mono">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-800 to-red-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-white/30 font-mono pt-1">
                          <span>{completedTasks} completed tasks</span>
                          <span>{totalTasks - completedTasks} remaining</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Start Date</p>
                          <p className="text-sm font-medium mt-1">
                            {activeProject.startDate ? new Date(activeProject.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Estimated Due Date</p>
                          <p className="text-sm font-medium mt-1">
                            {activeProject.dueDate ? new Date(activeProject.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Billing Card */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                          Billing Overview
                        </h2>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Structure</p>
                            <p className="text-sm font-semibold capitalize mt-1">
                              {activeProject.billingType === "fixed" ? "Fixed Pricing split" : "Recurring Retainer contract"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Budget / Rate</p>
                            <p className="text-xl font-black font-mono text-white mt-1">
                              {activeProject.currency} {activeProject.budget?.toLocaleString() || activeProject.rate?.toLocaleString() || "0"}
                              {activeProject.billingType === "retainer" && <span className="text-xs text-white/40 font-normal">/month</span>}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setChatOpen(true)}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all"
                      >
                        Discuss Project
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. TASKS TAB */}
                {activeTab === "tasks" && (
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                      Project Checklist
                    </h2>

                    <div className="space-y-2 mt-4">
                      {activeProject.tasks && activeProject.tasks.length > 0 ? (
                        activeProject.tasks.map((task: any) => (
                          <div
                            key={task.id}
                            className={`flex items-start gap-4 p-3.5 rounded-xl border border-white/[0.02] backdrop-blur-sm transition-all duration-300 ${
                              task.status === "done" ? "bg-black/10 opacity-60" : "bg-white/[0.01]"
                            }`}
                          >
                            <div className="mt-0.5">
                              {task.status === "done" ? (
                                <span className="w-5 h-5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold font-mono">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border border-white/20 text-white/20 flex items-center justify-center text-[10px] font-bold font-mono">
                                  ○
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold truncate ${task.status === "done" ? "line-through text-white/40" : "text-white"}`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-xs text-white/40 mt-1 max-w-2xl whitespace-pre-wrap">{task.description}</p>
                              )}
                            </div>
                            {task.priority && task.status !== "done" && (
                              <span className={`text-[9px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded ${
                                task.priority === "high" ? "bg-red-950/50 border border-red-800/40 text-red-400" :
                                task.priority === "medium" ? "bg-yellow-950/30 border border-yellow-900/30 text-yellow-400" :
                                "bg-stone-900 border border-stone-800 text-stone-400"
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-white/40 italic py-4">No tasks draft or assigned to this project yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. BILLING TAB */}
                {activeTab === "billing" && (
                  <div className="space-y-6">
                    {/* Fixed milestones */}
                    {activeProject.billingType === "fixed" && (
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                        <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                          Billing Milestones & Installments
                        </h2>

                        <div className="space-y-4 mt-4">
                          {activeProject.milestones && activeProject.milestones.length > 0 ? (
                            activeProject.milestones.map((milestone: any) => (
                              <div
                                key={milestone.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] gap-4"
                              >
                                <div className="space-y-1">
                                  <div className="font-semibold text-sm text-white flex items-center gap-2">
                                    {milestone.title}
                                    {milestone.percentage && (
                                      <span className="text-[10px] font-mono text-white/30 font-normal">({milestone.percentage}%)</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-white/40">
                                    Due Date: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end">
                                  <span className="font-mono text-base font-bold text-white">
                                    {activeProject.currency} {milestone.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>

                                  <div className="flex items-center gap-3">
                                    {milestone.status === "paid" ? (
                                      <span className="text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 rounded-full">
                                        PAID
                                      </span>
                                    ) : milestone.status === "invoiced" && milestone.invoice ? (
                                      <a
                                        href={`/i/${milestone.invoice.token}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-800 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg transition-all"
                                      >
                                        PAY NOW
                                      </a>
                                    ) : (
                                      <span className="text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 bg-stone-900 border border-stone-800 text-stone-400 rounded-full">
                                        PENDING
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-white/40 italic py-4">No billing milestones set up for this project.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Retainer Details */}
                    {activeProject.billingType === "retainer" && (
                      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                        <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                          Retainer Billing Details
                        </h2>

                        {retainers?.find((r: any) => r.projectId === selectedProjectId) ? (
                          (() => {
                            const retainer = retainers.find((r: any) => r.projectId === selectedProjectId);
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                                  <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Amount</p>
                                    <p className="text-base font-mono font-bold mt-1">{retainer.currency} {retainer.amount.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Frequency</p>
                                    <p className="text-sm font-semibold capitalize mt-1">{retainer.frequency}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Next billing date</p>
                                    <p className="text-sm font-semibold mt-1">
                                      {new Date(retainer.nextInvoiceAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Status</p>
                                    <span className="inline-block mt-1 text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 uppercase">
                                      {retainer.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          <p className="text-xs text-white/40 italic">No associated retainer contract found.</p>
                        )}
                      </div>
                    )}

                    {/* Shared Project Invoices History */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                      <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                        Invoices History
                      </h2>

                      <div className="space-y-2 mt-4">
                        {projectInvoices.length > 0 ? (
                          projectInvoices.map((inv: any) => (
                            <a
                              key={inv.id}
                              href={`/i/${inv.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:border-white/10 transition-all duration-300 group"
                            >
                              <div>
                                <div className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors">
                                  {inv.number}
                                </div>
                                <div className="text-xs text-white/40 mt-1">
                                  Issued: {new Date(inv.issueDate).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="font-mono text-sm font-semibold">
                                  {inv.currency} {inv.items.reduce((acc: number, item: any) => acc + item.amount, 0).toLocaleString()}
                                </span>

                                <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded ${
                                  inv.status === "paid" ? "bg-emerald-950/30 border border-emerald-900/30 text-emerald-400" :
                                  inv.status === "sent" ? "bg-blue-950/30 border border-blue-900/30 text-blue-400" :
                                  "bg-stone-900 border border-stone-800 text-stone-400"
                                }`}>
                                  {inv.status}
                                </span>
                              </div>
                            </a>
                          ))
                        ) : (
                          <p className="text-xs text-white/40 italic py-2">No invoices history found for this project.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CONTRACTS TAB */}
                {activeTab === "contracts" && (
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h2 className="text-base font-bold tracking-tight mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-red-600 rounded-sm" />
                      Client Agreements & Contracts
                    </h2>

                    {projectContract ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] gap-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm">{projectContract.title}</h4>
                            <p className="text-xs text-white/40">
                              Status:{" "}
                              <span className={`capitalize font-bold ${
                                projectContract.status === "signed" ? "text-emerald-400" : "text-amber-400"
                              }`}>
                                {projectContract.status}
                              </span>
                            </p>
                          </div>
                          
                          {projectContract.status === "signed" ? (
                            <div className="text-right space-y-1">
                              <p className="text-xs text-white/60">Signed digitally by:</p>
                              <p className="text-xs font-mono font-bold text-emerald-400">{projectContract.signatureName}</p>
                              <p className="text-[10px] text-white/30 font-mono">Date: {new Date(projectContract.signedAt).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSigningContract(projectContract)}
                              className="bg-white hover:bg-neutral-200 text-black font-bold text-xs py-2 px-4 rounded-lg transition-all"
                            >
                              REVIEW & SIGN
                            </button>
                          )}
                        </div>

                        {/* Signed receipt block */}
                        {projectContract.status === "signed" && (
                          <div className="border border-white/5 bg-black/20 p-4 rounded-xl text-xs space-y-2">
                            <h5 className="font-mono uppercase tracking-wider text-[10px] font-bold text-white/40">Digital Signature Certificate Details</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-white/60 font-mono">
                              <div><strong>IP:</strong> {projectContract.signatureIp || "—"}</div>
                              <div><strong>Email:</strong> {projectContract.signatureEmail || "—"}</div>
                              <div><strong>Signed On:</strong> {new Date(projectContract.signedAt).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 italic py-4">No associated project contracts have been drafted or linked yet.</p>
                    )}
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">No Active Projects</h2>
              <p className="text-sm text-white/50 max-w-sm">
                You do not have any registered active projects in your studio profile yet. Please contact the administrator.
              </p>
            </div>
          )}

          {/* Collapsible Messaging Drawer Panel Toggle Button */}
          {activeProject && (
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="fixed bottom-6 right-6 md:right-8 z-40 bg-red-800 hover:bg-red-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              {chatOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              )}
            </button>
          )}

          {/* Unified Project Chat drawer panel overlay */}
          {activeProject && chatOpen && (
            <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-96 bg-[#0f0f0f]/95 border-l border-white/5 shadow-2xl flex flex-col backdrop-blur-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div>
                  <h3 className="font-bold text-sm text-white">Project Workspace Chat</h3>
                  <p className="text-[10px] text-white/40 truncate w-60">Discussing: {activeProject.title}</p>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-transparent">
                {messages.length > 0 ? (
                  messages.map((msg: any) => {
                    const isClient = msg.senderRole === "client"
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isClient ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <span className="text-[9px] text-white/30 font-mono mb-1">{msg.senderName}</span>
                        <div
                          className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed border ${
                            isClient
                              ? "bg-red-800 border-red-700/50 text-white rounded-tr-none"
                              : "bg-white/[0.03] border-white/5 text-white/90 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[8px] text-white/20 mt-1 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
                    <p className="text-xs italic">No messages sent yet.</p>
                    <p className="text-[10px] mt-1">Start the thread below to ping the developer.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/40">
                <div className="flex gap-2 bg-[#121212] border border-white/10 rounded-xl p-1.5 focus-within:border-red-950/50 transition-all duration-300">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message Kondwani..."
                    className="flex-1 bg-transparent px-3 text-xs focus:outline-none placeholder-white/30 text-white min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-white text-black hover:bg-neutral-200 py-1.5 px-3 rounded-lg text-[10px] font-bold font-mono transition-all disabled:opacity-30"
                  >
                    SEND
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* 5. DIGITAL SIGNATURE CONTRACT MODAL */}
      {signingContract && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-white truncate">Review & Contract Digital Agreement</h3>
              <button
                onClick={() => setSigningContract(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Document Viewer Box */}
            <div className="flex-1 overflow-y-auto p-6 text-sm text-white/80 font-serif leading-relaxed select-text bg-[#070707] border-b border-white/5">
              <div className="max-w-xl mx-auto space-y-4">
                <h2 className="text-center font-sans font-black text-lg tracking-tight uppercase border-b-2 border-white/10 pb-4 text-white mb-6">
                  {signingContract.title}
                </h2>
                <div className="whitespace-pre-wrap">{signingContract.content}</div>
              </div>
            </div>

            {/* Signature Form */}
            <form onSubmit={handleSignContract} className="p-6 bg-black/40 space-y-4 shrink-0">
              <div className="text-xs text-white/50 font-sans">
                By typing your name and email below, you certify that you have read, agreed to, and authorize this digital contract with a legally binding digital signature.
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 font-mono">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-950/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 font-mono">
                    Legal Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={sigEmail}
                    onChange={(e) => setSigEmail(e.target.value)}
                    placeholder="e.g. john@doe.com"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-950/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSigningContract(null)}
                  className="border border-white/10 hover:bg-white/5 text-white/80 py-2.5 px-4 rounded-xl text-xs font-bold transition-all font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sigName.trim() || !sigEmail.trim() || signing}
                  className="bg-white hover:bg-neutral-200 text-black py-2.5 px-5 rounded-xl text-xs font-bold transition-all font-mono uppercase tracking-wider disabled:opacity-30"
                >
                  {signing ? "Processing Signature..." : "Sign Agreement"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
