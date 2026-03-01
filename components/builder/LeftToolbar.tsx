'use client'

import { useReactFlow } from '@xyflow/react'
import { motion } from 'framer-motion'
import { useBuilderStore } from '@/lib/builder-store'
import { computeAutoLayout } from '@/lib/autoLayout'
import type { SkillTree } from '@/types/tree'

export type ActiveTool = 'select' | 'pan'

const ACCENT = '#00f0ff'
const DANGER = '#f87171'

// Spring that feels like a heavy liquid droplet — fast travel, slight overshoot
const BUBBLE_SPRING = { type: 'spring' as const, stiffness: 480, damping: 32, mass: 0.9 }

interface Props {
  activeTool:    ActiveTool
  setActiveTool: (t: ActiveTool) => void
  onAddNode:     () => void
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LeftToolbar({ activeTool, setActiveTool, onAddNode }: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  const selectedNodeId    = useBuilderStore(s => s.selectedNodeId)
  const deleteNode        = useBuilderStore(s => s.deleteNode)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const setShowShortcuts  = useBuilderStore(s => s.setShowShortcuts)
  const storeNodes        = useBuilderStore(s => s.nodes)
  const storeEdges        = useBuilderStore(s => s.edges)
  const layoutDir         = useBuilderStore(s => s.layoutDir)
  const applyAutoLayout   = useBuilderStore(s => s.applyAutoLayout)

  function handleLayoutToggle() {
    const newDir = layoutDir === 'TB' ? 'LR' : 'TB'
    const tree: SkillTree = {
      treeId: '', title: '', category: '', difficulty: 'medium',
      description: '', estimatedMonths: 0,
      version: '1.0', totalNodes: storeNodes.length, icon: 'school',
      nodes: storeNodes.map(n => ({
        id: n.id, label: n.data.label, description: '', icon: '', zone: '',
        resources: [], requires: [],
      })),
      edges: storeEdges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    }
    const positions = computeAutoLayout(tree, 'rpg', newDir, { w: 224, h: 180 })
    applyAutoLayout(positions, newDir)
    // BuilderNode.useEffect calls updateNodeInternals after React commits,
    // so handles are already remeasured by the time fitView runs.
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 80)
  }

