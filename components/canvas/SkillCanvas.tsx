'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useSkillTreeStore } from '@/lib/store'
import { getNodeStatus, getProgressPercent } from '@/lib/utils'
import { computeAutoLayout } from '@/lib/autoLayout'
import { allNodeTypes } from './CustomNode'
import NodeSidebar from './NodeSidebar'
import CanvasFAB, { type LayoutDir } from './CanvasFAB'
import CanvasContextMenu, { type ContextMenuState } from './CanvasContextMenu'
import type { SkillTree, CanvasView, TreeNode } from '@/types/tree'
import type { SkillNodeData } from './CustomNode'

interface Props {
  tree: SkillTree
  initialCompletedIds?: string[]
}

// ─── position helpers ────────────────────────────────────────────────────────

function getPosition(node: TreeNode, dir: LayoutDir) {
  // position is optional — trees without it rely entirely on posOverrides (Dagre)
  if (!node.position) return { x: 0, y: 0 }
  if (dir === 'LR') return node.position
  // TB: swap axes and rescale so the tree reads top → bottom
  return { x: node.position.y * 2, y: node.position.x * 0.55 }
}

// ─── node / edge builders ────────────────────────────────────────────────────

function buildNodes(
  tree: SkillTree,
  completedIds: string[],
  view: CanvasView,
  dir: LayoutDir,
  posOverrides?: Record<string, { x: number; y: number }>,
  animatingNodes: Record<string, 'completing' | 'unlocking'> = {},
  requiredNodeIds: string[] = [],
  lockedSelectedId: string | null = null,
  hoveredPrereqId: string | null = null,
): Node[] {
  const isFocusMode = lockedSelectedId !== null

  return tree.nodes.map((node) => {
    const status = getNodeStatus(node, completedIds)
    const data: SkillNodeData = {
      label: node.label,
      description: node.description,
      icon: node.icon,
      zone: node.zone,
      status,
      view,
      animationState: animatingNodes[node.id],
      highlightRequired: requiredNodeIds.includes(node.id),
    }

    const position = posOverrides?.[node.id] ?? getPosition(node, dir)

    // Focus mode: dim every node that isn't the selected locked node or a required prereq
    const dimmed = isFocusMode
      && node.id !== lockedSelectedId
      && !requiredNodeIds.includes(node.id)

    return {
      id: node.id,
      type: view,
      position,
      data: data as unknown as Record<string, unknown>,
      draggable: true,
      style: {
        opacity: dimmed ? 0.30 : 1,
        transition: 'opacity 0.25s ease',
      },
    }
  })
}

