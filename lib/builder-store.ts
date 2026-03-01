'use client'

import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react'
import type { BuilderNodeData, BuilderMeta } from '@/lib/builder-utils'
import {
  saveDraftToLocal,
  loadDraftFromLocal,
  newNodeId,
  newEdgeId,
} from '@/lib/builder-utils'

const DEFAULT_META: BuilderMeta = {
  treeId:          '',
  title:           '',
  category:        '',
  difficulty:      'medium',
  description:     '',
  estimatedMonths: 3,
  icon:            'school',
  version:         '1.0',
}

interface BuilderState {
  meta:            BuilderMeta
  nodes:           Node<BuilderNodeData>[]
  edges:           Edge[]
  selectedNodeId:  string | null
  isPreviewMode:   boolean
  isDirty:         boolean
  draftId:         string   // 'default' for new, treeId for edits

  // Meta actions
  setMeta:         (partial: Partial<BuilderMeta>) => void

  // ReactFlow handlers
  onNodesChange:   (changes: NodeChange[]) => void
  onEdgesChange:   (changes: EdgeChange[]) => void
  onConnect:       (connection: Connection) => void

  // Node actions
  addNode:         (position: { x: number; y: number }, zone?: string) => string
  updateNodeData:  (id: string, data: Partial<BuilderNodeData>) => void
  deleteNode:      (id: string) => void
  setSelectedNodeId: (id: string | null) => void

  // Preview mode
  setPreviewMode:  (enabled: boolean) => void

  // Load a full tree into the builder (edit-existing flow)
  loadDraft:       (nodes: Node<BuilderNodeData>[], edges: Edge[], meta: BuilderMeta, draftId?: string) => void
  resetBuilder:    () => void

  // Persistence
  persistDraft:    () => void
  hydrateFromLocal: () => void
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  meta:           { ...DEFAULT_META },
  nodes:          [],
  edges:          [],
  selectedNodeId: null,
  isPreviewMode:  false,
  isDirty:        false,
  draftId:        'default',

  setMeta: (partial) => {
    set(s => ({ meta: { ...s.meta, ...partial }, isDirty: true }))
    get().persistDraft()
  },

  onNodesChange: (changes) => {
    set(s => ({
      nodes:   applyNodeChanges(changes, s.nodes) as Node<BuilderNodeData>[],
      isDirty: true,
    }))
    get().persistDraft()
  },

  onEdgesChange: (changes) => {
    set(s => ({ edges: applyEdgeChanges(changes, s.edges), isDirty: true }))
    get().persistDraft()
  },

  onConnect: (connection) => {
    set(s => ({
      edges: addEdge(
        { ...connection, id: newEdgeId(connection.source, connection.target), type: 'smoothstep' },
        s.edges,
      ),
      isDirty: true,
    }))
    get().persistDraft()
  },

  addNode: (position, zone = '') => {
    const id: string = newNodeId()
    const newNode: Node<BuilderNodeData> = {
      id,
      type: 'builderNode',
      position,
      data: {
        label:       'New Node',
        description: '',
        icon:        'school',
        zone,
        resources:   [],
      },
    }
    set(s => ({ nodes: [...s.nodes, newNode], selectedNodeId: id, isDirty: true }))
    get().persistDraft()
    return id
  },

  updateNodeData: (id, data) => {
    set(s => ({
      nodes: s.nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    }))
    get().persistDraft()
  },

  deleteNode: (id) => {
    set(s => ({
      nodes:          s.nodes.filter(n => n.id !== id),
      edges:          s.edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      isDirty:        true,
    }))
    get().persistDraft()
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),

  loadDraft: (nodes, edges, meta, draftId = 'default') => {
    set({ nodes, edges, meta, selectedNodeId: null, isPreviewMode: false, isDirty: false, draftId })
  },

  resetBuilder: () => {
    set({
      meta:           { ...DEFAULT_META },
      nodes:          [],
      edges:          [],
      selectedNodeId: null,
      isPreviewMode:  false,
      isDirty:        false,
      draftId:        'default',
    })
  },

  persistDraft: () => {
    const { meta, nodes, edges, draftId } = get()
    saveDraftToLocal({ meta, nodes, edges }, draftId)
  },

  hydrateFromLocal: () => {
    const { draftId } = get()
    const draft = loadDraftFromLocal(draftId)
    if (draft) {
      set({ meta: draft.meta, nodes: draft.nodes, edges: draft.edges, isDirty: false })
    }
  },
}))
