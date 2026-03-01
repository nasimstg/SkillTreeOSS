'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SkillTree } from '@/types/tree'
import type { ValidationError } from '@/lib/builder-utils'

interface GithubStatus {
  connected: boolean
  username:  string | null
}

type Step = 'validate' | 'choose' | 'submitting' | 'done' | 'error'

interface Props {
  tree:   SkillTree
  errors: ValidationError[]
  onClose: () => void
}

export function SubmitModal({ tree, errors, onClose }: Props) {
  const [step, setStep]         = useState<Step>(errors.length > 0 ? 'validate' : 'choose')
  const [ghStatus, setGhStatus] = useState<GithubStatus>({ connected: false, username: null })
  const [prUrl, setPrUrl]       = useState('')
  const [errMsg, setErrMsg]     = useState('')
  const [isEdit, setIsEdit]     = useState(false)

  useEffect(() => {
    // Fetch GitHub connection status
    fetch('/api/github/status')
      .then(r => r.json())
      .then(setGhStatus)
      .catch(() => {/* non-critical */})

    // Check if this treeId already exists (edit mode)
    if (tree.treeId) {
      fetch(`/api/trees/exists/${tree.treeId}`)
        .then(r => r.json())
        .then(d => setIsEdit(!!d.exists))
        .catch(() => {})
    }
  }, [tree.treeId])

  async function submit(anonymous: boolean) {
    setStep('submitting')
    try {
      const res = await fetch('/api/contribute/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tree, anonymous }),
      })
      const data = await res.json() as { prUrl?: string; error?: string }
      if (!res.ok || !data.prUrl) throw new Error(data.error ?? 'Submission failed')
      setPrUrl(data.prUrl)
      setStep('done')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-semibold text-base">
            {isEdit ? 'Submit Tree Update' : 'Submit New Skill Tree'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5">
          {/* ── Validate step ── */}
          {step === 'validate' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <span className="material-symbols-outlined text-amber-400 mt-0.5">warning</span>
                <div>
                  <p className="text-sm text-amber-300 font-medium">Fix these issues before submitting</p>
                  <ul className="mt-2 space-y-1">
                    {errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-200">• {e.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
              >
                Go back and fix issues
              </button>
            </div>
          )}

          {/* ── Choose method step ── */}
          {step === 'choose' && (
            <div className="space-y-4">
              {/* Tree summary */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-base">{tree.icon}</span>
                  <span className="text-white font-medium">{tree.title || tree.treeId}</span>
                  {isEdit && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Update</span>
                  )}
                </div>
                <p className="text-slate-400 text-xs">
                  {tree.nodes.length} nodes · {tree.category} · {tree.difficulty}
                </p>
              </div>

              <p className="text-sm text-slate-300">
                Your tree will be submitted as a GitHub Pull Request and reviewed before going live.
              </p>

              {/* Connected user option */}
              {ghStatus.connected && ghStatus.username && (
                <button
                  onClick={() => submit(false)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-primary">account_circle</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Submit as @{ghStatus.username}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Opens a PR from your own GitHub fork — contribution is attributed to you</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                </button>
              )}

              {/* Anonymous option */}
              <button
                onClick={() => submit(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-slate-400">person_off</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Submit anonymously</p>
                  <p className="text-slate-400 text-xs mt-0.5">PR opened by the SkillTreeOSS bot — no GitHub account needed</p>
                </div>
                <span className="material-symbols-outlined text-slate-500">chevron_right</span>
              </button>

              {/* Connect GitHub prompt */}
              {!ghStatus.connected && (
                <a
                  href="/api/github/connect"
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-base">link</span>
                  Connect GitHub to submit under your own name
                  <span className="ml-auto material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
          )}

          {/* ── Submitting step ── */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Creating Pull Request…</p>
                <p className="text-slate-400 text-sm mt-1">
                  {isEdit ? 'Committing changes to your fork' : 'Setting up branch and PR on GitHub'}
                </p>
              </div>
            </div>
          )}

          {/* ── Done step ── */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Pull Request Created!</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Your tree will be reviewed by maintainers before going live.
                  </p>
                </div>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-black font-semibold text-sm hover:bg-primary/80 transition-colors"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                View Pull Request on GitHub
              </a>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Error step ── */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm font-medium">Submission failed</p>
                <p className="text-red-300 text-xs mt-1">{errMsg}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
