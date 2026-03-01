'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence } from 'framer-motion'

import { useBuilderStore } from '@/lib/builder-store'
import { treeToDraft, type BuilderDraft } from '@/lib/builder-utils'
import { computeAutoLayout } from '@/lib/autoLayout'
import type { SkillTree } from '@/types/tree'

import { BuilderNode } from '@/components/builder/BuilderNode'
import { BuilderNodeEditor } from '@/components/builder/BuilderNodeEditor'
import { BuilderHeader } from '@/components/builder/BuilderHeader'
import { MetadataPanel } from '@/components/builder/MetadataPanel'
import { LeftToolbar, type ActiveTool } from '@/components/builder/LeftToolbar'
import { ContextMenu, type ContextMenuItem } from '@/components/builder/ContextMenu'
import { ShortcutsModal } from '@/components/builder/ShortcutsModal'
import SkillCanvas from '@/components/canvas/SkillCanvas'

const NODE_TYPES = { builderNode: BuilderNode }

// ─── Node placement helper ────────────────────────────────────────────────────
// Builder nodes are w-52 (208px) wide, ~180px tall. Add 32px gap on each axis.
const SLOT_W = 240
const SLOT_H = 212

// Spiral of grid offsets to try (0,0 = center, then ring outward)
const SPIRAL: [number, number][] = [
  [0, 0],
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [2, 0], [-2, 0], [0, 2], [0, -2],
  [2, 1], [-2, 1], [1, 2], [-1, 2],
  [2, -1], [-2, -1], [1, -2], [-1, -2],
]

/**
 * Find the first unoccupied grid slot near `center` in flow-space.
 * Returns the top-left position for ReactFlow (since nodes use top-left origin).
 */
function findFreePosition(
  cx: number,
  cy: number,
  existingNodes: Node[],
): { x: number; y: number } {
  for (const [dx, dy] of SPIRAL) {
    // Grid slot center in flow space
    const slotCx = cx + dx * SLOT_W
    const slotCy = cy + dy * SLOT_H
    // Convert to node top-left (nodes are 208×~180)
    const tx = slotCx - 104
    const ty = slotCy - 90

    const occupied = existingNodes.some(
      n =>
        Math.abs(n.position.x - tx) < SLOT_W * 0.8 &&
        Math.abs(n.position.y - ty) < SLOT_H * 0.8,
    )
    if (!occupied) return { x: tx, y: ty }
  }
  // All nearby slots taken → diagonal cascade
  return { x: cx - 104 + existingNodes.length * 20, y: cy - 90 + existingNodes.length * 20 }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  existingTree?: SkillTree | null
  initialDraft?: BuilderDraft | null
}

// ─── Inner canvas (needs ReactFlowProvider context) ───────────────────────────

