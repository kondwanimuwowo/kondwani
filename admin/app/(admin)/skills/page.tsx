"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Close } from "@mui/icons-material"
import type { Skill, SkillCategory } from "@/data/skills"
import { apiFetch } from "@/lib/http"
import { toast } from "@/lib/toast"

type SkillLevel = Skill["level"]
type SkillsConfig = { techPills: string[]; skillCategories: SkillCategory[] }

// Icons the portfolio's Skills section knows how to render.
const CATEGORY_ICONS = ["Code", "Storage", "Palette", "Build"] as const
const LEVELS: SkillLevel[] = ["Advanced", "Intermediate", "Learning"]

const inputCls = "px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"

export default function SkillsPage() {
  const { data, isError, refetch, isFetchedAfterMount } = useQuery({
    queryKey: ["skills"],
    queryFn: () => apiFetch<SkillsConfig>("/api/skills"),
    refetchOnMount: "always",
  })

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
        <p className="text-danger font-medium">Couldn&apos;t load skills.</p>
        <button onClick={() => refetch()}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors">
          Retry
        </button>
      </div>
    )
  }

  if (!data || !isFetchedAfterMount) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-neutral-bg rounded-3xl" />
        <div className="bg-white shadow-md rounded-3xl p-6 flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-8 w-20 bg-neutral-bg rounded-full" />)}
        </div>
      </div>
    )
  }

  return <SkillsEditor initial={data} />
}

function SkillsEditor({ initial }: { initial: SkillsConfig }) {
  const queryClient = useQueryClient()
  const [pills, setPills] = useState(initial.techPills)
  const [categories, setCategories] = useState(initial.skillCategories)
  const [saved, setSaved] = useState(initial)
  const [newPill, setNewPill] = useState("")
  const draft: SkillsConfig = { techPills: pills, skillCategories: categories }
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const clean: SkillsConfig = {
        techPills: pills.map(p => p.trim()).filter(Boolean),
        skillCategories: categories
          .map(c => ({ ...c, title: c.title.trim(), skills: c.skills.filter(s => s.name.trim()).map(s => ({ ...s, name: s.name.trim() })) }))
          .filter(c => c.title),
      }
      await apiFetch("/api/skills", { method: "PUT", body: clean, action: "Save" })
      return clean
    },
    onSuccess: clean => {
      queryClient.setQueryData(["skills"], clean)
      setPills(clean.techPills)
      setCategories(clean.skillCategories)
      setSaved(clean)
      toast.success("Skills saved. The portfolio updates within a few minutes.")
    },
    onError: e => toast.error(e.message),
  })

  function addPill() {
    const value = newPill.trim()
    if (!value) return
    if (pills.some(p => p.toLowerCase() === value.toLowerCase())) {
      toast.error(`${value} is already in the list`)
      return
    }
    setPills(p => [...p, value])
    setNewPill("")
  }

  function updateCategory(ci: number, patch: Partial<SkillCategory>) {
    setCategories(cats => cats.map((c, i) => i === ci ? { ...c, ...patch } : c))
  }

  function updateSkill(ci: number, si: number, patch: Partial<Skill>) {
    setCategories(cats => cats.map((c, i) => i === ci
      ? { ...c, skills: c.skills.map((s, j) => j === si ? { ...s, ...patch } : s) }
      : c))
  }

  function addCategory() {
    setCategories(cats => [...cats, { id: `category-${Date.now()}`, title: "New category", icon: "Code", skills: [] }])
  }

  function removeCategory(ci: number) {
    const cat = categories[ci]
    if (cat.skills.length > 0 && !confirm(`Remove "${cat.title}" and its ${cat.skills.length} skills?`)) return
    setCategories(cats => cats.filter((_, i) => i !== ci))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Skills</h1>
          <p className="text-sm text-muted mt-0.5">
            {dirty ? "Unsaved changes" : "Tech pills and skill categories shown on the portfolio"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <button onClick={() => { setPills(saved.techPills); setCategories(saved.skillCategories) }}
              disabled={saveMutation.isPending}
              className="text-sm font-semibold text-muted hover:text-foreground transition-colors disabled:opacity-50">
              Discard
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        <h2 className="font-bold text-foreground tracking-tight text-[15px] mb-4">Tech pills</h2>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {pills.map((pill, i) => (
            <div key={`${pill}-${i}`} className="flex items-center gap-1 bg-surface rounded-full pl-3 pr-1 py-1">
              <span className="text-xs font-semibold text-foreground">{pill}</span>
              <button onClick={() => setPills(p => p.filter((_, j) => j !== i))} aria-label={`Remove ${pill}`}
                className="w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-danger transition-colors">
                <Close sx={{ fontSize: 12 }} />
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
            className={`flex-1 ${inputCls}`}
          />
          <button onClick={addPill}
            className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors">
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat, ci) => (
          <div key={cat.id} className="bg-white shadow-md rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                value={cat.title}
                onChange={e => updateCategory(ci, { title: e.target.value })}
                aria-label="Category title"
                className="flex-1 font-bold text-foreground tracking-tight text-[15px] bg-transparent focus:outline-none"
              />
              <select value={cat.icon} onChange={e => updateCategory(ci, { icon: e.target.value })}
                aria-label="Category icon" className={`${inputCls} text-xs font-semibold`}>
                {CATEGORY_ICONS.map(icon => <option key={icon} value={icon}>{icon} icon</option>)}
              </select>
              <button onClick={() => removeCategory(ci)}
                className="text-xs font-semibold text-danger transition-colors">
                Remove
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {cat.skills.map((skill, si) => (
                <div key={si} className="flex items-center gap-3">
                  <input
                    value={skill.name}
                    onChange={e => updateSkill(ci, si, { name: e.target.value })}
                    placeholder="Skill name"
                    className={`flex-1 ${inputCls}`}
                  />
                  <select
                    value={skill.level}
                    onChange={e => updateSkill(ci, si, { level: e.target.value as SkillLevel })}
                    className={`${inputCls} font-semibold text-foreground`}
                  >
                    {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <button onClick={() => updateCategory(ci, { skills: cat.skills.filter((_, j) => j !== si) })}
                    aria-label={`Remove ${skill.name || "skill"}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-danger transition-colors">
                    <Close sx={{ fontSize: 16 }} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => updateCategory(ci, { skills: [...cat.skills, { name: "", level: "Intermediate" }] })}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              + Add skill
            </button>
          </div>
        ))}
        <button onClick={addCategory}
          className="w-full py-4 rounded-3xl bg-white shadow-md text-sm font-semibold text-muted hover:text-foreground transition-colors">
          + Add category
        </button>
      </div>
    </div>
  )
}
