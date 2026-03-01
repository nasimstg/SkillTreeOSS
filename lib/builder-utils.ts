import type { SkillTree, TreeNode, TreeEdge, Resource } from '@/types/tree'
import type { Node, Edge } from '@xyflow/react'

export interface BuilderNodeData extends Record<string, unknown> {
  label:       string
  description: string
  icon:        string
  zone:        string
  resources:   Resource[]
}

export interface BuilderMeta {
  treeId:          string
  title:           string
  category:        string
  difficulty:      'easy' | 'medium' | 'hard'
  description:     string
  estimatedMonths: number
  icon:            string
  version:         string
}

export interface ValidationError {
  field: string
  message: string
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Derives a SkillTree JSON from the builder's ReactFlow state.
 * `requires` for each node is derived from incoming edges.
 */
export function exportTree(
  meta: BuilderMeta,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): SkillTree {
  const treeNodes: TreeNode[] = nodes.map(n => ({
    id:          n.id,
    label:       n.data.label,
    description: n.data.description,
    icon:        n.data.icon,
    zone:        n.data.zone,
    resources:   n.data.resources,
    requires:    edges.filter(e => e.target === n.id).map(e => e.source),
  }))

  const treeEdges: TreeEdge[] = edges.map(e => ({
    id:     e.id,
    source: e.source,
    target: e.target,
  }))

  return {
    treeId:          meta.treeId,
    title:           meta.title,
    category:        meta.category,
    difficulty:      meta.difficulty,
    description:     meta.description,
    version:         meta.version || '1.0',
    estimatedMonths: meta.estimatedMonths,
    totalNodes:      nodes.length,
    icon:            meta.icon,
    nodes:           treeNodes,
    edges:           treeEdges,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateTree(
  meta: BuilderMeta,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): ValidationError[] {
  const errors: ValidationError[] = []
  const nodeIds = new Set(nodes.map(n => n.id))

  // Metadata
  if (!meta.treeId) {
    errors.push({ field: 'treeId', message: 'Tree ID is required' })
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.treeId)) {
    errors.push({ field: 'treeId', message: 'Tree ID must be lowercase kebab-case (e.g. my-skill-tree)' })
  }
  if (!meta.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' })
  }
  if (!meta.category.trim()) {
    errors.push({ field: 'category', message: 'Category is required' })
  }
  if (!meta.description.trim()) {
    errors.push({ field: 'description', message: 'Description is required' })
  }
  if (meta.estimatedMonths <= 0) {
    errors.push({ field: 'estimatedMonths', message: 'Estimated months must be greater than 0' })
  }
  if (!meta.icon.trim()) {
    errors.push({ field: 'icon', message: 'Icon is required' })
  }

  // Nodes
  if (nodes.length === 0) {
    errors.push({ field: 'nodes', message: 'Tree must have at least one node' })
  }
  for (const node of nodes) {
    if (!node.data.label.trim()) {
      errors.push({ field: `node:${node.id}:label`, message: `Node "${node.id}" is missing a label` })
    }
    if (!node.data.zone.trim()) {
      errors.push({ field: `node:${node.id}:zone`, message: `Node "${node.data.label || node.id}" is missing a zone` })
    }
    if (node.data.resources.length === 0) {
      errors.push({ field: `node:${node.id}:resources`, message: `Node "${node.data.label || node.id}" must have at least one resource` })
    }
    for (const r of node.data.resources) {
      if (!r.url.startsWith('https://')) {
        errors.push({ field: `node:${node.id}:resource:${r.id}:url`, message: `Resource "${r.title}" URL must start with https://` })
      }
      if (!r.title.trim()) {
        errors.push({ field: `node:${node.id}:resource:${r.id}:title`, message: `A resource in "${node.data.label || node.id}" is missing a title` })
      }
    }
  }

  // Edges
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ field: `edge:${edge.id}`, message: `Edge source "${edge.source}" does not exist` })
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ field: `edge:${edge.id}`, message: `Edge target "${edge.target}" does not exist` })
    }
  }

  // Cycle detection (DFS)
  if (hasCycle(nodes.map(n => n.id), edges)) {
    errors.push({ field: 'edges', message: 'The tree contains a circular dependency — every path must eventually reach a root node' })
  }

  return errors
}

