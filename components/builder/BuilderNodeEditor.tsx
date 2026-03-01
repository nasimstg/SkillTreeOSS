'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBuilderStore } from '@/lib/builder-store'
import { ResourceEditor } from '@/components/builder/ResourceEditor'
import { IconPicker } from '@/components/builder/IconPicker'
import { ZoneSelector } from '@/components/builder/ZoneSelector'
import { zoneColor, isEmoji } from '@/lib/builder-utils'
import type { Resource } from '@/types/tree'

const SPRING = { type: 'spring' as const, damping: 28, stiffness: 300 }

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white ' +
  'placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 ' +
  'focus:ring-[#00f0ff]/30 transition-all'

const labelClass = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider'

export function BuilderNodeEditor() {
  const selectedNodeId    = useBuilderStore(s => s.selectedNodeId)
  const nodes             = useBuilderStore(s => s.nodes)
  const edges             = useBuilderStore(s => s.edges)
  const customZones       = useBuilderStore(s => s.customZones)
  const recentIcons       = useBuilderStore(s => s.recentIcons)
  const onEdgesChange     = useBuilderStore(s => s.onEdgesChange)
  const updateNodeData    = useBuilderStore(s => s.updateNodeData)
  const deleteNode        = useBuilderStore(s => s.deleteNode)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const trackIconUsed     = useBuilderStore(s => s.trackIconUsed)

  const isOpen = selectedNodeId !== null

  // Cache last non-null node so exit animation has content to render
  const lastNodeRef = useRef<(typeof nodes)[number] | null>(null)
  const currentNode = nodes.find(n => n.id === selectedNodeId) ?? null
  if (currentNode) lastNodeRef.current = currentNode
  const node = lastNodeRef.current

  if (!node) return null

  const d     = node.data
  const color = zoneColor(d.zone, customZones)

  const incomingEdges = edges.filter(e => e.target === node.id)
  const outgoingEdges = edges.filter(e => e.source === node.id)

  function getNodeLabel(nodeId: string) {
    return nodes.find(n => n.id === nodeId)?.data.label || nodeId
  }

  function removeEdge(edgeId: string) {
    onEdgesChange([{ type: 'remove', id: edgeId }])
  }

  function handleClose() {
    setSelectedNodeId(null)
  }

  function handleIconChange(icon: string) {
    // `node` is guaranteed non-null here (early return above), but TypeScript
    // re-widens captured variables inside closures — use non-null assertion.
    updateNodeData(node!.id, { icon })
    trackIconUsed(icon)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="builder-node-editor"
          data-builder-panel
          initial={{ x: '100%', opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.6 }}
          transition={SPRING}
          className="fixed right-0 top-0 z-50 h-screen w-full lg:w-2/5 flex flex-row bg-background-dark border-l border-white/[0.07] shadow-2xl font-display"
        >
          {/* ── Left collapse arrow ── */}
          <motion.button
            onClick={handleClose}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            className="shrink-0 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer border-r border-r-white/[0.06]"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-[24px] leading-none block">arrow_right</span>
          </motion.button>

          {/* ── Main panel ── */}
          <div className="h-screen w-full flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3 pr-8 min-w-0">
                {/* Icon badge — emoji-aware */}
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                >
                  {isEmoji(d.icon) ? (
                    <span className="text-xl leading-none">{d.icon}</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg leading-none">{d.icon || 'school'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight leading-tight text-white truncate">
                    {d.label || 'Untitled Node'}
                  </h2>
                  {d.zone && (
                    <p className="text-xs font-normal mt-0.5" style={{ color }}>
                      {d.zone}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                whileTap={{ scale: 0.92 }}
                className="shrink-0 rounded-full p-2 text-slate-400 hover:text-white transition-colors"
              >
                <motion.span
                  className="material-symbols-outlined text-[24px] leading-none block"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.18, type: 'spring', stiffness: 500, damping: 25 }}
                >
                  close
                </motion.span>
              </motion.button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
            >

              {/* ── Properties ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Properties</h3>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Node Title</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Git Basics"
                    value={d.label}
                    onChange={e => updateNodeData(node.id, { label: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={`${inputClass} resize-none h-20 leading-relaxed`}
                    placeholder="What does this skill cover?"
                    value={d.description}
                    onChange={e => updateNodeData(node.id, { description: e.target.value })}
                  />
                </div>

                {/* Icon picker */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Icon</label>
                  <IconPicker
                    value={d.icon}
                    onChange={handleIconChange}
                    recentIcons={recentIcons}
                    color={color}
                  />
                </div>

                {/* Zone selector */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Zone</label>
                  <ZoneSelector
                    value={d.zone}
                    onChange={zone => updateNodeData(node.id, { zone })}
                  />
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-white/[0.06]" />

              {/* ── Resources ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Learning Resources</h3>

                {d.resources.length === 0 && (
                  <div
                    className="flex gap-3 p-3 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                  >
                    <span className="material-symbols-outlined text-amber-400 shrink-0 text-lg">warning</span>
                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      This node has no resources. Add at least one to make it valid.
                    </p>
                  </div>
                )}

                <ResourceEditor
                  resources={d.resources}
                  onChange={(resources: Resource[]) => updateNodeData(node.id, { resources })}
                />
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-white/[0.06]" />

              {/* ── Connections ── */}
              <div className="space-y-4 pb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connections</h3>

                {incomingEdges.length === 0 && outgoingEdges.length === 0 && (
                  <p className="text-xs text-slate-600 italic">
                    No connections yet. Drag between node handles to connect.
                  </p>
                )}

                <div className="space-y-2">
                  {incomingEdges.map(e => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-sm rotate-180">arrow_right_alt</span>
                        <div>
                          <p className="text-xs font-bold text-slate-300">From</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{getNodeLabel(e.source)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEdge(e.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">link_off</span>
                      </button>
                    </div>
                  ))}

                  {outgoingEdges.map(e => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-sm">arrow_right_alt</span>
                        <div>
                          <p className="text-xs font-bold text-slate-300">To</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{getNodeLabel(e.target)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEdge(e.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">link_off</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 px-6 py-4 border-t border-white/[0.08] bg-background-dark shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.4)] flex flex-col gap-2">
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg"
              >
                Save Changes to Node
              </button>
              <button
                onClick={() => { deleteNode(node.id); setSelectedNodeId(null) }}
                className="w-full py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete Node
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