function buildEdges(
  tree: SkillTree,
  completedIds: string[],
  view: CanvasView,
  lockedSelectedId: string | null = null,
  requiredNodeIds: string[] = [],
): Edge[] {
  return tree.edges.map((edge) => {
    const srcDone = completedIds.includes(edge.source)
    const tgtDone = completedIds.includes(edge.target)
    const isActive = srcDone && tgtDone
    const isPath = srcDone && !tgtDone

    // Required path: edge leads TO the locked node from an unmet prereq,
    // OR both endpoints are unmet prerequisites in the chain.
    const isRequired =
      lockedSelectedId !== null &&
      (
        (edge.target === lockedSelectedId && requiredNodeIds.includes(edge.source)) ||
        (requiredNodeIds.includes(edge.target) && requiredNodeIds.includes(edge.source))
      )

    let stroke = '#585858'
    let dashArray = '5 5'
    let animated = false
    let opacity = 0.7
    let strokeWidth = 1.5
    let edgeType = 'smoothstep'
    let arrowW = 11
    let arrowH = 11
    let markerType = MarkerType.ArrowClosed
    let linecap: 'round' | 'square' | 'butt' = 'round'
    let linejoin: 'round' | 'miter' | 'bevel' = 'round'
    let pathOptions: Record<string, unknown> = {}

    if (view === 'rpg') {
      // ── Fantasy Quest Board ─────────────────────────────────────────────
      // Moderate corner radius — deliberate, board-game quest paths.
      edgeType = 'smoothstep'; pathOptions = { borderRadius: 10 }
      arrowW = 12; arrowH = 12; linecap = 'round'; linejoin = 'round'
      if (isActive) {
        stroke = '#11d452'; dashArray = '0'; animated = true
        strokeWidth = 2.5; opacity = 0.85
      } else if (isPath) {
        stroke = '#2b95ff'; dashArray = '6 4'
        strokeWidth = 2; opacity = 0.65
      } else {
        stroke = '#585858'; dashArray = '5 5'
        strokeWidth = 1.5; opacity = 0.7
      }

    } else if (view === 'worldmap') {
      // ── Geographic / Treasure Map ────────────────────────────────────────
      // Large corner radius + round linecap/linejoin = winding road aesthetics.
      edgeType = 'smoothstep'; pathOptions = { borderRadius: 28 }
      arrowW = 16; arrowH = 16; linecap = 'round'; linejoin = 'round'
      if (isActive) {
        stroke = '#11d452'; dashArray = '12 5'
        strokeWidth = 4; opacity = 0.7
      } else if (isPath) {
        stroke = '#f59e0b'; dashArray = '5 8'
        strokeWidth = 2.5; opacity = 0.65
      } else {
        stroke = '#585858'; dashArray = '3 7'
        strokeWidth = 1.5; opacity = 0.7
      }

    } else if (view === 'terminal') {
      // ── BST / Code Diagram ───────────────────────────────────────────────
      // Right-angle step routing + open arrow heads + square linecap = schematic/circuit feel.
      edgeType = 'step'
      arrowW = 8; arrowH = 8; markerType = MarkerType.Arrow; linecap = 'square'; linejoin = 'miter'
      if (isActive) {
        stroke = '#11d452'; dashArray = '0'
        strokeWidth = 1.5; opacity = 0.7
      } else if (isPath) {
        stroke = '#2b95ff'; dashArray = '3 3'
        strokeWidth = 1.5; opacity = 0.55
      } else {
        stroke = '#585858'; dashArray = '2 4'
        strokeWidth = 1; opacity = 0.7
      }

    } else if (view === 'neural') {
      // ── Neural / Organic Sci-Fi ──────────────────────────────────────────
      // Deep bezier curvature + round linecap = organic synapse signal paths.
      edgeType = 'default'; pathOptions = { curvature: 0.45 }
      arrowW = 14; arrowH = 14; linecap = 'round'; linejoin = 'round'
      if (isActive) {
        stroke = '#11d452'; dashArray = '0'; animated = true
        strokeWidth = 3; opacity = 0.8
      } else if (isPath) {
        stroke = '#2b95ff'; dashArray = '0'
        strokeWidth = 1.5; opacity = 0.45
      } else {
        stroke = '#585858'; dashArray = '4 5'
        strokeWidth = 1.5; opacity = 0.7
      }
    }

    // Focus mode: dim all non-required edges so the prereq path stands out
    if (lockedSelectedId !== null && !isRequired) {
      opacity = opacity * 0.15
    }

    // Amber required-path override — only on incomplete edges (completed ones keep their green)
    if (isRequired && !isActive) {
      stroke = '#f59e0b'
      dashArray = '6 3'
      opacity = 0.9
      animated = false
      strokeWidth = Math.max(strokeWidth, 2)
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated,
      style: {
        stroke,
        strokeDasharray: dashArray,
        opacity,
        strokeWidth,
        strokeLinecap: linecap,
        strokeLinejoin: linejoin,
      },
      type: edgeType,
      pathOptions,
      markerEnd: {
        type: markerType,
        width: arrowW,
        height: arrowH,
        color: stroke,
      },
    } as Edge
  })
}

// ─── view label map ──────────────────────────────────────────────────────────

const VIEW_LABEL: Record<CanvasView, string> = {
  worldmap: 'World Map Explorer',
  rpg: 'RPG Quest Board',
  terminal: 'Terminal Inspector',
  neural: 'Neural Path',
}

