'use client'

import { memo, useEffect, type CSSProperties } from 'react'
import { Handle, Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import type { BuilderNodeData } from '@/lib/builder-utils'
import { zoneColor, isEmoji } from '@/lib/builder-utils'
import { useBuilderStore } from '@/lib/builder-store'

const ACCENT = '#00f0ff'

export const BuilderNode = memo(function BuilderNode({ id, data, selected }: NodeProps) {
  const nodeData          = data as BuilderNodeData
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const customZones       = useBuilderStore(s => s.customZones)
  const layoutDir         = useBuilderStore(s => s.layoutDir)

  const updateNodeInternals = useUpdateNodeInternals()

  // Re-measure handle positions after React commits the new DOM layout.
  // useEffect fires after commit, so handles are at their final positions
  // when ReactFlow measures them — avoiding stale edge-routing cache.
  useEffect(() => {
    updateNodeInternals(id)
  }, [layoutDir, id, updateNodeInternals])

  const color      = zoneColor(nodeData.zone, customZones)
  const hasRes     = nodeData.resources.length > 0
  const totalHours = nodeData.resources.reduce((acc, r) => acc + (r.estimatedHours || 0), 0)

  // ── Handle style ────────────────────────────────────────────────────────────
  // Use inline style (beats CSS class declarations without needing !important).
  // Unselected: visible white-ring + slate bg. Selected: cyan + glow.
  const handleStyle: CSSProperties = {
    width:        14,
    height:       14,
    minWidth:     14,   // override ReactFlow's 5px minimum
    minHeight:    14,
    borderRadius: '50%',
    border:       selected
      ? '2px solid #030712'
      : '2px solid rgba(255,255,255,0.40)',
    background:   selected ? ACCENT : '#475569',
    boxShadow:    selected
      ? `0 0 12px rgba(0,240,255,0.85), 0 0 0 2px rgba(0,240,255,0.15)`
      : '0 2px 6px rgba(0,0,0,0.5)',
    zIndex:       20,          // always above the card div
    cursor:       'crosshair',
  }

  return (
    <div className="relative" onClick={() => setSelectedNodeId(id)}>
      {/* ── Target handle (incoming connections) ── */}
      <Handle
        type="target"
        position={layoutDir === 'LR' ? Position.Left : Position.Top}
        style={handleStyle}
      />

      {/* ── Node card ── */}
      <div
        className="w-52 rounded-xl cursor-pointer"
        style={{
          background:  '#1f2937',
          border:      selected ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.10)',
          boxShadow:   selected
            ? '0 0 20px rgba(0,240,255,0.12)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          transition:  'border-color 150ms, box-shadow 150ms',
          zIndex:      1,   // explicit z so it stays below handles (z:20)
        }}
        onMouseEnter={e => {
          if (!selected)
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.22)'
        }}
        onMouseLeave={e => {
          if (!selected)
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.10)'
        }}
      >
        <div className="p-4 flex flex-col gap-3">
          {/* Icon */}
          <div
            className="size-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}22`, color }}
          >
            {isEmoji(nodeData.icon) ? (
              <span className="text-2xl leading-none">{nodeData.icon}</span>
            ) : (
              <span className="material-symbols-outlined text-xl">{nodeData.icon || 'school'}</span>
            )}
          </div>

          {/* Title + zone */}
          <div>
            <h4 className="text-sm font-bold text-white mb-0.5 leading-tight">
              {nodeData.label || (
                <span className="text-slate-500 italic text-xs font-normal">Untitled</span>
              )}
            </h4>
            {nodeData.zone && (
              <p className="text-[11px] text-slate-400">{nodeData.zone}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasRes ? (
              <span
                className="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                style={{
                  background: 'rgba(20,83,45,0.3)',
                  color:      '#4ade80',
                  border:     '1px solid rgba(20,83,45,0.5)',
                }}
              >
                <span className="material-symbols-outlined text-[12px]">library_books</span>
                {nodeData.resources.length}
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                style={{
                  background: 'rgba(120,53,15,0.2)',
                  color:      '#f59e0b',
                  border:     '1px solid rgba(120,53,15,0.3)',
                }}
              >
                <span className="material-symbols-outlined text-[11px]">warning</span>
                No resources
              </span>
            )}
            {totalHours > 0 && (
              <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">schedule</span>
                {totalHours}h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Source handle (outgoing connections) ── */}
      <Handle
        type="source"
        position={layoutDir === 'LR' ? Position.Right : Position.Bottom}
        style={handleStyle}
      />
    </div>
  )
})
