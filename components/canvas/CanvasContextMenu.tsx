'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSkillTreeStore } from '@/lib/store'
import type { CanvasView, TreeNode } from '@/types/tree'
import type { LayoutDir } from './CanvasFAB'

// ─── public type (consumed by SkillCanvas) ───────────────────────────────────

export type ContextMenuState =
  | { type: 'canvas'; x: number; y: number }
  | { type: 'node';   x: number; y: number; node: TreeNode }

// ─── static data ─────────────────────────────────────────────────────────────

const VIEWS: { id: CanvasView; icon: string; label: string }[] = [
  { id: 'worldmap', icon: 'map',            label: 'World Map' },
  { id: 'rpg',      icon: 'sports_esports', label: 'RPG'       },
  { id: 'terminal', icon: 'terminal',       label: 'Terminal'  },
  { id: 'neural',   icon: 'hub',            label: 'Neural'    },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Clamp the menu so it never overflows the viewport */
function clampPos(x: number, y: number, w: number, h: number) {
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  return {
    left: Math.min(x, vw - w - 8),
    top:  Math.min(y, vh - h - 8),
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-white/5 mx-2 my-0.5" />
}

function MenuItem({
  icon,
  iconColor = 'text-slate-400',
  label,
  badge,
  disabled,
  active,
  onClick,
}: {
  icon: string
  iconColor?: string
  label: string
  badge?: string
  disabled?: boolean
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between gap-2.5 w-full px-2.5 py-[7px] rounded-lg text-xs font-medium
        transition-colors disabled:opacity-30 disabled:cursor-not-allowed
        ${active ? 'text-primary bg-primary/10' : 'text-slate-200 hover:text-white hover:bg-white/[0.06] disabled:hover:bg-transparent'}`}
    >
      <span className="flex items-center gap-2.5 truncate">
        <span className={`material-symbols-outlined text-[15px] shrink-0 ${active ? 'text-primary' : iconColor}`}>
          {icon}
        </span>
        {label}
      </span>
      {badge && (
        <span className="text-[9px] font-black text-slate-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 shrink-0">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  menu: ContextMenuState
  layoutDir: LayoutDir
  treeId: string
  onClose: () => void
  onFitView: () => void
  onLayoutToggle: () => void
  onAutoArrange: () => void
}

export default function CanvasContextMenu({
  menu,
  layoutDir,
  treeId,
  onClose,
  onFitView,
  onLayoutToggle,
  onAutoArrange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const {
    canvasView,
    setCanvasView,
    completedNodeIds,
    completeNode,
    uncompleteNode,
  } = useSkillTreeStore()

  // ── close on outside mousedown (capture phase so it runs before RF) ────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [onClose])

  // ── close on Escape / scroll ───────────────────────────────────────────────
  useEffect(() => {
    const onKey    = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onScroll = () => onClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel',   onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel',   onScroll)
    }
  }, [onClose])

  // ── share / copy ───────────────────────────────────────────────────────────
  const handleCopy = async (suffix = '') => {
    try {
      const base = window.location.href.split('?')[0]
      await navigator.clipboard.writeText(suffix ? `${base}?node=${suffix}` : window.location.href)
      setCopied(true)
      setTimeout(() => { setCopied(false); onClose() }, 1400)
    } catch {
      onClose()
    }
  }

  // ── layout ─────────────────────────────────────────────────────────────────
  const isNode     = menu.type === 'node'
  const menuH      = isNode ? 190 : 286
  const { left, top } = clampPos(menu.x, menu.y, 208, menuH)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.93, y: -6 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      transition={{ type: 'spring' as const, stiffness: 520, damping: 30 }}
      className="fixed z-[200] w-52 bg-background-dark/96 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* ── NODE context menu ─────────────────────────────────────────────── */}
      {isNode && (() => {
        const { node } = menu as { type: 'node'; x: number; y: number; node: TreeNode }
        const isDone      = completedNodeIds.includes(node.id)
        const isAvailable = node.requires.every(r => completedNodeIds.includes(r))
        return (
          <>
            {/* Node header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-slate-400">{node.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate leading-snug">{node.label}</p>
                <p className={`text-[9px] font-semibold leading-none mt-0.5 ${
                  isDone ? 'text-primary' : isAvailable ? 'text-accent-blue' : 'text-slate-500'
                }`}>
                  {isDone ? 'Completed' : isAvailable ? 'Available' : 'Locked'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5 space-y-0.5">
              <MenuItem
                icon="open_in_new"
                iconColor="text-accent-blue"
                label="View Details"
                onClick={() => {
                  useSkillTreeStore.getState().setSelectedNode(node)
                  onClose()
                }}
              />
              {isDone ? (
                <MenuItem
                  icon="undo"
                  iconColor="text-slate-400"
                  label="Undo Completion"
                  onClick={() => { uncompleteNode(node.id); onClose() }}
                />
              ) : (
                <MenuItem
                  icon="check_circle"
                  iconColor="text-primary"
                  label="Mark as Completed"
                  disabled={!isAvailable}
                  onClick={() => { completeNode(node.id, treeId); onClose() }}
                />
              )}
            </div>

            <Divider />

            <div className="p-1.5">
              <MenuItem
                icon={copied ? 'check_circle' : 'link'}
                iconColor="text-primary"
                label={copied ? 'Link copied!' : 'Copy node link'}
                active={copied}
                onClick={() => handleCopy(node.id)}
              />
            </div>
          </>
        )
      })()}

      {/* ── CANVAS context menu ───────────────────────────────────────────── */}
      {!isNode && (
        <>
          {/* Fit to screen */}
          <div className="p-1.5">
            <MenuItem
              icon="center_focus_strong"
              iconColor="text-accent-blue"
              label="Fit to Screen"
              onClick={() => { onFitView(); onClose() }}
            />
          </div>

          <Divider />

          {/* View Theme */}
          <div className="px-2 pt-2 pb-1.5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1 mb-1.5">
              View Theme
            </p>
            <div className="grid grid-cols-4 gap-1">
              {VIEWS.map((v) => {
                const active = canvasView === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => { setCanvasView(v.id); onClose() }}
                    title={v.label}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] leading-none">{v.icon}</span>
                    <span className="text-[7px] font-bold leading-none truncate w-full text-center">
                      {v.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* Layout + Auto arrange + Share */}
          <div className="p-1.5 space-y-0.5">
            <MenuItem
              icon={layoutDir === 'LR' ? 'swap_horiz' : 'swap_vert'}
              iconColor="text-purple-400"
              label="Layout direction"
              badge={layoutDir}
              onClick={() => { onLayoutToggle(); onClose() }}
            />
            <MenuItem
              icon="auto_fix_high"
              iconColor="text-amber-400"
              label="Auto arrange"
              onClick={() => { onAutoArrange(); onClose() }}
            />
            <MenuItem
              icon={copied ? 'check_circle' : 'share'}
              iconColor="text-primary"
              label={copied ? 'Link copied!' : 'Copy share link'}
              active={copied}
              onClick={() => handleCopy()}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