const DIFF_STYLE: Record<string, string> = {
  beginner: 'text-primary border-primary/40',
  intermediate: 'text-yellow-400 border-yellow-400/40',
  hard: 'text-red-400 border-red-400/40',
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SkillCanvas({ tree, initialCompletedIds = [] }: Props) {
  const {
    completedNodeIds,
    setCompletedNodeIds,
    setCurrentTree,
    canvasView,
    setSelectedNode,
    selectedNode,
    hoveredPrereqId,
  } = useSkillTreeStore()

  const [layoutDir, setLayoutDir] = useState<LayoutDir>('LR')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  // Dagre-computed positions. Lazy-initialised on mount when the tree has no
  // stored positions (the common case). null = fall back to JSON position field.
  const [autoPositions, setAutoPositions] = useState<Record<string, { x: number; y: number }> | null>(
    () => tree.nodes.some((n) => !n.position) ? computeAutoLayout(tree, 'worldmap', 'LR') : null,
  )
  // Per-node animation state: 'completing' | 'unlocking' (cleared after animation)
  const [animatingNodes, setAnimatingNodes] = useState<Record<string, 'completing' | 'unlocking'>>({})
  const prevCompletedIdsRef = useRef<string[]>([])
  // Tracks whether the last selectedNode change came from a canvas click,
  // so we don't double-center when the sidebar also triggers centering.
  const clickedFromCanvasRef = useRef(false)

  // ── prerequisite highlighting ──────────────────────────────────────────────
  // When a locked node is selected, highlight its unmet prerequisites.
  const lockedSelectedId = useMemo(() => {
    if (!selectedNode) return null
    const status = getNodeStatus(selectedNode, completedNodeIds)
    return status === 'locked' ? selectedNode.id : null
  }, [selectedNode, completedNodeIds])

  const requiredNodeIds = useMemo(() => {
    if (!lockedSelectedId || !selectedNode) return []
    // BFS through the full ancestor chain to find every node that must be
    // completed before the selected locked node can be unlocked.
    const visited = new Set<string>()
    const queue = [...selectedNode.requires]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const ancestor = tree.nodes.find((n) => n.id === id)
      if (ancestor) {
        ancestor.requires.forEach((reqId) => {
          if (!visited.has(reqId)) queue.push(reqId)
        })
      }
    }
    // Only highlight nodes that aren't completed yet
    return Array.from(visited).filter((id) => !completedNodeIds.includes(id))
  }, [lockedSelectedId, selectedNode, completedNodeIds, tree.nodes])

  // Wrap setLayoutDir so switching direction clears any auto-arrange override
  const handleLayoutDirChange = useCallback((dir: LayoutDir) => {
    setLayoutDir(dir)
    setAutoPositions(null)
  }, [])

  // Holds the ReactFlow instance so we can call fitView from outside the RF context
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Init on mount
  useEffect(() => {
    setCurrentTree(tree)
    if (initialCompletedIds.length > 0) setCompletedNodeIds(initialCompletedIds)
  }, [tree, initialCompletedIds, setCurrentTree, setCompletedNodeIds])

  // Detect newly completed + newly unlocked nodes and trigger animations
  useEffect(() => {
    const prev = prevCompletedIdsRef.current
    prevCompletedIdsRef.current = completedNodeIds

    const newlyCompleted = completedNodeIds.filter((id) => !prev.includes(id))
    if (newlyCompleted.length === 0) return

    const next: Record<string, 'completing' | 'unlocking'> = {}
    newlyCompleted.forEach((id) => { next[id] = 'completing' })

    // Nodes that just became available (all requires now satisfied)
    tree.nodes.forEach((node) => {
      if (completedNodeIds.includes(node.id)) return
      const wasAvail = node.requires.every((r) => prev.includes(r))
      const isAvail = node.requires.every((r) => completedNodeIds.includes(r))
      if (!wasAvail && isAvail) next[node.id] = 'unlocking'
    })

    setAnimatingNodes(next)
    const t = setTimeout(() => setAnimatingNodes({}), 1100)
    return () => clearTimeout(t)
  }, [completedNodeIds, tree.nodes])

  // Rebuild graph whenever view, progress, layout direction, auto-positions, or animation states change.
  // Always sync the ReactFlow `selected` flag with selectedNode from the store so sidebar
  // navigation (clicking a prereq) immediately shows the selection ring on canvas.
  useEffect(() => {
    setNodes(() => {
      return buildNodes(tree, completedNodeIds, canvasView, layoutDir, autoPositions ?? undefined, animatingNodes, requiredNodeIds, lockedSelectedId, hoveredPrereqId)
        .map((n) => ({ ...n, selected: n.id === selectedNode?.id }))
    })
    setEdges(buildEdges(tree, completedNodeIds, canvasView, lockedSelectedId, requiredNodeIds))
  }, [tree, completedNodeIds, canvasView, layoutDir, autoPositions, animatingNodes, requiredNodeIds, lockedSelectedId, selectedNode, hoveredPrereqId, setNodes, setEdges])

  // ── center canvas on node within the visible area (canvas minus sidebar) ──
  const centerOnSelectedNode = useCallback((nodeId: string) => {
    if (!rfInstance.current) return
    const rfNode = rfInstance.current.getNodes().find((n) => n.id === nodeId)
    if (!rfNode) return
    const nodeW = (rfNode.measured as { width?: number } | undefined)?.width ?? 120
    const nodeH = (rfNode.measured as { height?: number } | undefined)?.height ?? 160
    const nodeCX = rfNode.position.x + nodeW / 2
    const nodeCY = rfNode.position.y + nodeH / 2

    const vw = window.innerWidth
    const vh = window.innerHeight
    // Sidebar width matches the CSS: md:w-[500px] mobile:full
    const sidebarW = vw >= 768 ? 500 : 0

    // Center of the remaining visible canvas area in screen px
    const screenCX = (vw - sidebarW) / 2
    const screenCY = vh / 2

    // Only zoom in if below threshold — never zoom out
    const currentZoom = rfInstance.current.getZoom()
    const targetZoom = Math.max(currentZoom, 1.5) - .5

    // viewport transform:  screen = graph * zoom + offset
    //                    → offset = screenCenter - graphCenter * zoom
    rfInstance.current.setViewport(
      { x: screenCX - nodeCX * targetZoom, y: screenCY - nodeCY * targetZoom, zoom: targetZoom },
      { duration: 600 },
    )
  }, [])

  // ── center canvas when selectedNode is set from outside the canvas ──────────
  // (e.g. clicking a prereq in NodeSidebar). Canvas clicks set the flag first to
  // prevent double-centering since they call centerOnSelectedNode directly.
  useEffect(() => {
    if (!selectedNode) return
    if (clickedFromCanvasRef.current) {
      clickedFromCanvasRef.current = false
      return
    }
    // Small delay so ReactFlow has time to process the node rebuild before panning
    const t = setTimeout(() => centerOnSelectedNode(selectedNode.id), 50)
    return () => clearTimeout(t)
  }, [selectedNode, centerOnSelectedNode])

  // ── node left-click → open sidebar ────────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      const treeNode = tree.nodes.find((n) => n.id === node.id)
      if (treeNode) {
        clickedFromCanvasRef.current = true
        setSelectedNode(treeNode)
        centerOnSelectedNode(node.id)
      }
    },
    [tree.nodes, setSelectedNode, centerOnSelectedNode],
  )

  // ── context menu handlers ──────────────────────────────────────────────────
  const onPaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ type: 'canvas', x: e.clientX, y: e.clientY })
  }, [])

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (e, node) => {
      e.preventDefault()
      e.stopPropagation()
      const treeNode = tree.nodes.find((n) => n.id === node.id)
      if (treeNode) setContextMenu({ type: 'node', x: e.clientX, y: e.clientY, node: treeNode })
    },
    [tree.nodes],
  )

  // ── fitView helper (used by FAB via rfInstance + context menu) ─────────────
  const handleFitView = useCallback(() => {
    rfInstance.current?.fitView({ duration: 600, padding: 0.15 })
  }, [])

  // ── layout toggle (used by context menu; FAB uses its own via useReactFlow) ─
  const handleLayoutToggle = useCallback(() => {
    const next = layoutDir === 'LR' ? 'TB' : 'LR'
    setLayoutDir(next)
    setAutoPositions(null) // clear override so direction switch uses JSON positions
    setTimeout(() => rfInstance.current?.fitView({ duration: 600, padding: 0.15 }), 80)
  }, [layoutDir])

  // ── auto-arrange via dagre ─────────────────────────────────────────────────
  const handleAutoArrange = useCallback(() => {
    const positions = computeAutoLayout(tree, canvasView, layoutDir)
    setAutoPositions(positions)
    setTimeout(() => rfInstance.current?.fitView({ duration: 700, padding: 0.18 }), 80)
  }, [tree, canvasView, layoutDir])

  const progress = getProgressPercent(completedNodeIds, tree.totalNodes)
  const completedCount = completedNodeIds.length
  // Terminal gets a tight grid (suits the aesthetic); everything else gets subtle dots
  const bgVariant = canvasView === 'terminal' ? BackgroundVariant.Lines : BackgroundVariant.Dots

  return (
    <div className="relative w-full h-full bg-background-dark">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={allNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={() => setContextMenu(null)}
        onInit={(instance) => { rfInstance.current = instance }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        className="bg-background-dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={bgVariant}
          gap={
            canvasView === 'terminal' ? 20 :
              canvasView === 'neural' ? 28 : 36
          }
          size={canvasView === 'neural' ? 2 : 1.5}
          color="#171717"
        />

        {/* ── Floating info pill (top-left) ── */}
        <Panel position="top-left" className="!m-4">
          <div className="bg-background-dark/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-64">

            {/* Row 1 — identity */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl leading-none">
                  {tree.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-white leading-snug truncate">
                  {tree.title}
                </h1>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none mt-0.5">
                  {VIEW_LABEL[canvasView]}
                </p>
              </div>
              <span
                className={`shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${DIFF_STYLE[tree.difficulty] ?? 'text-slate-400 border-slate-400/40'
                  }`}
              >
                {tree.difficulty}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-4" />

            {/* Row 2 — progress */}
            <div className="px-4 pt-2.5 pb-3.5">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-slate-500 font-medium">
                  {completedCount} / {tree.totalNodes} nodes
                </span>
                <span className="text-primary font-black tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-dark overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    boxShadow: progress > 0 ? '0 0 8px rgba(17,212,82,0.6)' : 'none',
                  }}
                />
              </div>
              {/* Category + time estimate */}
              <p className="text-[9px] text-slate-600 mt-1.5 leading-tight">
                {tree.category} · ~{tree.estimatedMonths} months
              </p>
            </div>
          </div>
        </Panel>

        {/* ── Canvas controls pill (bottom-center) ── */}
        <Panel position="bottom-left" className="!mb-5">
          <CanvasFAB
            layoutDir={layoutDir}
            onLayoutDirChange={handleLayoutDirChange}
            onAutoArrange={handleAutoArrange}
          />
        </Panel>
      </ReactFlow>

      {/* Node detail sidebar — rendered outside ReactFlow so it overlays correctly */}
      <NodeSidebar tree={tree} />

      {/* Context menu — rendered outside ReactFlow, uses fixed positioning */}
      {contextMenu && (
        <CanvasContextMenu
          menu={contextMenu}
          layoutDir={layoutDir}
          treeId={tree.treeId}
          onClose={() => setContextMenu(null)}
          onFitView={handleFitView}
          onLayoutToggle={handleLayoutToggle}
          onAutoArrange={handleAutoArrange}
        />
      )}
    </div>
  )
}
