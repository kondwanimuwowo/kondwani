"use client"

import { useState, useEffect } from "react"

type Idea = { id: string; title: string; body?: string | null; tags: string[]; createdAt: string }

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", body: "", tags: "" })

  async function load() {
    const res = await fetch("/api/ideas")
    setIdeas(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const method = editId ? "PUT" : "POST"
    const url = editId ? `/api/ideas/${editId}` : "/api/ideas"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, body: form.body || null, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
    })
    setShowForm(false)
    setEditId(null)
    setForm({ title: "", body: "", tags: "" })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this idea?")) return
    await fetch(`/api/ideas/${id}`, { method: "DELETE" })
    load()
  }

  function startEdit(idea: Idea) {
    setForm({ title: idea.title, body: idea.body ?? "", tags: idea.tags.join(", ") })
    setEditId(idea.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Ideas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{ideas.length} ideas captured total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-[#7E1416] text-white px-4 py-2 rounded-lg hover:bg-[#601012] transition-colors"
        >
          Add Idea
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-slate-850 text-base">{editId ? "Edit" : "New"} Idea</h2>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ title: "", body: "", tags: "" }) }}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tags <span className="text-slate-450 font-normal lowercase">(comma separated)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="marketing, design, startup"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7E1416]/20 focus:border-[#7E1416] transition-all font-sans"
                />
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm({ title: "", body: "", tags: "" }) }}
                className="flex-1 border border-slate-200 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#7E1416] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#601012] transition-colors"
              >
                Save Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 px-6 py-16 text-center shadow-sm">
            <p className="text-slate-400">No ideas captured yet. Start brainstorming!</p>
          </div>
        ) : (
          ideas.map(idea => (
            <div key={idea.id} className="bg-white border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
              <div>
                <p className="font-bold text-slate-800 leading-snug tracking-tight text-[15px] mb-2">{idea.title}</p>
                {idea.body && <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 mb-4">{idea.body}</p>}
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {idea.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-50 border border-slate-150 text-slate-500 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100 bg-slate-50/20 -mx-5 -mb-5 px-5 py-3">
                <button onClick={() => startEdit(idea)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Edit</button>
                <button onClick={() => handleDelete(idea.id)} className="text-xs font-semibold text-red-500 hover:text-red-650 transition-colors">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
