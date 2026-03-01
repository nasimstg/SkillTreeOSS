'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Data ──────────────────────────────────────────────────────────────────────

const GUIDE = [
  {
    icon: 'add_circle',
    color: '#11d452',
    title: 'Add nodes',
    desc: 'Double-click anywhere on the canvas or press N to add a skill node at a random position.',
  },
  {
    icon: 'polyline',
    color: '#00f0ff',
    title: 'Connect nodes',
    desc: 'Drag from a node\'s handle (bottom/right) onto another node\'s handle to draw a prerequisite edge.',
  },
  {
    icon: 'select_all',
    color: '#a78bfa',
    title: 'Multi-select',
    desc: 'Hold Ctrl and click to add nodes to your selection, or drag a rectangle on the canvas in Select mode.',
  },
  {
    icon: 'edit',
    color: '#fb923c',
    title: 'Edit nodes',
    desc: 'Click any node to open the editor panel on the right. Right-click for a context menu.',
  },
  {
    icon: 'auto_graph',
    color: '#f472b6',
    title: 'Auto-layout',
    desc: 'Use the ⇄ button in the toolbar or press Ctrl+L to automatically arrange nodes with the Dagre algorithm.',
  },
  {
    icon: 'upload_file',
    color: '#fbbf24',
    title: 'Submit your tree',
    desc: 'Click "Submit Tree PR" to contribute via GitHub. Toggle Preview to see the viewer experience.',
  },
]

const SHORTCUTS: { category: string; items: { key: string; label: string; dim?: boolean }[] }[] = [
  {
    category: 'Tools',
    items: [
      { key: 'V',        label: 'Select tool'       },
      { key: 'H',        label: 'Pan tool'           },
      { key: 'N',        label: 'Add new node'       },
      { key: 'Del / ⌫',  label: 'Delete selected'   },
      { key: 'Esc',      label: 'Deselect / close'  },
    ],
  },
  {
    category: 'Selection',
    items: [
      { key: 'Click',         label: 'Select node'              },
      { key: 'Ctrl+Click',    label: 'Add to selection'         },
      { key: 'Drag',          label: 'Rectangle select'         },
      { key: 'Ctrl+A',        label: 'Select all nodes'         },
    ],
  },
  {
    category: 'Canvas',
    items: [
      { key: 'Scroll',    label: 'Zoom in / out'              },
      { key: 'Mid-drag',  label: 'Pan canvas'                 },
      { key: 'Dbl-click', label: 'Add node at position'       },
      { key: 'Ctrl+L',    label: 'Auto-layout'                },
    ],
  },
  {
    category: 'History',
    items: [
      { key: 'Ctrl+Z',        label: 'Undo', dim: true        },
      { key: 'Ctrl+Shift+Z',  label: 'Redo', dim: true        },
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1,    y:  0, opacity: 1 }}
        exit={{    scale: 0.94, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.9 }}
        className="w-full max-w-[740px] max-h-[88vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'rgba(8, 12, 22, 0.98)',
          border:     '1px solid rgba(255,255,255,0.08)',
          boxShadow:  '0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(17,212,82,0.12)', color: '#11d452' }}>
                <span className="material-symbols-outlined text-[18px]">help</span>
              </div>
              <h2 className="text-[17px] font-bold text-white tracking-tight">Builder Guide & Shortcuts</h2>
            </div>
            <p className="text-slate-500 text-xs ml-[42px]">Everything you need to build a skill tree</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0 mt-0.5"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-[1fr_220px] gap-6">

          {/* ── Left: Guide steps ─────────────────────────────── */}
          <div>
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Start</p>
            <div className="space-y-2.5">
              {GUIDE.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${step.color}14`, color: step.color }}
                    >
                      <span className="material-symbols-outlined text-[17px]">{step.icon}</span>
                    </div>
                    <span className="text-[9px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.15)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white mb-0.5">{step.title}</p>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Keyboard shortcuts ─────────────────────── */}
          <div className="space-y-5">
            {SHORTCUTS.map(section => (
              <div key={section.category}>
                <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {section.category}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(({ key, label, dim }) => (
                    <div key={key} className="flex items-center justify-between py-1 px-0.5">
                      <span className={`text-[12px] ${dim ? 'text-slate-600' : 'text-slate-300'}`}>
                        {label}
                        {dim && <span className="ml-1.5 text-[10px] text-slate-700">(soon)</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        {key.split('+').map((k, ki) => (
                          <span key={ki} className="flex items-center gap-1">
                            {ki > 0 && <span className="text-slate-700 text-[10px]">+</span>}
                            <kbd
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold text-slate-400"
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.3)',
                              }}
                            >
                              {k.trim()}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-between">
          <p className="text-slate-600 text-[11px]">
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px]">?</kbd>
            {' '}anytime to open this panel
          </p>
          <a
            href="https://github.com/nasimstg/SkillTreeOSS"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            View on GitHub
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}
