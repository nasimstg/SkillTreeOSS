'use client'

import { useState, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useSkillTreeStore } from '@/lib/store'
import type { CanvasView } from '@/types/tree'

export type LayoutDir = 'LR' | 'TB'

interface Props {
  layoutDir: LayoutDir
  onLayoutDirChange: (dir: LayoutDir) => void
  onAutoArrange: () => void
  onResetProgress: () => void
  onRateTree: () => void
  userRating?: number | null
  /** Hide share / rate / reset buttons (used in builder preview) */
  preview?: boolean
}

const VIEWS: { id: CanvasView; icon: string; label: string }[] = [
  { id: 'worldmap', icon: 'map',            label: 'World Map' },
  { id: 'rpg',      icon: 'sports_esports', label: 'RPG'       },
  { id: 'terminal', icon: 'terminal',       label: 'Terminal'  },
  { id: 'neural',   icon: 'hub',            label: 'Neural'    },
]

export default function CanvasFAB({
  layoutDir, onLayoutDirChange, onAutoArrange, onResetProgress, onRateTree, userRating, preview = false,
}: Props) {
  const [copied,    setCopied]    = useState(false)
  const [arranging, setArranging] = useState(false)

  const { fitView } = useReactFlow()
  const canvasView    = useSkillTreeStore((s) => s.canvasView)
  const setCanvasView = useSkillTreeStore((s) => s.setCanvasView)

  const handleCenter = useCallback(() => {
    fitView({ duration: 600, padding: 0.15 })
  }, [fitView])

  const handleLayoutToggle = useCallback(() => {
    const next = layoutDir === 'LR' ? 'TB' : 'LR'
    onLayoutDirChange(next)
    setTimeout(() => fitView({ duration: 600, padding: 0.15 }), 80)
  }, [layoutDir, onLayoutDirChange, fitView])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }, [])

  const handleAutoArrange = useCallback(() => {
    setArranging(true)
    onAutoArrange()
    setTimeout(() => setArranging(false), 800)
  }, [onAutoArrange])

  return (
    <div className="flex items-center gap-0.5 bg-background-dark/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl px-1.5 py-1.5 select-none pointer-events-auto">

      {/* ── View switcher ── */}
      {VIEWS.map((v) => {
        const active = canvasView === v.id
        return (
          <button
            key={v.id}
            onClick={() => { setCanvasView(v.id); setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 60) }}
            title={v.label}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
              transition-all duration-200 border
              ${active
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span className="material-symbols-outlined text-sm leading-none">{v.icon}</span>
            <span className="hidden md:inline leading-none">{v.label}</span>
          </button>
        )
      })}

      {/* ── Divider ── */}
      <div className="h-5 w-px bg-white/10 mx-1 shrink-0" />

      {/* ── Center view ── */}
      <button
        onClick={handleCenter}
        title="Center view"
        className="p-2 rounded-full text-slate-500 hover:text-accent-blue hover:bg-white/5 transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">center_focus_strong</span>
      </button>

      {/* ── Layout direction ── */}
      <button
        onClick={handleLayoutToggle}
        title={`Toggle layout (${layoutDir})`}
        className="p-2 rounded-full text-slate-500 hover:text-purple-400 hover:bg-white/5 transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">
          {layoutDir === 'LR' ? 'swap_horiz' : 'swap_vert'}
        </span>
      </button>

      {/* ── Auto arrange ── */}
      <button
        onClick={handleAutoArrange}
        title="Auto arrange"
        className={`p-2 rounded-full transition-colors ${
          arranging
            ? 'text-amber-400 bg-amber-400/10'
            : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'
        }`}
      >
        <span className={`material-symbols-outlined text-base leading-none ${arranging ? 'animate-spin' : ''}`}>
          auto_fix_high
        </span>
      </button>

      {/* ── Share / Rate / Reset — hidden in builder preview ── */}
      {!preview && (
        <>
          {/* ── Share ── */}
          <button
            onClick={handleShare}
            title={copied ? 'Link copied!' : 'Share tree'}
            className={`p-2 rounded-full transition-colors ${
              copied
                ? 'text-primary bg-primary/10'
                : 'text-slate-500 hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base leading-none">
              {copied ? 'check_circle' : 'share'}
            </span>
          </button>

          {/* ── Rate tree ── */}
          <button
            onClick={onRateTree}
            title={userRating ? `Your rating: ${userRating}/5 — click to change` : 'Rate this tree'}
            className={`p-2 rounded-full transition-colors ${
              userRating
                ? 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
                : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'
            }`}
          >
            <span
              className="material-symbols-outlined text-base leading-none"
              style={{ fontVariationSettings: userRating ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>

          {/* ── Reset progress ── */}
          <button
            onClick={onResetProgress}
            title="Reset progress"
            className="p-2 rounded-full text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">delete_sweep</span>
          </button>
        </>
      )}
    </div>
  )
}