function BuilderCanvasInner({ existingTree, initialDraft }: Props) {
  const { screenToFlowPosition, fitView, setViewport, getZoom, getNode } = useReactFlow()
  const [activeTool, setActiveTool] = useState<ActiveTool>('select')

  // Last known mouse position inside the canvas — updated on mousemove
  const mousePosRef = useRef({ x: 0, y: 0 })

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number
    nodeId?: string
    flowX?: number; flowY?: number
  } | null>(null)

  // ── Store selectors ────────────────────────────────────────────────────────
  const nodes = useBuilderStore(s => s.nodes)
  const edges = useBuilderStore(s => s.edges)
  const onNodesChange = useBuilderStore(s => s.onNodesChange)
  const onEdgesChange = useBuilderStore(s => s.onEdgesChange)
  const onConnect = useBuilderStore(s => s.onConnect)
  const addNode = useBuilderStore(s => s.addNode)
  const deleteNode = useBuilderStore(s => s.deleteNode)
  const duplicateNode = useBuilderStore(s => s.duplicateNode)
  const selectAllNodes = useBuilderStore(s => s.selectAllNodes)
  const loadDraft = useBuilderStore(s => s.loadDraft)
  const hydrateFromLocal = useBuilderStore(s => s.hydrateFromLocal)
  const isPreviewMode = useBuilderStore(s => s.isPreviewMode)
  const selectedNodeId = useBuilderStore(s => s.selectedNodeId)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const meta = useBuilderStore(s => s.meta)
  const resetBuilder = useBuilderStore(s => s.resetBuilder)
  const showShortcuts = useBuilderStore(s => s.showShortcuts)
  const setShowShortcuts = useBuilderStore(s => s.setShowShortcuts)
  const layoutDir = useBuilderStore(s => s.layoutDir)
  const applyAutoLayout = useBuilderStore(s => s.applyAutoLayout)

  // Keep a ref to nodes so helpers always have fresh data without stale closures
  const nodesRef = useRef(nodes)
  useEffect(() => { nodesRef.current = nodes }, [nodes])

  // ── Load tree data on mount ────────────────────────────────────────────────
  useEffect(() => {
    resetBuilder()
    if (existingTree) {
      const draft = treeToDraft(existingTree)
      loadDraft(draft.nodes, draft.edges, draft.meta, existingTree.treeId)
      // Run Dagre immediately after loading so nodes are laid out correctly for
      // the default layoutDir ('TB') rather than relying on raw JSON positions.
      // Use the existing tree's node/edge data directly (draft.nodes may differ
      // from the store's nodes at this point, so we pass them explicitly).
      const tree: SkillTree = {
        treeId: existingTree.treeId, title: '', category: '', difficulty: 'medium',
        description: '', estimatedMonths: 0,
        version: '1.0', totalNodes: draft.nodes.length, icon: 'school',
        nodes: draft.nodes.map(n => ({
          id: n.id, label: (n.data as { label: string }).label,
          description: '', icon: '', zone: '', resources: [], requires: [],
        })),
        edges: draft.edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      }
      const positions = computeAutoLayout(tree, 'rpg', 'TB', { w: 224, h: 180 })
      // markDirty=false: laying out on initial load is not a user edit
      applyAutoLayout(positions, 'TB', false)
      // BuilderNode.useEffect fires after React commits, calling updateNodeInternals.
      // Wait a bit longer to let that happen before fitting the view.
      setTimeout(() => fitView({ duration: 0, padding: 0.2 }), 80)
    } else if (initialDraft) {
      loadDraft(initialDraft.nodes, initialDraft.edges, initialDraft.meta)
    } else {
      hydrateFromLocal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-center viewport when a node is selected ──────────────────────────
  // Mirrors SkillCanvas.centerOnSelectedNode: uses setViewport with an explicit
  // offset so the node lands in the centre of the *unobscured* canvas area
  // (i.e. the area to the left of the fixed-position editor panel).
  useEffect(() => {
    if (!selectedNodeId || isPreviewMode) return

    const node = getNode(selectedNodeId)
    if (!node) return

    // Use ReactFlow's measured dimensions when available; fall back to known defaults.
    const nodeW = (node.measured as { width?: number } | undefined)?.width ?? 208
    const nodeH = (node.measured as { height?: number } | undefined)?.height ?? 180
    const nodeCX = node.position.x + nodeW / 2
    const nodeCY = node.position.y + nodeH / 2

    const t = setTimeout(() => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Panel is `fixed` and `lg:w-2/5` — its CSS width is unaffected by the
      // translateX animation, so offsetWidth always returns the full panel width.
      const panel = document.querySelector('[data-builder-panel]') as HTMLElement | null
      const panelW = panel?.offsetWidth ?? 0
      // Centre of the visible (unobscured) canvas area in screen pixels
      const screenCX = (vw - panelW) / 2
      const screenCY = vh / 2
      // Keep current zoom; floor at 0.75 so the node is legible
      const zoom = Math.max(getZoom(), 0.75)
      // Viewport formula (mirrors SkillCanvas):
      //   screen = flow * zoom + offset  →  offset = screen − flow * zoom
      setViewport(
        { x: screenCX - nodeCX * zoom, y: screenCY - nodeCY * zoom, zoom },
        { duration: 480 },
      )
    }, 80)
    return () => clearTimeout(t)
    // getNode / getZoom / setViewport are stable refs from useReactFlow — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, isPreviewMode])

  // ── Auto-layout helper (shared with Ctrl+L shortcut) ──────────────────────
  const handleLayoutToggle = useCallback(() => {
    const newDir = layoutDir === 'TB' ? 'LR' : 'TB'
    const tree: SkillTree = {
      treeId: '', title: '', category: '', difficulty: 'medium',
      description: '', estimatedMonths: 0,
      version: '1.0', totalNodes: nodesRef.current.length, icon: 'school',
      nodes: nodesRef.current.map(n => ({
        id: n.id, label: n.data.label, description: '', icon: '', zone: '',
        resources: [], requires: [],
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    }
    const positions = computeAutoLayout(tree, 'rpg', newDir, { w: 224, h: 180 })
    applyAutoLayout(positions, newDir)
    // BuilderNode.useEffect calls updateNodeInternals after React commits the new
    // handle positions. fitView is deferred to run after that measurement.
    setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 80)
  }, [layoutDir, edges, applyAutoLayout, fitView])

  // ── Smart "add at viewport centre" ────────────────────────────────────────
  function handleAddNode() {
    const wrapper = document.querySelector('.builder-rf-wrapper') as HTMLElement | null
    const rect = wrapper?.getBoundingClientRect()

    // .builder-rf-wrapper is flex-1 and already excludes the editor panel,
    // so its bounding rect IS the leftover canvas area — use 0.5 for true centre.
    const screenCenter = rect
      ? { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 }
      : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }

    const fc = screenToFlowPosition(screenCenter)
    addNode(findFreePosition(fc.x, fc.y, nodesRef.current))
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      // Global shortcuts (work even in preview mode)
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(!showShortcuts); return }
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return }
        setContextMenu(null)
        if (selectedNodeId) setSelectedNodeId(null)
        return
      }

      if (isPreviewMode) return

      // Tool + add shortcuts (no modifier)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 'v' || e.key === 'V') { setActiveTool('select'); return }
        if (e.key === 'h' || e.key === 'H') { setActiveTool('pan'); return }
        if (e.key === 'n' || e.key === 'N') {
          // Place new node exactly where the cursor currently is
          setActiveTool('select')
          const pos = screenToFlowPosition(mousePosRef.current)
          addNode(pos)
          return
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' || e.key === 'A') { e.preventDefault(); selectAllNodes(); return }
        if (e.key === 'l' || e.key === 'L') { e.preventDefault(); handleLayoutToggle(); return }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, selectedNodeId, showShortcuts, handleLayoutToggle, selectAllNodes])

  // ── Pane click handler ─────────────────────────────────────────────────────
  const handlePaneClick = useCallback(
    (event: MouseEvent) => {
      setContextMenu(null)
      if (selectedNodeId) {
        setSelectedNodeId(null)
        return
      }
      // Double-click on bare canvas adds a node at cursor
      if (event.detail === 2) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        addNode(position)
      }
    },
    [selectedNodeId, setSelectedNodeId, addNode, screenToFlowPosition],
  )

  // ── Context menu item builders ─────────────────────────────────────────────
  function getNodeMenuItems(nodeId: string): ContextMenuItem[] {
    return [
      {
        label: 'Edit node', icon: 'edit', shortcut: 'Click',
        onClick: () => setSelectedNodeId(nodeId),
      },
      {
        label: 'Duplicate', icon: 'content_copy', shortcut: 'Ctrl+D',
        onClick: () => duplicateNode(nodeId),
      },
      { divider: true },
      {
        label: 'Delete node', icon: 'delete', danger: true,
        onClick: () => { deleteNode(nodeId); setSelectedNodeId(null) },
      },
    ]
  }

  function getPaneMenuItems(flowX: number, flowY: number): ContextMenuItem[] {
    return [
      {
        label: 'Add node here', icon: 'add_circle',
        onClick: () => { addNode({ x: flowX - 104, y: flowY - 90 }); setActiveTool('select') },
      },
      { divider: true },
      {
        label: 'Select all', icon: 'select_all', shortcut: 'Ctrl+A',
        onClick: selectAllNodes,
        disabled: nodes.length === 0,
      },
      {
        label: 'Fit view', icon: 'center_focus_strong',
        onClick: () => fitView({ duration: 400, padding: 0.2 }),
      },
      {
        label: `Auto-layout (${layoutDir === 'TB' ? 'LR' : 'TB'})`, icon: 'auto_graph', shortcut: 'Ctrl+L',
        onClick: handleLayoutToggle,
        disabled: nodes.length === 0,
      },
      { divider: true },
      {
        label: 'Shortcuts & guide', icon: 'help', shortcut: '?',
        onClick: () => setShowShortcuts(true),
      },
    ]
  }

  // ── Preview mode ────────────────────────────────────────────────────────────
  if (isPreviewMode) {
    const previewTree: SkillTree = {
      treeId: meta.treeId || 'preview',
      title: meta.title || 'Preview',
      category: meta.category || 'Preview',
      difficulty: meta.difficulty,
      description: meta.description,
      version: meta.version || '1.0',
      estimatedMonths: meta.estimatedMonths,
      totalNodes: nodes.length,
      icon: meta.icon || 'school',
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.data.label,
        description: n.data.description,
        icon: n.data.icon,
        zone: n.data.zone,
        resources: n.data.resources,
        requires: edges.filter(e => e.target === n.id).map(e => e.source),
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    }
    return (
      <>
        <div className="absolute inset-0">
          <SkillCanvas tree={previewTree} initialCompletedIds={[]} userRating={null} preview />
        </div>
        <AnimatePresence>
          {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
        </AnimatePresence>
      </>
    )
  }

  // ── Build mode ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Custom selection-box colours that match the dark theme */}
      <style>{`
        .builder-rf-wrapper .react-flow__selection {
          background: rgba(0,240,255,0.04) !important;
          border: 1.5px dashed rgba(0,240,255,0.50) !important;
          border-radius: 6px;
        }
        .builder-rf-wrapper .react-flow__nodesselection-rect {
          background: rgba(0,240,255,0.04) !important;
          border: 1.5px solid rgba(0,240,255,0.40) !important;
          border-radius: 6px;
        }
      `}</style>

      <div className="absolute inset-0 flex">
        {/*
          Track cursor position inside the canvas so pressing N places
          the new node exactly under the mouse pointer.
        */}
        <div
          className="flex-1 relative builder-rf-wrapper"
          onMouseMove={e => { mousePosRef.current = { x: e.clientX, y: e.clientY } }}
        >
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-slate-800 block mb-4">account_tree</span>
                <p className="text-slate-500 text-sm font-medium">Double-click anywhere to add a node</p>
                <p className="text-slate-600 text-xs mt-1.5">
                  Or press{' '}
                  <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 font-mono text-[10px]">N</kbd>
                  {' '}to add at cursor · Right-click for more options
                </p>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={handlePaneClick}
            onNodeClick={(_, node) => { setContextMenu(null); setSelectedNodeId(node.id) }}
            onNodeContextMenu={(e, node) => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
              setSelectedNodeId(node.id)
            }}
            onPaneContextMenu={e => {
              e.preventDefault()
              const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
              setContextMenu({ x: e.clientX, y: e.clientY, flowX: pos.x, flowY: pos.y })
            }}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Delete', 'Backspace']}
            colorMode="dark"
            // Multi-select: drag rectangle in select mode; Ctrl+click adds to selection
            selectionOnDrag={activeTool === 'select'}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Control"
            // Select mode: drag nodes; middle-mouse pans
            // Pan mode: left-click drag pans, nodes locked
            panOnDrag={activeTool === 'pan' ? true : [1]}
            nodesDraggable={activeTool !== 'pan'}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#374151', strokeWidth: 2, strokeDasharray: '6 4' },
            }}
            style={{ background: '#030712' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#374151"
            />
          </ReactFlow>

          {/* Metadata panel — floating top-left overlay */}
          <MetadataPanel />

          {/* Unified left-side toolbar */}
          <LeftToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onAddNode={handleAddNode}
          />
        </div>

        {/* Right panel — node editor (manages own visibility + animation) */}
        <BuilderNodeEditor />
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            key="ctx"
            x={contextMenu.x}
            y={contextMenu.y}
            items={
              contextMenu.nodeId
                ? getNodeMenuItems(contextMenu.nodeId)
                : getPaneMenuItems(contextMenu.flowX ?? 0, contextMenu.flowY ?? 0)
            }
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Shortcuts / guide modal */}
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>
    </>
  )
}

// ─── Public export — wraps with ReactFlowProvider + BuilderHeader ────────────

export default function BuilderCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      {/* Canvas fills the full container; header floats on top as an overlay */}
      <div className="relative w-full h-full overflow-hidden">
        <BuilderCanvasInner {...props} />
        <BuilderHeader />
      </div>
    </ReactFlowProvider>
  )
}