function hasCycle(nodeIds: string[], edges: Edge[]): boolean {
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) adj.set(id, [])
  for (const e of edges) adj.get(e.source)?.push(e.target)

  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>()
  for (const id of nodeIds) color.set(id, WHITE)

  function dfs(u: string): boolean {
    color.set(u, GRAY)
    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) return true
      if (color.get(v) === WHITE && dfs(v)) return true
    }
    color.set(u, BLACK)
    return false
  }

  return nodeIds.some(id => color.get(id) === WHITE && dfs(id))
}

// ─── Serialise / deserialise for localStorage ─────────────────────────────────

export interface BuilderDraft {
  meta:  BuilderMeta
  nodes: Node<BuilderNodeData>[]
  edges: Edge[]
}

export function saveDraftToLocal(draft: BuilderDraft, draftId = 'default'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`builder-draft:${draftId}`, JSON.stringify(draft))
}

export function loadDraftFromLocal(draftId = 'default'): BuilderDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`builder-draft:${draftId}`)
    return raw ? (JSON.parse(raw) as BuilderDraft) : null
  } catch {
    return null
  }
}

export function clearDraftFromLocal(draftId = 'default'): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`builder-draft:${draftId}`)
}

/** Convert a SkillTree (from data/trees/*.json) into BuilderDraft so the
 *  builder can pre-populate for "edit existing tree" flows. */
export function treeToDraft(tree: SkillTree): BuilderDraft {
  const meta: BuilderMeta = {
    treeId:          tree.treeId,
    title:           tree.title,
    category:        tree.category,
    difficulty:      tree.difficulty,
    description:     tree.description,
    estimatedMonths: tree.estimatedMonths,
    icon:            tree.icon,
    version:         tree.version,
  }

  // Lay out nodes in a simple grid if no positions provided
  const nodes: Node<BuilderNodeData>[] = tree.nodes.map((n, i) => ({
    id:       n.id,
    type:     'builderNode',
    position: n.position ?? { x: (i % 4) * 280, y: Math.floor(i / 4) * 180 },
    data: {
      label:       n.label,
      description: n.description,
      icon:        n.icon,
      zone:        n.zone,
      resources:   n.resources,
    },
  }))

  const edges: Edge[] = tree.edges.map(e => ({
    id:     e.id,
    source: e.source,
    target: e.target,
    type:   'smoothstep',
  }))

  return { meta, nodes, edges }
}

// ─── Zone colour map (matches viewer zone colours) ───────────────────────────

export const ZONE_COLORS: Record<string, string> = {
  Foundation:  '#6366f1',
  Frontend:    '#3b82f6',
  Backend:     '#10b981',
  'Full-Stack': '#f59e0b',
  DevOps:      '#ef4444',
  Data:        '#8b5cf6',
  Security:    '#ec4899',
  Local:       '#14b8a6',
  Remote:      '#f97316',
  Framework:   '#06b6d4',
  Tools:       '#84cc16',
}

export const DEFAULT_ZONE_COLOR = '#6b7280'

export function zoneColor(zone: string): string {
  return ZONE_COLORS[zone] ?? DEFAULT_ZONE_COLOR
}

// ─── Common zones list for the zone picker ────────────────────────────────────

export const COMMON_ZONES = [
  'Foundation', 'Frontend', 'Backend', 'Full-Stack', 'DevOps',
  'Data', 'Security', 'Local', 'Remote', 'Framework', 'Tools',
]

// ─── Unique ID generators ─────────────────────────────────────────────────────

export function newNodeId(): string {
  return `node-${Math.random().toString(36).slice(2, 8)}`
}

export function newResourceId(): string {
  return `res-${Math.random().toString(36).slice(2, 8)}`
}

export function newEdgeId(source: string, target: string): string {
  return `e-${source}-${target}`
}
