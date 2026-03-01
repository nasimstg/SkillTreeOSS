'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBuilderStore } from '@/lib/builder-store'

const CATEGORIES = [
  'Technology', 'Artificial Intelligence', 'Data Science', 'Backend Development',
  'Mobile Development', 'Design', 'DevOps', 'Operations', 'Science', 'Mathematics',
  'Engineering', 'Finance', 'Business', 'Language', 'Arts', 'Fitness', 'Wellness',
  'Personal Development', 'Literature', 'Culinary', 'Security', 'Web Dev',
]

const DIFFICULTIES = [
  { value: 'easy', label: 'BEG', full: 'Beginner' },
  { value: 'medium', label: 'INT', full: 'Intermediate' },
  { value: 'hard', label: 'ADV', full: 'Advanced' },
] as const

const inputBase =
  'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white ' +
  'placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 ' +
  'focus:ring-primary/20 transition-all'

const labelClass = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider'

export function MetadataPanel() {
  const meta = useBuilderStore(s => s.meta)
  const setMeta = useBuilderStore(s => s.setMeta)

  const [collapsed, setCollapsed] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="absolute top-[62px] left-4 w-72 z-20 pointer-events-auto">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/[0.07] bg-background-dark/90 backdrop-blur-xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-4 py-3.5 gap-3 hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="material-symbols-outlined text-[18px] text-primary shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_tree
            </span>
            <div className="min-w-0 text-left">
              <p className={labelClass}>Tree Metadata</p>
              {collapsed && meta.title && (
                <p className="text-xs text-slate-300 font-medium truncate mt-0.5 leading-tight">
                  {meta.title}
                </p>
              )}
            </div>
          </div>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
          >
            expand_more
          </motion.span>
        </button>

        {/* ── Body (animated expand / collapse) ──────────────────────── */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="meta-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 flex flex-col gap-4 border-t border-white/[0.06]">

                {/* Title */}
                <div className="space-y-1.5 pt-3">
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputBase}
                    placeholder="e.g. Frontend Developer"
                    value={meta.title}
                    onChange={e => setMeta({ title: e.target.value })}
                  />
                </div>

                {/* Tree ID */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Tree ID</label>
                  <input
                    className={`${inputBase} font-mono text-xs text-slate-300`}
                    placeholder="frontend-developer"
                    value={meta.treeId}
                    onChange={e =>
                      setMeta({ treeId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                    }
                  />
                </div>

                {/* Category + Difficulty */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Category</label>
                    <select
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer transition-all"
                      value={meta.category}
                      onChange={e => setMeta({ category: e.target.value })}
                    >
                      <option value="">Choose…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Difficulty</label>
                    <div className="flex gap-0.5 bg-black/30 border border-white/10 rounded-lg p-0.5">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d.value}
                          title={d.full}
                          onClick={() => setMeta({ difficulty: d.value })}
                          className={`flex-1 rounded text-[10px] font-bold py-1.5 transition-all ${meta.difficulty === d.value
                              ? 'bg-primary/20 text-primary'
                              : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={`${inputBase} text-xs text-slate-300 resize-none h-[68px] leading-relaxed`}
                    placeholder="A comprehensive roadmap to…"
                    value={meta.description}
                    onChange={e => setMeta({ description: e.target.value })}
                  />
                </div>

                {/* ── Advanced toggle ─────────────────────────────────── */}
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-1.5 w-full text-left text-[11px] font-semibold text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <motion.span
                    animate={{ rotate: showAdvanced ? 90 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="material-symbols-outlined text-sm leading-none"
                  >
                    chevron_right
                  </motion.span>
                  {showAdvanced ? 'Hide' : 'Show'} advanced fields
                </button>

                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      key="advanced"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2.5 pt-1">
                        {/* Icon */}
                        <div className="flex-1 space-y-1.5">
                          <label className={labelClass}>Icon</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-all"
                              placeholder="school"
                              value={meta.icon}
                              onChange={e => setMeta({ icon: e.target.value })}
                            />
                            <span className="material-symbols-outlined text-base text-slate-500 shrink-0">
                              {meta.icon || 'school'}
                            </span>
                          </div>
                        </div>

                        {/* Months */}
                        <div className="w-20 space-y-1.5">
                          <label className={labelClass}>Months</label>
                          <input
                            type="number"
                            min={1}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-all"
                            value={meta.estimatedMonths}
                            onChange={e => setMeta({ estimatedMonths: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
