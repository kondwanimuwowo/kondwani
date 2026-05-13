"use client"

import { useState, useEffect } from "react"
import { skillCategories, techPills } from "@/data/skills"

type SkillLevel = "Advanced" | "Intermediate" | "Learning"
type Skill = { name: string; level: SkillLevel }
type Category = { id: string; title: string; icon: string; skills: Skill[] }

export default function SkillsPage() {
  const [pills, setPills] = useState<string[] | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [newPill, setNewPill] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/skills").then(r => r.json()).then(d => {
      setPills(d.techPills ?? techPills)
      setCategories(d.skillCategories ?? skillCategories)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch("/api/skills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ techPills: pills, skillCategories: categories }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addPill() {
    if (!newPill.trim()) return
    setPills(p => [...(p ?? []), newPill.trim()])
    setNewPill("")
  }

  function removePill(index: number) {
    setPills(p => (p ?? []).filter((_, i) => i !== index))
  }

  function addSkill(catIndex: number) {
    setCategories(cats => (cats ?? []).map((cat, i) =>
      i === catIndex ? { ...cat, skills: [...cat.skills, { name: "", level: "Intermediate" as SkillLevel }] } : cat
    ))
  }

  function updateSkill(catIndex: number, skillIndex: number, field: keyof Skill, value: string) {
    setCategories(cats => (cats ?? []).map((cat, ci) =>
      ci === catIndex ? {
        ...cat,
        skills: cat.skills.map((s, si) => si === skillIndex ? { ...s, [field]: value } : s)
      } : cat
    ))
  }

  function removeSkill(catIndex: number, skillIndex: number) {
    setCategories(cats => (cats ?? []).map((cat, ci) =>
      ci === catIndex ? { ...cat, skills: cat.skills.filter((_, si) => si !== skillIndex) } : cat
    ))
  }

  if (!pills || !categories) {
    return (
      <div className="p-8">
        <div className="h-8 w-32 bg-border rounded-lg animate-pulse mb-8" />
        <div className="bg-white rounded-2xl border border-border p-6 mb-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-surface rounded-lg animate-pulse" />)}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-6 mb-4 space-y-2">
            {[...Array(3)].map((_, j) => <div key={j} className="h-9 bg-surface rounded-lg animate-pulse" />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Skills</h1>
          <p className="text-sm text-muted">Manage tech pills and skill categories</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-60">
          {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {/* Tech pills */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Tech Pills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {pills.map((pill, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5">
              <span className="text-sm text-foreground">{pill}</span>
              <button onClick={() => removePill(i)} className="text-muted hover:text-red-500 transition-colors text-sm leading-none">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newPill} onChange={e => setNewPill(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPill() } }}
            placeholder="Add technology…"
            className="flex-1 px-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors" />
          <button onClick={addPill}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">Add</button>
        </div>
      </div>

      {/* Skill categories */}
      <div className="space-y-4">
        {categories.map((cat, ci) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">{cat.title}</h3>
            <div className="space-y-2 mb-3">
              {cat.skills.map((skill, si) => (
                <div key={si} className="flex items-center gap-3">
                  <input value={skill.name} onChange={e => updateSkill(ci, si, "name", e.target.value)}
                    placeholder="Skill name"
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                  <button onClick={() => removeSkill(ci, si)} className="text-muted hover:text-red-500 transition-colors text-sm p-1">&times;</button>
                </div>
              ))}
            </div>
            <button onClick={() => addSkill(ci)}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
              + Add skill
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
