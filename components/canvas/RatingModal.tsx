'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

interface Props {
  open: boolean
  treeTitle: string
  treeId: string
  existingRating: number | null
  onClose: () => void
  onSubmitted: (rating: number) => void
}

export default function RatingModal({
  open, treeTitle, treeId, existingRating, onClose, onSubmitted,
}: Props) {
  const [hovered,   setHovered]   = useState(0)
  const [selected,  setSelected]  = useState(existingRating ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const displayed = hovered || selected   // star fill follows hover, falls back to selection

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/trees/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId, rating: selected }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onSubmitted(selected)
      onClose()
    } catch {
      setError('Could not save rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-background-dark border border-white/[0.08] rounded-2xl shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-sm">Rate this learning path</h2>
                <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[260px]">{treeTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-600 hover:text-slate-400 transition-colors -mt-0.5"
              >
                <span className="material-symbols-outlined text-xl leading-none">close</span>
              </button>
            </div>

            {/* Stars */}
            <div
              className="flex items-center justify-center gap-2 mb-2"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => setSelected(star)}
                  className="transition-transform hover:scale-125 active:scale-110"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl leading-none transition-colors ${
                      star <= displayed
                        ? 'text-amber-400'
                        : 'text-slate-700 hover:text-slate-500'
                    }`}
                    style={{ fontVariationSettings: star <= displayed ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            {/* Star label */}
            <p className="text-center text-xs text-slate-400 h-4 mb-5 transition-all">
              {displayed > 0 ? STAR_LABELS[displayed] : 'Select a rating'}
            </p>

            {/* Existing rating hint */}
            {existingRating && (
              <p className="text-center text-[11px] text-slate-600 mb-4">
                Your current rating: {existingRating} star{existingRating > 1 ? 's' : ''}
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="text-center text-xs text-red-400 mb-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-background-dark bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Saving…' : existingRating ? 'Update rating' : 'Submit rating'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
