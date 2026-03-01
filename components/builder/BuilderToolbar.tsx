'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/lib/builder-store'
import { validateTree, exportTree } from '@/lib/builder-utils'
import { SubmitModal } from '@/components/builder/SubmitModal'

const DIFFICULTIES = [
  { value: 'easy',   label: 'Beginner',     color: '#22c55e' },
  { value: 'medium', label: 'Intermediate', color: '#f59e0b' },
  { value: 'hard',   label: 'Advanced',     color: '#ef4444' },
] as const

const CATEGORIES = [
  'Technology', 'Artificial Intelligence', 'Data Science', 'Backend Development',
  'Mobile Development', 'Design', 'DevOps', 'Operations', 'Science', 'Mathematics',
  'Engineering', 'Finance', 'Business', 'Language', 'Arts', 'Fitness', 'Wellness',
  'Personal Development', 'Literature', 'Culinary', 'Security',
]

export function BuilderToolbar() {
  const meta         = useBuilderStore(s => s.meta)
  const nodes        = useBuilderStore(s => s.nodes)
  const edges        = useBuilderStore(s => s.edges)
  const setMeta      = useBuilderStore(s => s.setMeta)
  const isPreviewMode = useBuilderStore(s => s.isPreviewMode)
  const setPreviewMode = useBuilderStore(s => s.setPreviewMode)
  const isDirty      = useBuilderStore(s => s.isDirty)

  const [showSubmit, setShowSubmit]   = useState(false)
  const [metaExpanded, setMetaExpanded] = useState(true)

  const errors = validateTree(meta, nodes, edges)
  const tree   = exportTree(meta, nodes, edges)

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 h-12">
          {/* Expand/collapse metadata */}
          <button
            onClick={() => setMetaExpanded(!metaExpanded)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Toggle metadata panel"
          >
            <span className="material-symbols-outlined text-base">
              {metaExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Tree ID badge */}
          <span className="text-xs font-mono text-slate-500 bg-white/5 rounded px-2 py-0.5">
            {meta.treeId || 'new-tree'}
          </span>

          <div className="h-4 w-px bg-white/10" />

          {/* Build / Preview tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                !isPreviewMode
                  ? 'bg-primary/15 text-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">build</span>
              Build
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                isPreviewMode
                  ? 'bg-primary/15 text-primary'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">visibility</span>
              Preview
            </button>
          </div>

          <div className="flex-1" />

          {/* Node count */}
          <span className="text-xs text-slate-500">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </span>

          {/* Save indicator */}
          {isDirty ? (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">circle</span>
              Unsaved
            </span>
          ) : (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Saved
            </span>
          )}

          {/* Submit button */}
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-semibold hover:bg-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            Submit Tree
            {errors.length > 0 && (
              <span className="ml-0.5 bg-black/30 rounded-full px-1.5 text-xs">
                {errors.length}
              </span>
            )}
          </button>
        </div>

        {/* Metadata expansion */}
        {metaExpanded && (
          <div className="border-t border-white/10 px-4 py-2 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Tree ID *</label>
              <input
                className="input-sm w-40"
                placeholder="my-skill-tree"
                value={meta.treeId}
                onChange={e => setMeta({ treeId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Title *</label>
              <input
                className="input-sm w-48"
                placeholder="My Skill Tree"
                value={meta.title}
                onChange={e => setMeta({ title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Category *</label>
              <select
                className="input-sm w-36"
                value={meta.category}
                onChange={e => setMeta({ category: e.target.value })}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Difficulty</label>
              <select
                className="input-sm w-32"
                value={meta.difficulty}
                onChange={e => setMeta({ difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Est. months</label>
              <input
                className="input-sm w-24"
                type="number"
                min={1}
                step={1}
                value={meta.estimatedMonths}
                onChange={e => setMeta({ estimatedMonths: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-slate-500">Icon</label>
              <div className="flex items-center gap-1">
                <input
                  className="input-sm w-28"
                  placeholder="school"
                  value={meta.icon}
                  onChange={e => setMeta({ icon: e.target.value })}
                />
                <span className="material-symbols-outlined text-base text-slate-400">
                  {meta.icon || 'school'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs text-slate-500">Description *</label>
              <input
                className="input-sm w-full"
                placeholder="Short description of what this tree teaches"
                value={meta.description}
                onChange={e => setMeta({ description: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitModal
          tree={tree}
          errors={errors}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </>
  )
}
