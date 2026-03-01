'use client'

import type { CSSProperties } from 'react'
import { useBuilderStore } from '@/lib/builder-store'

export type ActiveTool = 'select' | 'pan' | 'add' | 'connect'

const ACCENT = '#00f0ff'

interface Props {
  activeTool:    ActiveTool
  setActiveTool: (t: ActiveTool) => void
  onAddNode:     () => void
}

export function BottomToolbar({ activeTool, setActiveTool, onAddNode }: Props) {
  const selectedNodeId    = useBuilderStore(s => s.selectedNodeId)
  const deleteNode        = useBuilderStore(s => s.deleteNode)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)

  function handleDelete() {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
      setSelectedNodeId(null)
    }
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div
        className="px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-1"
        style={{
          background:          'rgba(17, 24, 39, 0.88)',
          backdropFilter:      'blur(14px)',
          WebkitBackdropFilter:'blur(14px)',
          border:              '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Select */}
        <ToolBtn
          icon="near_me"
          title="Select (V)"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
        />

        <Divider />

        {/* Pan */}
        <ToolBtn
          icon="pan_tool"
          title="Pan (H)"
          active={activeTool === 'pan'}
          onClick={() => setActiveTool('pan')}
        />

        {/* Add Node */}
        <ToolBtn
          icon="add_box"
          title="Add Node (double-click canvas)"
          onClick={() => { setActiveTool('select'); onAddNode() }}
        />

        {/* Connect */}
        <ToolBtn
          icon="polyline"
          title="Connect nodes"
          active={activeTool === 'connect'}
          onClick={() => setActiveTool('connect')}
        />

        <Divider />

        {/* Undo */}
        <ToolBtn
          icon="undo"
          title="Undo (Ctrl+Z)"
          disabled
          onClick={() => {}}
        />

        {/* Redo */}
        <ToolBtn
          icon="redo"
          title="Redo"
          disabled
          onClick={() => {}}
        />

        <Divider />

        {/* Delete */}
        <button
          title="Delete selected (Del)"
          disabled={!selectedNodeId}
          onClick={handleDelete}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            color:   selectedNodeId ? '#f87171' : '#374151',
            cursor:  selectedNodeId ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={e => {
            if (selectedNodeId) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = ''
          }}
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />
}

function ToolBtn({
  icon,
  title,
  active,
  disabled,
  onClick,
}: {
  icon:     string
  title:    string
  active?:  boolean
  disabled?: boolean
  onClick:  () => void
}) {
  const activeStyle: CSSProperties = {
    background:  `${ACCENT}18`,
    color:        ACCENT,
    border:      `1px solid ${ACCENT}55`,
    boxShadow:   `0 0 10px ${ACCENT}33`,
  }

  const idleStyle: CSSProperties = {
    color:   disabled ? '#374151' : '#94a3b8',
    cursor:  disabled ? 'not-allowed' : 'pointer',
  }

  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
      style={active ? activeStyle : idleStyle}
      onMouseEnter={e => {
        if (!active && !disabled) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.color      = 'white'
          el.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={e => {
        if (!active && !disabled) {
          const el = e.currentTarget as HTMLButtonElement
          el.style.color      = '#94a3b8'
          el.style.background = ''
        }
      }}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}
