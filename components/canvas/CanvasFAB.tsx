'use client'

import { useState, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSkillTreeStore } from '@/lib/store'
import type { CanvasView } from '@/types/tree'

export type LayoutDir = 'LR' | 'TB'

interface Props {
  layoutDir: LayoutDir
  onLayoutDirChange: (dir: LayoutDir) => void
  onAutoArrange: () => void
}

const VIEWS: { id: CanvasView; icon: string; label: string }[] = [
  { id: 'worldmap', icon: 'map', label: 'World Map' },
  { id: 'rpg', icon: 'sports_esports', label: 'RPG' },
  { id: 'terminal', icon: 'terminal', label: 'Terminal' },
  { id: 'neural', icon: 'hub', label: 'Neural' },
]

const MENU_VARIANTS = {
  hidden: { opacity: 0, y: 12, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
  exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } },
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: 10 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: 'spring' as const, stiffness: 500, damping: 30 },
  }),
}

export default function CanvasFAB({ layoutDir, onLayoutDirChange, onAutoArrange }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [arranging, setArranging] = useState(false)

  const { fitView } = useReactFlow()
  const canvasView = useSkillTreeStore((s) => s.canvasView)
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
    } catch {
      /* clipboard blocked */
    }
  }, [])

  return (
    <div className="relative flex flex-col items-start gap-3">

      {/* ── Expanded menu ── */}
      <AnimatePresence>
        {true && (
          <motion.div
            key="fab-menu"
            variants={MENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-52 bg-background-dark/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* View Theme */}
            <div className="px-3 pt-3 pb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                View Theme
              </p>
              <div className="grid grid-cols-4 gap-1">
                {VIEWS.map((v, i) => {
                  const active = canvasView === v.id
                  return (
                    <motion.button
                      key={v.id}
                      custom={i}
                      variants={ITEM_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      onClick={() => { setCanvasView(v.id); setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 60) }}
                      title={v.label}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${active
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/10'
                        }`}
                    >
                      <span className="material-symbols-outlined text-lg leading-none">{v.icon}</span>
                      <span className="text-[8px] font-bold leading-none truncate w-full text-center">{v.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="h-px bg-white/5 mx-3" />

            {/* Controls */}
            <div className="px-3 pt-2 pb-3 flex flex-col gap-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">
                Controls
              </p>

              {/* Center view */}
              <motion.button
                custom={4}
                variants={ITEM_VARIANTS}
                initial="hidden"
                animate="visible"
                onClick={handleCenter}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium"
              >
                <span className="material-symbols-outlined text-base text-accent-blue">center_focus_strong</span>
                Center view
              </motion.button>

              {/* Layout direction */}
              <motion.button
                custom={5}
                variants={ITEM_VARIANTS}
                initial="hidden"
                animate="visible"
                onClick={handleLayoutToggle}
                className="flex items-center justify-between gap-2.5 w-full px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-purple-400">
                    {layoutDir === 'LR' ? 'swap_horiz' : 'swap_vert'}
                  </span>
                  Layout direction
                </span>
                <span className="text-[9px] font-black text-slate-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                  {layoutDir}
                </span>
              </motion.button>

              {/* Auto arrange */}
              <motion.button
                custom={6}
                variants={ITEM_VARIANTS}
                initial="hidden"
                animate="visible"
                onClick={() => {
                  setArranging(true)
                  onAutoArrange()
                  setTimeout(() => setArranging(false), 800)
                  setOpen(false)
                }}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl transition-all text-xs font-medium ${arranging
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className={`material-symbols-outlined text-base text-amber-400 ${arranging ? 'animate-spin' : ''}`}>
                  auto_fix_high
                </span>
                {arranging ? 'Arranging…' : 'Auto arrange'}
              </motion.button>

              {/* Share */}
              <motion.button
                custom={7}
                variants={ITEM_VARIANTS}
                initial="hidden"
                animate="visible"
                onClick={handleShare}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl transition-all text-xs font-medium ${copied
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-base text-primary">
                  {copied ? 'check_circle' : 'share'}
                </span>
                {copied ? 'Link copied!' : 'Share tree'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB trigger button ── 
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border transition-all ${open
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-primary border-primary/0 text-background-dark'
          }`}
        style={open ? {} : { boxShadow: '0 0 24px rgba(17,212,82,0.35)' }}
        aria-label="Toggle canvas controls"
      >
        <motion.span
          className="material-symbols-outlined text-xl"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {open ? 'close' : 'tune'}
        </motion.span>
      </motion.button>
      */}
    </div>
  )
}
