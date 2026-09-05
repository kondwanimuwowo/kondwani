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
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-neutral-bg rounded-3xl" />
            <div className="h-4 w-48 bg-neutral-bg rounded-3xl" />
          </div>
          <div className="h-10 w-32 bg-neutral-bg rounded-full" />
        </div>
        <div className="bg-white shadow-md rounded-3xl p-6 space-y-4">
          <div className="h-5 w-24 bg-neutral-bg rounded-3xl" />
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-8 w-20 bg-neutral-bg rounded-full" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Skills</h1>
          <p className="text-sm text-muted mt-0.5">Manage tech pills and skill categories</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>
      </div>

      {/* Tech pills */}
      <div className="bg-white shadow-md rounded-3xl p-6">
        <h2 className="font-bold text-foreground tracking-tight text-[15px] mb-4">Tech Pills</h2>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {pills.map((pill, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-surface rounded-full px-2.5 py-1"
            >
              <span className="text-xs font-semibold text-foreground">{pill}</span>
              <button
                onClick={() => removePill(i)}
                className="text-muted hover:text-danger transition-colors text-sm leading-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <input
            value={newPill}
            onChange={e => setNewPill(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPill() } }}
            placeholder="Add technology"
            className="flex-1 px-3 py-2 bg-surface rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
          />
          <button
            onClick={addPill}
            className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Skill categories */}
      <div className="space-y-4">
        {categories.map((cat, ci) => (
          <div key={cat.id} className="bg-white shadow-md rounded-3xl p-6">
            <h3 className="font-bold text-foreground tracking-tight text-[15px] mb-4">{cat.title}</h3>
            <div className="space-y-3 mb-4">
              {cat.skills.map((skill, si) => (
                <div key={si} className="flex items-center gap-3">
                  <input
                    value={skill.name}
                    onChange={e => updateSkill(ci, si, "name", e.target.value)}
                    placeholder="Skill name"
                    className="flex-1 px-3 py-2 bg-surface rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
                  />
                  <select
                    value={skill.level}
                    onChange={e => updateSkill(ci, si, "level", e.target.value as SkillLevel)}
                    className="px-3 py-2 bg-surface rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-semibold text-foreground"
                  >
                    <option value="Advanced">Advanced</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Learning">Learning</option>
                  </select>
                  <button
                    onClick={() => removeSkill(ci, si)}
                    className="text-muted hover:text-danger transition-colors text-base p-1 leading-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addSkill(ci)}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5"
            >
              + Add skill
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
