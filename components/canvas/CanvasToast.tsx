'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export interface ToastItem {
  id: string
  type: 'complete' | 'unlock' | 'levelup' | 'reset'
  title: string
  body: string
  duration?: number
}

const CONFIG: Record<
  ToastItem['type'],
  { icon: string; iconColor: string; bar: string }
> = {
  complete: { icon: 'check_circle',       iconColor: 'text-primary',    bar: 'bg-primary' },
  unlock:   { icon: 'lock_open',          iconColor: 'text-blue-400',   bar: 'bg-blue-400' },
  levelup:  { icon: 'workspace_premium',  iconColor: 'text-yellow-400', bar: 'bg-yellow-400' },
  reset:    { icon: 'undo',               iconColor: 'text-slate-500',  bar: 'bg-white/20' },
}

// Visual stack offset per depth level
const STACK = [
  { y: 0,  scale: 1.00, opacity: 1.00 },  // index 0 — active, fully visible
  { y: 7,  scale: 0.95, opacity: 0.60 },  // index 1 — peeks behind
  { y: 13, scale: 0.90, opacity: 0.35 },  // index 2 — deeper peek
  { y: 17, scale: 0.85, opacity: 0.00 },  // index 3+ — invisible, queued
]

// Wait for the previous toast's exit animation before starting the dismiss timer
const ACTIVATION_DELAY_MS = 220

interface Props extends ToastItem {
  onDismiss: (id: string) => void
  /** Position in the stack — 0 is frontmost (active). */
  index: number
}

export function CanvasToast({ id, type, title, body, duration = 3000, onDismiss, index }: Props) {
  const cfg = CONFIG[type]
  const isActive = index === 0
  const { y, scale, opacity } = STACK[Math.min(index, STACK.length - 1)]

  // Only the active (frontmost) toast runs a dismiss timer
  useEffect(() => {
    if (!isActive) return
    let dismiss: ReturnType<typeof setTimeout>
    const activate = setTimeout(() => {
      dismiss = setTimeout(() => onDismiss(id), duration)
    }, ACTIVATION_DELAY_MS)
    return () => {
      clearTimeout(activate)
      clearTimeout(dismiss)
    }
  }, [id, duration, onDismiss, isActive])

  return (
    <motion.div
      // Enter from left; exit to left. Stack position is driven by `animate`.
      initial={{ opacity: 0, x: -14, y: 0, scale: 0.96 }}
      animate={{ opacity, x: 0, y, scale }}
      exit={{ opacity: 0, x: -10, scale: 0.95, transition: { duration: 0.17 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      // Absolute so all cards sit on the same anchor; higher index = lower z-order
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 - index }}
      className="w-64 pointer-events-auto bg-background-dark/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Progress bar — shrinks on active card; static dim stripe on waiting cards */}
      <div className="h-[2px] overflow-hidden">
        {isActive ? (
          <motion.div
            key={id + '-bar'}
            className={`h-full w-full ${cfg.bar} opacity-50`}
            style={{ originX: 0 }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear', delay: ACTIVATION_DELAY_MS / 1000 }}
          />
        ) : (
          <div className={`h-full w-full ${cfg.bar} opacity-20`} />
        )}
      </div>

      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <span className={`material-symbols-outlined text-xl leading-none shrink-0 ${cfg.iconColor}`}>
          {cfg.icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xs leading-snug truncate">{title}</p>
          <p className="text-slate-500 text-[11px] mt-0.5 leading-tight truncate">{body}</p>
        </div>

        <button
          onClick={() => onDismiss(id)}
          className="shrink-0 text-slate-700 hover:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-sm leading-none">close</span>
        </button>
      </div>
    </motion.div>
  )
}
