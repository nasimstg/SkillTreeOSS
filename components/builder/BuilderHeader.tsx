'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useBuilderStore } from '@/lib/builder-store'
import { validateTree, exportTree } from '@/lib/builder-utils'
import { useSkillTreeStore } from '@/lib/store'
import { SubmitModal } from '@/components/builder/SubmitModal'
import { UserMenu } from '@/components/layout/Navbar'

// Spring for the Build ↔ Preview tab bubble — same "liquid" feel as the toolbar
const TAB_SPRING = { type: 'spring' as const, stiffness: 500, damping: 36, mass: 0.85 }

export function BuilderHeader() {
  const meta           = useBuilderStore(s => s.meta)
  const nodes          = useBuilderStore(s => s.nodes)
  const edges          = useBuilderStore(s => s.edges)
  const isDirty        = useBuilderStore(s => s.isDirty)
  const isPreviewMode  = useBuilderStore(s => s.isPreviewMode)
  const setPreviewMode = useBuilderStore(s => s.setPreviewMode)
  const persistDraft   = useBuilderStore(s => s.persistDraft)
  const setShowShortcuts = useBuilderStore(s => s.setShowShortcuts)

  const user = useSkillTreeStore(s => s.user)
  const [showSubmit, setShowSubmit] = useState(false)

  const errors = validateTree(meta, nodes, edges)
  const tree   = exportTree(meta, nodes, edges)

  function handleSaveDraft() {
    persistDraft()
    // TODO: if signed in, also upsert to Supabase tree_drafts
  }

  return (
    <>
      {/* Gradient fade — transparent at bottom so canvas shows through */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,7,18,0.60) 0%, rgba(3,7,18,0.35) 60%, transparent 100%)',
          height: 60,
        }}
      />

      <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5 z-40">

        {/* ── Left — Logo + back ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-7 rounded bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">account_tree</span>
            </div>
            <span className="text-base font-bold tracking-tight text-white hidden sm:block">
              SkillTreeOSS
            </span>
          </Link>
          <div className="w-px h-5 bg-white/10 hidden sm:block" />
          <Link
            href="/explore"
            className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:flex items-center gap-1 text-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Explore
          </Link>
        </div>

        {/* ── Center — Build / Preview tab with liquid bubble ─────────────────── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="flex h-8 p-0.5 rounded-full items-center gap-0.5 relative"
            style={{
              background: 'rgba(8,12,22,0.85)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Build tab */}
            <button
              onClick={() => setPreviewMode(false)}
              className="relative flex items-center gap-1.5 px-4 h-full rounded-full text-sm font-medium z-10 transition-colors duration-150"
              style={{ color: !isPreviewMode ? '#11d452' : '#64748b' }}
              onMouseEnter={e => {
                if (!isPreviewMode) return
                (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
              }}
              onMouseLeave={e => {
                if (!isPreviewMode) return
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              }}
            >
              {/* Liquid bubble for active tab — shared layout animation */}
              {!isPreviewMode && (
                <motion.div
                  layoutId="tabBubble"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(17,212,82,0.10)',
                    border:     '1px solid rgba(17,212,82,0.18)',
                    boxShadow: [
                      'inset 0 1px 0 rgba(255,255,255,0.12)',
                      '0 0 10px rgba(17,212,82,0.08)',
                    ].join(', '),
                  }}
                  transition={TAB_SPRING}
                />
              )}
              <span className="material-symbols-outlined text-[15px]">build</span>
              Build
            </button>

            {/* Preview tab */}
            <button
              onClick={() => setPreviewMode(true)}
              className="relative flex items-center gap-1.5 px-4 h-full rounded-full text-sm font-medium z-10 transition-colors duration-150"
              style={{ color: isPreviewMode ? '#11d452' : '#64748b' }}
              onMouseEnter={e => {
                if (isPreviewMode) return
                (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
              }}
              onMouseLeave={e => {
                if (isPreviewMode) return
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b'
              }}
            >
              {isPreviewMode && (
                <motion.div
                  layoutId="tabBubble"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(17,212,82,0.10)',
                    border:     '1px solid rgba(17,212,82,0.18)',
                    boxShadow: [
                      'inset 0 1px 0 rgba(255,255,255,0.12)',
                      '0 0 10px rgba(17,212,82,0.08)',
                    ].join(', '),
                  }}
                  transition={TAB_SPRING}
                />
              )}
              <span className="material-symbols-outlined text-[15px]">visibility</span>
              Preview
            </button>
          </div>
        </div>

        {/* ── Right — status + actions ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-[180px] justify-end">

          {/* Dirty indicator */}
          {isDirty ? (
            <span className="text-amber-400 text-xs font-medium flex items-center gap-1.5 opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved
            </span>
          ) : (
            <span className="text-slate-600 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Saved
            </span>
          )}

          {/* Help / Shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            title="Shortcuts & guide (?)"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">help_outline</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            className="h-8 px-3.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            Save Draft
          </button>

          {/* Submit PR */}
          <button
            onClick={() => setShowSubmit(true)}
            className="h-8 px-4 rounded-full bg-primary text-black text-sm font-bold shadow-[0_0_15px_rgba(17,212,82,0.3)] hover:shadow-[0_0_22px_rgba(17,212,82,0.5)] hover:bg-primary/90 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">upload_file</span>
            Submit PR
            {errors.length > 0 && (
              <span className="ml-0.5 bg-black/20 rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center">
                {errors.length}
              </span>
            )}
          </button>

          {/* User menu — same dropdown as the main navbar */}
          {user && (
            <>
              <div className="w-px h-5 bg-white/10" />
              <UserMenu user={user} />
            </>
          )}
        </div>
      </header>

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
