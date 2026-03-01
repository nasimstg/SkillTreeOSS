'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useBuilderStore } from '@/lib/builder-store'
import { treeToDraft, type BuilderDraft } from '@/lib/builder-utils'
import type { SkillTree } from '@/types/tree'

import { BuilderNode } from '@/components/builder/BuilderNode'
import { BuilderNodeEditor } from '@/components/builder/BuilderNodeEditor'
import { BuilderToolbar } from '@/components/builder/BuilderToolbar'
import SkillCanvas from '@/components/canvas/SkillCanvas'

const NODE_TYPES = { builderNode: BuilderNode }

interface Props {
  existingTree?: SkillTree | null  // pre-populated for "edit" mode
  initialDraft?: BuilderDraft | null  // resumed from DB/localStorage
}

// ─── Inner canvas (needs ReactFlowProvider context) ───────────────────────────

function BuilderCanvasInner({ existingTree, initialDraft }: Props) {
  const { screenToFlowPosition } = useReactFlow()
  const toolbarHeight = useRef(0)

  const nodes           = useBuilderStore(s => s.nodes)
  const edges           = useBuilderStore(s => s.edges)
  const onNodesChange   = useBuilderStore(s => s.onNodesChange)
  const onEdgesChange   = useBuilderStore(s => s.onEdgesChange)
  const onConnect       = useBuilderStore(s => s.onConnect)
  const addNode         = useBuilderStore(s => s.addNode)
  const loadDraft       = useBuilderStore(s => s.loadDraft)
  const hydrateFromLocal = useBuilderStore(s => s.hydrateFromLocal)
  const isPreviewMode   = useBuilderStore(s => s.isPreviewMode)
  const selectedNodeId  = useBuilderStore(s => s.selectedNodeId)
  const setSelectedNodeId = useBuilderStore(s => s.setSelectedNodeId)
  const meta            = useBuilderStore(s => s.meta)
  const resetBuilder    = useBuilderStore(s => s.resetBuilder)

  // Load tree data on mount (priority: existingTree > initialDraft > localStorage)
  useEffect(() => {
    resetBuilder()
    if (existingTree) {
      const draft = treeToDraft(existingTree)
      loadDraft(draft.nodes, draft.edges, draft.meta, existingTree.treeId)
    } else if (initialDraft) {
      loadDraft(initialDraft.nodes, initialDraft.edges, initialDraft.meta)
    } else {
      hydrateFromLocal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (selectedNodeId) {
        setSelectedNodeId(null)
        return
      }
      // Double-click on pane adds a new node
      if (event.detail === 2) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        addNode(position)
      }
    },
    [selectedNodeId, setSelectedNodeId, addNode, screenToFlowPosition],
  )

  // ── Preview mode ────────────────────────────────────────────────────────────
  if (isPreviewMode) {
    const previewTree: SkillTree = {
      treeId:          meta.treeId || 'preview',
      title:           meta.title || 'Preview',
      category:        meta.category || 'Preview',
      difficulty:      meta.difficulty,
      description:     meta.description,
      version:         meta.version || '1.0',
      estimatedMonths: meta.estimatedMonths,
      totalNodes:      nodes.length,
      icon:            meta.icon || 'school',
      nodes: nodes.map(n => ({
        id:          n.id,
        label:       n.data.label,
        description: n.data.description,
        icon:        n.data.icon,
        zone:        n.data.zone,
        resources:   n.data.resources,
        requires:    edges.filter(e => e.target === n.id).map(e => e.source),
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    }
    return (
      <div className="absolute inset-0 top-12">
        <SkillCanvas tree={previewTree} initialCompletedIds={[]} userRating={null} />
      </div>
    )
  }

  // ── Build mode ──────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 top-12 flex">
      <div className="flex-1 relative">
        {/* Empty state hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-slate-700 block mb-3">account_tree</span>
              <p className="text-slate-500 text-sm">Double-click anywhere on the canvas to add a node</p>
              <p className="text-slate-600 text-xs mt-1">Or drag from the panel on the left</p>
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
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode="Delete"
          colorMode="dark"
          defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
          style={{ background: 'var(--color-background-dark, #0f0f0f)' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e1e1e"
          />
          <Controls
            className="!border-white/10 !bg-[#1a1a1a]"
            showInteractive={false}
          />
          <MiniMap
            nodeColor="#1a1a1a"
            maskColor="rgba(0,0,0,0.6)"
            className="!border-white/10 !bg-[#1a1a1a] !rounded-xl"
          />

          {/* Left panel — add node button */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => addNode({ x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-slate-300 text-xs hover:text-white hover:border-white/20 transition-colors shadow-lg"
              title="Add node (or double-click canvas)"
            >
              <span className="material-symbols-outlined text-sm text-primary">add_circle</span>
              Add Node
            </button>
          </div>
        </ReactFlow>
      </div>

      {/* Right panel — node editor */}
      {selectedNodeId && <BuilderNodeEditor />}
    </div>
  )
}

// ─── Public export — wraps with ReactFlowProvider ────────────────────────────

export default function BuilderCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        <BuilderToolbar />
        <BuilderCanvasInner {...props} />
      </div>
    </ReactFlowProvider>
  )
}
