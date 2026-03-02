'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  { id: 'worldmap', icon: 'map', label: 'World Map' },
  { id: 'rpg', icon: 'sports_esports', label: 'RPG' },
  { id: 'terminal', icon: 'terminal', label: 'Terminal' },
  { id: 'neural', icon: 'hub', label: 'Neural' },
]

export default function CanvasFAB({
  layoutDir, onLayoutDirChange, onAutoArrange, onResetProgress, onRateTree, userRating, preview = false,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [arranging, setArranging] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { fitView } = useReactFlow()
  const canvasView = useSkillTreeStore((s) => s.canvasView)
  const setCanvasView = useSkillTreeStore((s) => s.setCanvasView)

  const activeView = VIEWS.find(v => v.id === canvasView) ?? VIEWS[0]

  // Close view menu on click outside the whole wrapper
  useEffect(() => {
    if (!viewMenuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [viewMenuOpen])

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
    /*
     * Outer wrapper — `relative` so the dropdown can be positioned above the pill,
     * but NO overflow constraint so the dropdown isn't clipped.
     * Safe-area padding keeps the pill above the system home indicator on iOS.
     */
    <div
      ref={wrapperRef}
      className="relative select-none pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* ── Mobile dropdown — sibling of the pill, NOT inside overflow-x-auto ── */}
      {viewMenuOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-44 rounded-xl overflow-hidden shadow-2xl z-50 md:hidden"
          style={{
            background: 'rgba(8,12,22,0.98)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => {
                setCanvasView(v.id)
                setViewMenuOpen(false)
                setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 60)
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-left transition-colors ${canvasView === v.id
                ? 'text-primary bg-primary/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="material-symbols-outlined text-base leading-none">{v.icon}</span>
              {v.label}
              {canvasView === v.id && (
                <span className="ml-auto material-symbols-outlined text-sm leading-none text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Pill (scrollable safety-net for very narrow screens) ── */}
      <div className="max-w-[calc(100vw-2rem)] overflow-x-auto rounded-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-0.5 bg-background-dark/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl px-1.5 py-1.5 w-max">

          {/* ── Mobile: single dropdown trigger ── */}
          <button
            onClick={() => setViewMenuOpen(v => !v)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-sm leading-none">{activeView.icon}</span>
            <span className="material-symbols-outlined text-[14px] leading-none">
              {viewMenuOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            </span>
          </button>

          {/* ── Desktop: inline view pills ── */}
          {VIEWS.map((v) => {
            const active = canvasView === v.id
            return (
              <button
                key={v.id}
                onClick={() => { setCanvasView(v.id); setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 60) }}
                title={v.label}
                className={`
                  hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                  transition-all duration-200 border
                  ${active
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className="material-symbols-outlined text-sm leading-none">{v.icon}</span>
                <span className="leading-none">{v.label}</span>
              </button>
            )
          })}

          {/* ── Divider ── */}
          <div className="h-5 w-px bg-white/10 mx-1 shrink-0" />

          {/* ── Center view ── */}
          <button
            onClick={handleCenter}
            title="Center view"
            className="p-2.5 rounded-full text-slate-500 hover:text-accent-blue hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">center_focus_strong</span>
          </button>

          {/* ── Layout direction ── */}
          <button
            onClick={handleLayoutToggle}
            title={`Toggle layout (${layoutDir})`}
            className="p-2.5 rounded-full text-slate-500 hover:text-purple-400 hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base leading-none">
              {layoutDir === 'LR' ? 'swap_horiz' : 'swap_vert'}
            </span>
          </button>

          {/* ── Auto arrange ── */}
          <button
            onClick={handleAutoArrange}
            title="Auto arrange"
            className={`p-2.5 rounded-full transition-colors ${arranging
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
              <button
                onClick={handleShare}
                title={copied ? 'Link copied!' : 'Share tree'}
                className={`p-2.5 rounded-full transition-colors ${copied
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-500 hover:text-primary hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {copied ? 'check_circle' : 'share'}
                </span>
              </button>

              <button
                onClick={onRateTree}
                title={userRating ? `Your rating: ${userRating}/5 — click to change` : 'Rate this tree'}
                className={`p-2.5 rounded-full transition-colors ${userRating
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
      </div>
    </div>
  )
}
