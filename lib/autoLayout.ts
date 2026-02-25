import dagre from '@dagrejs/dagre'
import type { SkillTree, CanvasView } from '@/types/tree'
import type { LayoutDir } from '@/components/canvas/CanvasFAB'

// ─── Approximate rendered dimensions per view theme ───────────────────────────
// Dagre needs real widths/heights to avoid node overlap; these match the
// CustomNode visual footprint (including label text below the icon shape).

const NODE_DIMS: Record<CanvasView, { w: number; h: number }> = {
  worldmap: { w: 110, h: 160 }, // diamond + label
  rpg:      { w: 100, h: 150 }, // rounded square + label
  terminal: { w: 80,  h: 90  }, // compact square + mono label
  neural:   { w: 80,  h: 110 }, // circle + label
}

// Spacing tweaks per direction so the tree breathes well
const SPACING: Record<LayoutDir, { nodesep: number; ranksep: number }> = {
  LR: { nodesep: 60,  ranksep: 130 },
  TB: { nodesep: 80,  ranksep: 100 },
}

/**
 * Runs the Sugiyama (dagre) algorithm on the skill-tree graph and returns a
 * map of nodeId → { x, y } top-left positions ready for ReactFlow.
 *
 * Dagre handles direction internally via `rankdir`, so the returned positions
 * do NOT need the manual axis-swap that the JSON-based `getPosition` helper
 * applies — pass them straight to ReactFlow.
 */
export function computeAutoLayout(
  tree: SkillTree,
  view: CanvasView,
  dir: LayoutDir,
): Record<string, { x: number; y: number }> {
  const { w, h }               = NODE_DIMS[view]
  const { nodesep, ranksep }   = SPACING[dir]

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: dir,
    nodesep,
    ranksep,
    marginx: 50,
    marginy: 50,
  })

  tree.nodes.forEach((n) => g.setNode(n.id, { width: w, height: h }))
  tree.edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  const positions: Record<string, { x: number; y: number }> = {}
  tree.nodes.forEach((n) => {
    const { x, y } = g.node(n.id)
    // dagre gives the centre of the node; ReactFlow wants the top-left corner
    positions[n.id] = { x: x - w / 2, y: y - h / 2 }
  })

  return positions
}
