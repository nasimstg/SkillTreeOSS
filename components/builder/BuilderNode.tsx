'use client'

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { BuilderNodeData } from '@/lib/builder-utils'
import { zoneColor } from '@/lib/builder-utils'
import { useBuilderStore } from '@/lib/builder-store'

export const BuilderNode = memo(function BuilderNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as BuilderNodeData
  const deleteNode = useBuilderStore(s => s.deleteNode)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const [hovered, setHovered] = useState(false)

  const color = zoneColor(nodeData.zone)
  const hasResources = nodeData.resources.length > 0

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setSelectedNodeId(id)}
    >
      {/* Delete button */}
      {hovered && (
        <button
          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center text-xs leading-none shadow-lg transition-colors"
          onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
          title="Delete node"
        >
          ×
        </button>
      )}

      <div
        className="relative w-52 rounded-xl border transition-all duration-150 overflow-hidden"
        style={{
          background:   'var(--color-surface-dark, #1a1a1a)',
          borderColor:  selected ? color : hovered ? `${color}88` : '#2a2a2a',
          boxShadow:    selected ? `0 0 0 2px ${color}55` : 'none',
        }}
      >
        {/* Zone stripe */}
        <div className="h-1 w-full" style={{ background: color }} />

        <div className="p-3 flex items-start gap-2">
          {/* Icon */}
          <span
            className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5"
            style={{ color }}
          >
            {nodeData.icon || 'school'}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {nodeData.label || <span className="text-slate-500 italic">Untitled</span>}
            </p>
            {nodeData.zone && (
              <p className="text-xs mt-0.5" style={{ color: `${color}cc` }}>
                {nodeData.zone}
              </p>
            )}
          </div>
        </div>

        {/* Resource count badge */}
        <div className="px-3 pb-2 flex items-center gap-1">
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              background: hasResources ? `${color}22` : '#ffffff0a',
              color:      hasResources ? color : '#6b7280',
            }}
          >
            {nodeData.resources.length} resource{nodeData.resources.length !== 1 ? 's' : ''}
          </span>
          {!hasResources && (
            <span className="text-xs text-amber-500">⚠ required</span>
          )}
        </div>
      </div>

      {/* ReactFlow handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !rounded-full !border-2 !border-slate-600 !bg-slate-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !rounded-full !border-2 !border-slate-600 !bg-slate-800"
      />
    </div>
  )
})
