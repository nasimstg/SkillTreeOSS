'use client'

import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react'
import type { BuilderNodeData, BuilderMeta, CustomZone } from '@/lib/builder-utils'
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
  layoutDir:       'LR' | 'TB'
  showShortcuts:   boolean

  // Custom zones + recent icons
  customZones:     CustomZone[]
  recentIcons:     string[]

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

  // Layout
  setLayoutDir:    (dir: 'LR' | 'TB') => void
  applyAutoLayout: (positions: Record<string, { x: number; y: number }>, dir: 'LR' | 'TB', markDirty?: boolean) => void

  // Shortcuts + multi-select helpers
  setShowShortcuts: (b: boolean) => void
  duplicateNode:    (id: string) => string
  selectAllNodes:   () => void

  // Zone actions
  addCustomZone:    (name: string, color: string) => void
  updateCustomZone: (oldName: string, partial: Partial<CustomZone>) => void
  removeCustomZone: (name: string) => void

  // Icon recents
  trackIconUsed:    (icon: string) => void

  // Load a full tree into the builder (edit-existing flow)
  loadDraft:       (nodes: Node<BuilderNodeData>[], edges: Edge[], meta: BuilderMeta, draftId?: string, customZones?: CustomZone[], recentIcons?: string[]) => void
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
  layoutDir:      'TB',
  showShortcuts:  false,
  customZones:    [],
  recentIcons:    [],

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

  addCustomZone: (name, color) => {
    if (get().customZones.find(z => z.name === name)) return
    set(s => ({ customZones: [...s.customZones, { name, color }], isDirty: true }))
    get().persistDraft()
  },

  updateCustomZone: (oldName, partial) => {
    set(s => ({
      customZones: s.customZones.map(z => z.name === oldName ? { ...z, ...partial } : z),
      // If renaming, migrate all nodes using the old zone name
      nodes: partial.name !== undefined
        ? s.nodes.map(n =>
            n.data.zone === oldName ? { ...n, data: { ...n.data, zone: partial.name! } } : n
          )
        : s.nodes,
      isDirty: true,
    }))
    get().persistDraft()
  },

  removeCustomZone: (name) => {
    set(s => ({
      customZones: s.customZones.filter(z => z.name !== name),
      // Reset zone on nodes that used the deleted zone
      nodes: s.nodes.map(n =>
        n.data.zone === name ? { ...n, data: { ...n.data, zone: '' } } : n
      ),
      isDirty: true,
    }))
    get().persistDraft()
  },

  setLayoutDir: (dir) => set({ layoutDir: dir }),

  applyAutoLayout: (positions, dir, markDirty = true) => {
    set(s => ({
      layoutDir: dir,
      nodes: s.nodes.map(n => {
        const pos = positions[n.id]
        if (!pos) return n
        return { ...n, position: pos }
      }),
      isDirty: markDirty ? true : s.isDirty,
    }))
  },

  setShowShortcuts: (b) => set({ showShortcuts: b }),

  duplicateNode: (id) => {
    const s = get()
    const original = s.nodes.find(n => n.id === id)
    if (!original) return ''
    const newId = newNodeId()

    // Find a nearby free slot so duplicates never stack on top of each other
    const W = 240, H = 212
    const base = original.position
    const candidates: [number, number][] = [
      [1, 0], [0, 1], [-1, 0], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [2, 0], [0, 2], [-2, 0], [0, -2],
    ]
    let pos = { x: base.x + 48, y: base.y + 48 }
    for (const [dx, dy] of candidates) {
      const tx = base.x + dx * W
      const ty = base.y + dy * H
      const occupied = s.nodes.some(
        n => Math.abs(n.position.x - tx) < W * 0.7 && Math.abs(n.position.y - ty) < H * 0.7
      )
      if (!occupied) { pos = { x: tx, y: ty }; break }
    }

    const dup: Node<BuilderNodeData> = {
      ...original,
      id:       newId,
      position: pos,
      selected: true,
      data:     { ...original.data },
    }
    set(prev => ({
      nodes:          [...prev.nodes.map(n => ({ ...n, selected: false })), dup],
      selectedNodeId: newId,
      isDirty:        true,
    }))
    get().persistDraft()
    return newId
  },

  selectAllNodes: () => {
    set(s => ({ nodes: s.nodes.map(n => ({ ...n, selected: true })) }))
  },

  trackIconUsed: (icon) => {
    set(s => ({
      recentIcons: [icon, ...s.recentIcons.filter(i => i !== icon)].slice(0, 8),
    }))
  },

  loadDraft: (nodes, edges, meta, draftId = 'default', customZones = [], recentIcons = []) => {
    set({ nodes, edges, meta, customZones, recentIcons, selectedNodeId: null, isPreviewMode: false, isDirty: false, draftId, layoutDir: 'TB' })
  },

  resetBuilder: () => {
    set({
      meta:           { ...DEFAULT_META },
      nodes:          [],
      edges:          [],
      customZones:    [],
      recentIcons:    [],
      selectedNodeId: null,
      isPreviewMode:  false,
      isDirty:        false,
      draftId:        'default',
      layoutDir:      'TB',
      showShortcuts:  false,
    })
  },

  persistDraft: () => {
    const { meta, nodes, edges, draftId, customZones, recentIcons } = get()
    saveDraftToLocal({ meta, nodes, edges, customZones, recentIcons }, draftId)
  },

  hydrateFromLocal: () => {
    const { draftId } = get()
    const draft = loadDraftFromLocal(draftId)
    if (draft) {
      set({
        meta:        draft.meta,
        nodes:       draft.nodes,
        edges:       draft.edges,
        customZones: draft.customZones ?? [],
        recentIcons: draft.recentIcons ?? [],
        isDirty:     false,
      })
    }
  },
}))
