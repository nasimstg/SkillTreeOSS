'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function CanvasConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Reset',
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-background-dark border border-white/[0.08] rounded-2xl shadow-2xl p-6"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <span className="material-symbols-outlined text-xl text-red-400 leading-none">delete_sweep</span>
            </div>

            <h2 className="text-white font-bold text-sm mb-1.5">{title}</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{description}</p>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-red-500/80 hover:bg-red-500 border border-red-500/30 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
