'use client'

import { useBuilderStore } from '@/lib/builder-store'
import { ResourceEditor } from '@/components/builder/ResourceEditor'
import { COMMON_ZONES, zoneColor } from '@/lib/builder-utils'
import type { Resource } from '@/types/tree'

const COMMON_ICONS = [
  'school', 'code', 'terminal', 'data_object', 'web', 'cloud',
  'security', 'psychology', 'science', 'palette', 'sports_esports',
  'fitness_center', 'restaurant', 'language', 'camera', 'book',
  'bar_chart', 'hub', 'rocket_launch', 'memory', 'dns', 'database',
]

export function BuilderNodeEditor() {
  const selectedNodeId  = useBuilderStore(s => s.selectedNodeId)
  const nodes           = useBuilderStore(s => s.nodes)
  const updateNodeData  = useBuilderStore(s => s.updateNodeData)
  const deleteNode      = useBuilderStore(s => s.deleteNode)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)

  const node = nodes.find(n => n.id === selectedNodeId)
  if (!node) return null

  const d = node.data
  const color = zoneColor(d.zone)

  return (
    <aside className="absolute right-0 top-0 h-full w-80 z-20 flex flex-col bg-[#111] border-l border-white/10 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-medium text-white">Edit Node</span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Label */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Label *</label>
          <input
            className="input-sm w-full"
            placeholder="e.g. Git Basics"
            value={d.label}
            onChange={e => updateNodeData(node.id, { label: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Description</label>
          <textarea
            className="input-sm w-full min-h-[70px] resize-none"
            placeholder="What does this skill cover?"
            value={d.description}
            onChange={e => updateNodeData(node.id, { description: e.target.value })}
          />
        </div>

        {/* Zone */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Zone *</label>
          <select
            className="input-sm w-full"
            value={d.zone}
            onChange={e => updateNodeData(node.id, { zone: e.target.value })}
          >
            <option value="">Select zone…</option>
            {COMMON_ZONES.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        {/* Icon */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide font-medium block mb-1">Icon</label>
          <div className="flex gap-2 items-center mb-2">
            <input
              className="input-sm flex-1"
              placeholder="Material Symbols name"
              value={d.icon}
              onChange={e => updateNodeData(node.id, { icon: e.target.value })}
            />
            <span
              className="material-symbols-outlined text-xl flex-shrink-0"
              style={{ color }}
            >
              {d.icon || 'school'}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {COMMON_ICONS.map(icon => (
              <button
                key={icon}
                title={icon}
                onClick={() => updateNodeData(node.id, { icon })}
                className="p-1.5 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
                style={{ color: d.icon === icon ? color : '#6b7280' }}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <ResourceEditor
          resources={d.resources}
          onChange={(resources: Resource[]) => updateNodeData(node.id, { resources })}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <button
          onClick={() => { deleteNode(node.id); setSelectedNodeId(null) }}
          className="w-full text-xs py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete Node
        </button>
      </div>
    </aside>
  )
}