  function handleDelete() {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
      setSelectedNodeId(null)
    }
  }

  return (
    <div className="absolute left-4 bottom-6 z-30 pointer-events-auto">
      {/*
        Glass-tube container — frosted glass with rim lighting to simulate
        a sealed tube filled with luminescent liquid.
      */}
      <div
        className="flex flex-row items-center gap-0.5 py-2.5 px-2 rounded-2xl"
        style={{
          background:          'rgba(8, 12, 22, 0.92)',
          backdropFilter:      'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:              '1px solid rgba(255,255,255,0.08)',
          boxShadow: [
            '0 8px 32px rgba(0,0,0,0.55)',
            'inset 0 1px 0 rgba(255,255,255,0.08)',   // top rim highlight
            'inset 0 -1px 0 rgba(0,0,0,0.30)',        // bottom shadow
          ].join(', '),
        }}
      >

        {/* ── Mode tools ─────────────────────────────── */}
        <Tip label="Select (V)">
          <ToolBtn
            icon="near_me"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
        </Tip>

        <Tip label="Pan (H)">
          <ToolBtn
            icon="pan_tool"
            active={activeTool === 'pan'}
            onClick={() => setActiveTool('pan')}
          />
        </Tip>

        <Tip label="Add Node (N)">
          <ToolBtn
            icon="add_circle"
            onClick={() => { setActiveTool('select'); onAddNode() }}
          />
        </Tip>

        {/* ── Divider ────────────────────────────────── */}
        <HDivider />

        {/* ── Zoom controls ──────────────────────────── */}
        <Tip label="Zoom in">
          <ToolBtn icon="add"    onClick={() => zoomIn({ duration: 250 })} />
        </Tip>

        <Tip label="Zoom out">
          <ToolBtn icon="remove" onClick={() => zoomOut({ duration: 250 })} />
        </Tip>

        <Tip label="Fit view">
          <ToolBtn icon="center_focus_strong" onClick={() => fitView({ duration: 500, padding: 0.2 })} />
        </Tip>

        <Tip label={layoutDir === 'TB' ? 'Switch to left→right (Ctrl+L)' : 'Switch to top→bottom (Ctrl+L)'}>
          <ToolBtn
            icon={layoutDir === 'TB' ? 'swap_horiz' : 'swap_vert'}
            onClick={handleLayoutToggle}
          />
        </Tip>

        {/* ── Divider ────────────────────────────────── */}
        <HDivider />

        {/* ── History ────────────────────────────────── */}
        <Tip label="Undo (coming soon)">
          <ToolBtn icon="undo" disabled onClick={() => {}} />
        </Tip>

        <Tip label="Redo (coming soon)">
          <ToolBtn icon="redo" disabled onClick={() => {}} />
        </Tip>

        {/* ── Divider ────────────────────────────────── */}
        <HDivider />

        {/* ── Shortcuts help ─────────────────────────── */}
        <Tip label="Shortcuts & guide (?)">
          <ToolBtn icon="help" onClick={() => setShowShortcuts(true)} />
        </Tip>

        {/* ── Divider ────────────────────────────────── */}
        <HDivider />

        {/* ── Delete ─────────────────────────────────── */}
        <Tip label="Delete node (Del)">
          <ToolBtn
            icon="delete"
            danger
            disabled={!selectedNodeId}
            onClick={handleDelete}
          />
        </Tip>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HDivider() {
  return (
    <div className="w-5 h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
  )
}

/** Hover tooltip that appears to the right of the button */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center">
      {children}
      <div
        className="absolute left-full ml-2.5 px-2 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap
                   pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
        style={{
          background: 'rgba(8,12,24,0.97)',
          border:     '1px solid rgba(255,255,255,0.09)',
          boxShadow:  '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  )
}

/**
 * Tool button with a shared-layout liquid bubble that flows between active states.
 *
 * When `active` is true, a <motion.div layoutId="toolBubble"> renders inside the
 * button. As `activeTool` changes, Framer Motion detects the same layoutId unmounting
 * from one button and mounting in another — it animates the bubble between them with
 * spring physics, creating the "liquid droplet sliding in a glass tube" effect.
 */
function ToolBtn({
  icon,
  active,
  disabled,
  danger,
  onClick,
}: {
  icon:      string
  active?:   boolean
  disabled?: boolean
  danger?:   boolean
  onClick:   () => void
}) {
  const iconColor = disabled
    ? '#2d3a50'
    : active
      ? ACCENT
      : danger
        ? DANGER
        : '#64748b'

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-100"
      style={{ color: iconColor, cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={e => {
        if (disabled || active) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = danger ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.06)'
        el.style.color      = danger ? '#fca5a5' : 'white'
      }}
      onMouseLeave={e => {
        if (disabled || active) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = ''
        el.style.color      = danger ? DANGER : '#64748b'
      }}
    >
      {/* ─ Liquid bubble (flows between buttons via shared layout animation) ─ */}
      {active && (
        <motion.div
          layoutId="toolBubble"
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(0,240,255,0.18) 0%, rgba(0,240,255,0.09) 100%)',
            border:     '1px solid rgba(0,240,255,0.38)',
            boxShadow: [
              '0 0 16px rgba(0,240,255,0.14)',
              'inset 0 1px 0 rgba(255,255,255,0.22)',   // liquid meniscus highlight
              'inset 0 -1px 0 rgba(0,0,0,0.20)',        // bottom shadow for depth
            ].join(', '),
          }}
          transition={BUBBLE_SPRING}
        />
      )}

      <span className="material-symbols-outlined text-[19px] leading-none relative z-10">
        {icon}
      </span>
    </button>
  )
}
