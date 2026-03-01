# Technical Design Document

This is the authoritative reference for every developer and content contributor. It covers TypeScript type contracts, utility functions, both Zustand stores, canvas internals, the builder system, JSON content schema, and database schema.

---

## 1. TypeScript Types

### `types/tree.ts`

Core domain types shared across the entire application.

```typescript
export type NodeStatus   = 'locked' | 'available' | 'completed'
export type ResourceType = 'video' | 'article' | 'interactive' | 'course' | 'docs'
export type CanvasView   = 'worldmap' | 'rpg' | 'terminal' | 'neural'

export interface Resource {
  id: string              // kebab-case, unique within the node
  title: string
  url: string             // fully-qualified URI, must be free
  type: ResourceType
  author: string
  estimatedHours: number
  isFree?: boolean        // prefer explicit true/false
  language?: string       // BCP-47 (omit if English)
}

export interface TreeNode {
  id: string              // kebab-case, unique within the tree
  label: string           // short display name shown on the canvas node
  description: string     // 1-2 sentences shown in the sidebar
  icon: string            // Material Symbols Outlined icon name
  zone: string            // logical grouping (e.g. "Foundation", "Frontend")
  resources: Resource[]   // minItems: 1
  position?: { x: number; y: number }  // omit in content JSON; Dagre computes layout
  requires: string[]      // IDs that must be completed before this node unlocks
}

export interface TreeEdge {
  id: string
  source: string          // prerequisite node ID
  target: string          // node being unlocked
}

export interface SkillTree {
  treeId: string          // kebab-case, matches filename
  title: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string     // required (was previously optional)
  version: string         // SemVer string
  estimatedMonths: number // required (was previously optional)
  totalNodes: number      // must equal nodes.length
  icon: string
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export interface RichNode extends TreeNode {
  status: NodeStatus
}
```

**Consumer map:**

| Type | Consumers |
|------|-----------|
| `NodeStatus` | `lib/utils.ts → getNodeStatus`, `CustomNode.tsx → SkillNodeData` |
| `CanvasView` | `lib/store.ts`, `SkillCanvas.tsx`, `lib/autoLayout.ts` |
| `Resource` | `NodeSidebar.tsx`, `BuilderNodeEditor.tsx`, `ResourceEditor.tsx` |
| `TreeNode` | `lib/store.ts`, `NodeSidebar.tsx`, `SkillCanvas.tsx`, `lib/builder-utils.ts` |
| `SkillTree` | `SkillCanvas.tsx` props, `lib/store.ts`, `lib/autoLayout.ts`, `BuilderCanvas.tsx` (preview) |

---

### `types/user.ts`

Auth and progress types that mirror the Supabase table columns.

```typescript
export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserProgress {
  user_id: string
  tree_id: string
  completed_node_ids: string[]
  last_updated: string
}

export interface ResourceFeedback {
  id: string
  user_id: string
  tree_id: string
  node_id: string
  resource_url: string
  vote: 'up' | 'down'
  created_at: string
}
```

---

### Builder-specific types

#### `lib/builder-utils.ts` — `BuilderDraft`

Wire format between `treeToDraft` (converter) and `loadDraft` (store action).

```typescript
export interface BuilderDraft {
  nodes: Node<BuilderNodeData>[]   // ReactFlow nodes
  edges: Edge[]                    // ReactFlow edges
  meta: BuilderMeta
}
```

#### `components/builder/BuilderNode.tsx` — `BuilderNodeData`

Data shape stored inside each ReactFlow `Node` in the builder store.

```typescript
export interface BuilderNodeData {
  label: string
  description: string
  icon: string
  zone: string
  resources: Resource[]
  [key: string]: unknown   // ReactFlow requires index signature on node data
}
```

#### `components/canvas/CustomNode.tsx` — `SkillNodeData`

Bridge between `TreeNode` JSON and the ReactFlow viewer rendering layer.

```typescript
export interface SkillNodeData {
  label: string
  description: string
  icon: string
  zone: string
  status: NodeStatus
  view: CanvasView
  animationState?: 'completing' | 'unlocking'
  highlightRequired?: boolean   // amber ring for unmet prereq of locked selection
}
```

`buildNodes` in `SkillCanvas.tsx` maps `TreeNode → SkillNodeData` each render. Direct JSON fields are copied verbatim; `status`, `animationState`, and `highlightRequired` are derived from store state.

---

## 2. Utility Functions (`lib/utils.ts`)

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getNodeStatus` | `(node: TreeNode, completedIds: string[]) → NodeStatus` | `'completed'` if ID in array; `'available'` if all `requires` completed; else `'locked'` |
| `getProgressPercent` | `(completedIds: string[], totalNodes: number) → number` | 0–100 integer; used in the canvas info pill |
| `formatHours` | `(hours: number) → string` | `0.5 → "~30 min"`, `2 → "~2 hours"` |
| `getZoneColor` | `(zone: string) → string` | Maps zone names to Tailwind colour classes |
| `getLevelInfo` | `(totalXP: number) → LevelInfo` | Returns `{ level, title, xpInLevel, xpForLevel, percent }` |

---

## 3. Auto-Layout (`lib/autoLayout.ts`)

```typescript
type LayoutDir = 'LR' | 'TB'

computeAutoLayout(
  tree: SkillTree,
  view: CanvasView,
  dir: LayoutDir,
  dims?: { w: number; h: number },   // optional override for node dimensions
) → Record<string, { x: number; y: number }>
```

Runs the **Dagre (Sugiyama)** layered-graph algorithm. Returns a `nodeId → {x, y}` top-left position map for ReactFlow.

Key details:
- **Default node dimensions** — per `CanvasView`: `worldmap` 110×160, `rpg` 100×150, `terminal` 80×90, `neural` 80×110.
- **Builder override** — pass `dims: { w: 224, h: 180 }` (actual builder node size) to avoid overlap in builder canvas.
- **`dir`** — passed straight to Dagre's `rankdir`.
- **Viewer** — positions stored in `autoPositions` state; passed as `posOverrides` to `buildNodes`. Auto-initialised on mount when `tree.nodes.some(n => !n.position)`.
- **Builder** — `applyAutoLayout(positions, newDir)` bulk-updates node positions in `useBuilderStore`; `fitView` called 60 ms later.

---

## 4. Viewer Zustand Store (`lib/store.ts`)

Exported as `useSkillTreeStore`. Use the selector pattern to prevent unnecessary re-renders.

```typescript
// Auth
user: UserProfile | null
setUser: (user: UserProfile | null) => void

// Tree data
currentTree: SkillTree | null
setCurrentTree: (tree: SkillTree | null) => void

// Progress — optimistic (rolls back on API failure)
completedNodeIds: string[]
setCompletedNodeIds: (ids: string[]) => void
completeNode: (nodeId: string, treeId: string) => void
uncompleteNode: (nodeId: string) => void

// UI (setSelectedNode also sets isSidebarOpen)
selectedNode: TreeNode | null
setSelectedNode: (node: TreeNode | null) => void

canvasView: CanvasView        // default: 'worldmap'
setCanvasView: (view: CanvasView) => void

isSidebarOpen: boolean
setSidebarOpen: (open: boolean) => void

// Sidebar → Canvas hover bridge
hoveredPrereqId: string | null
setHoveredPrereqId: (id: string | null) => void
```

---

## 5. Builder Zustand Store (`lib/builder-store.ts`)

Exported as `useBuilderStore`. Completely independent from `lib/store.ts` — do not cross-import.

```typescript
// ReactFlow wiring
nodes: Node<BuilderNodeData>[]
edges: Edge[]
onNodesChange: OnNodesChange
onEdgesChange: OnEdgesChange
onConnect: OnConnect

// Node operations
addNode: (position: { x: number; y: number }) => void
deleteNode: (nodeId: string) => void
duplicateNode: (nodeId: string) => void          // spiral grid search for free adjacent slot
updateNodeData: (nodeId: string, data: Partial<BuilderNodeData>) => void
selectAllNodes: () => void

// Tree metadata
meta: BuilderMeta                                // title, category, difficulty, description, etc.
setMeta: (meta: Partial<BuilderMeta>) => void

// Persistence
loadDraft: (nodes, edges, meta, treeId?) => void
hydrateFromLocal: () => void
resetBuilder: () => void

// Layout
layoutDir: 'LR' | 'TB'
setLayoutDir: (dir: 'LR' | 'TB') => void
applyAutoLayout: (positions: Record<string, {x:number,y:number}>, dir: 'LR'|'TB') => void

// Selection & UI
selectedNodeId: string | null
setSelectedNodeId: (id: string | null) => void
isPreviewMode: boolean
setPreviewMode: (on: boolean) => void
showShortcuts: boolean
setShowShortcuts: (on: boolean) => void

// Icon tracking (recent icons shown first in picker)
recentIcons: string[]
trackIconUsed: (icon: string) => void

// Custom zones
customZones: string[]
addCustomZone: (zone: string) => void
```

`duplicateNode` performs a spiral grid search (12-point `[dx, dy]` candidates × slot dimensions `240×212`) to find the first unoccupied adjacent slot, preventing node stacking on duplicate.

---

## 6. Key Component Files

### Viewer (`components/canvas/`)

| File | Responsibility |
|------|----------------|
| `SkillCanvas.tsx` | Root canvas: `buildNodes`/`buildEdges`, ReactFlow instance, animation state, auto-layout, `centerOnSelectedNode` (uses `setViewport` formula) |
| `CustomNode.tsx` | Four node renderers (worldmap/rpg/terminal/neural) + `NodeAnimShell` (completion burst, unlock ripple, selection ring, prereq amber ring) |
| `NodeSidebar.tsx` | Right-side panel: resources, prerequisites timeline (topological sort, distant-ancestor accordion), vote buttons, Mark-as-Completed CTA |
| `CanvasFAB.tsx` | Bottom-centre pill: view switcher (4 themes), fit-view, layout direction, auto-arrange, share |
| `CanvasContextMenu.tsx` | Right-click context menu for pane and nodes |

### Builder (`components/builder/`)

| File | Responsibility |
|------|----------------|
| `BuilderCanvas.tsx` | Root builder canvas: `ReactFlowProvider` wrapper, keyboard shortcuts, context menu, `findFreePosition`, `setViewport` auto-center |
| `BuilderNode.tsx` | Builder card; handles use `layoutDir` for dynamic `Position.Top/Bottom` or `Left/Right` |
| `BuilderNodeEditor.tsx` | Fixed-position right panel (`lg:w-2/5`); `data-builder-panel` attribute; node title, description, icon, zone, resources, connections |
| `BuilderHeader.tsx` | Floating top overlay; Build/Preview tabs with `layoutId="tabBubble"` liquid animation; `?` button |
| `LeftToolbar.tsx` | Left sidebar: Select/Pan with `layoutId="toolBubble"`; Add, Zoom, Fit, Layout Toggle, Undo, Redo, Help |
| `ContextMenu.tsx` | Viewport-clamped right-click menu; Framer Motion entrance; node and pane variants |
| `ShortcutsModal.tsx` | Two-column spring-animated modal: Quick Start guide + keyboard reference |
| `MetadataPanel.tsx` | Collapsible top-left overlay for tree-level fields |
| `ResourceEditor.tsx` | Inline resource list manager (add, edit, remove) |
| `IconPicker.tsx` | Searchable Material Symbols + emoji picker with category tabs |
| `ZoneSelector.tsx` | Preset zone chips + custom zone input with colour coding |

---

## 7. Builder — Viewport Centering

When a node is selected in the builder, the canvas pans so the node appears centred in the **unobscured** area (left of the fixed editor panel).

**Why `setViewport` instead of `setCenter`:** `BuilderNodeEditor` is `position: fixed`, so the ReactFlow container is always full-width. `setCenter(x, y)` places the node at the centre of the full screen — partially hidden under the panel. `setViewport` takes raw transform values, encoding the panel offset directly.

**Formula (mirrors `SkillCanvas.centerOnSelectedNode`):**
```
screenCX = (window.innerWidth − panelW) / 2
screenCY = window.innerHeight / 2
viewport.x = screenCX − nodeCX × zoom
viewport.y = screenCY − nodeCY × zoom
```

`panelW = document.querySelector('[data-builder-panel]').offsetWidth` — CSS `width` is unaffected by the `translateX` slide animation, so `offsetWidth` always returns the correct full panel width. An 80 ms `setTimeout` lets the panel begin sliding in before the viewport pans.

---

## 8. Builder — Smart Node Placement (`findFreePosition`)

Converts the centre of `.builder-rf-wrapper` (the `flex-1` canvas div, already excluding the editor panel) to flow coordinates, then searches outward using a 21-point spiral:

```typescript
const SLOT_W = 240, SLOT_H = 212
const SPIRAL: [number, number][] = [
  [0,0], [1,0],[-1,0],[0,1],[0,-1],
  [1,1],[-1,1],[1,-1],[-1,-1],
  [2,0],[-2,0],[0,2],[0,-2],
  [2,1],[-2,1],[1,2],[-1,2],
  [2,-1],[-2,-1],[1,-2],[-1,-2],
]
```

Each candidate is checked for overlap (`Math.abs(existing.x - tx) < SLOT_W * 0.8 && ...`). Falls back to a diagonal cascade if all 21 slots are occupied.

The `N` shortcut bypasses `findFreePosition` and places the node at the cursor's live flow coordinates (tracked via `mousePosRef` updated on `onMouseMove`).

---

## 9. JSON Content Schema

Static content at `data/trees/{treeId}.json`, validated against `data/schema.json` (JSON Schema draft-07) in CI.

| Field | Required | Constraint |
|-------|----------|------------|
| `treeId` | ✅ | `^[a-z0-9-]+$`; must match filename |
| `title` | ✅ | string |
| `category` | ✅ | string |
| `difficulty` | ✅ | `"easy"` \| `"medium"` \| `"hard"` |
| `description` | ✅ | string |
| `estimatedMonths` | ✅ | number |
| `version` | ✅ | SemVer string |
| `totalNodes` | ✅ | must equal `nodes.length` |
| `icon` | ✅ | Material Symbols icon name |
| `nodes[].id` | ✅ | `^[a-z0-9-]+$`; unique within file |
| `nodes[].label` | ✅ | string |
| `nodes[].description` | ✅ | string |
| `nodes[].icon` | ✅ | Material Symbols icon name |
| `nodes[].zone` | ✅ | string |
| `nodes[].resources` | ✅ | array, minItems: 1 |
| `nodes[].resources[].url` | ✅ | valid URI; free resource |
| `nodes[].resources[].type` | ✅ | `video \| article \| interactive \| course \| docs` |
| `nodes[].requires` | ✅ | array of node IDs (`[]` for root nodes) |
| `nodes[].position` | — | **omit in content files** — Dagre auto-computes |
| `edges[].source` / `target` | ✅ | must be valid node IDs in the same file |

**Lock logic** (computed at runtime by `getNodeStatus`):
- `completed` — node ID is in `completedNodeIds`
- `available` — all `requires` IDs are in `completedNodeIds`
- `locked` — one or more `requires` IDs not yet completed
- Root nodes (`requires: []`) are always `available`

---

## 10. Supabase Database Schema

```sql
-- User progress per tree
create table if not exists user_progress (
  user_id              uuid references auth.users(id) on delete cascade,
  tree_id              text not null,
  completed_node_ids   text[] not null default '{}',
  last_updated         timestamptz default now(),
  primary key (user_id, tree_id)
);

-- Resource feedback (upvotes / downvotes)
create table if not exists resource_feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  tree_id       text not null,
  node_id       text not null,
  resource_url  text not null,
  vote          text check (vote in ('up', 'down')),
  created_at    timestamptz default now(),
  unique (user_id, tree_id, node_id)
);

-- Tree ratings
create table if not exists tree_ratings (
  user_id    uuid references auth.users(id) on delete cascade,
  tree_id    text not null,
  rating     int check (rating between 1 and 5),
  created_at timestamptz default now(),
  primary key (user_id, tree_id)
);

-- Platform stats singleton
create table if not exists site_stats (
  id              int primary key default 1,
  learner_count   int default 0,
  tree_count      int default 0,
  nodes_unlocked  int default 0
);

-- Community resource suggestions
create table if not exists resource_suggestions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  tree_id      text not null,
  node_id      text not null,
  issue        text not null,
  url          text,
  title        text,
  status       text default 'pending' check (status in ('pending','reviewed','accepted','rejected')),
  created_at   timestamptz default now()
);

-- RLS policies
alter table user_progress        enable row level security;
alter table resource_feedback    enable row level security;
alter table tree_ratings          enable row level security;
alter table resource_suggestions  enable row level security;

create policy "Users manage own progress"
  on user_progress for all using (auth.uid() = user_id);

create policy "Users manage own feedback"
  on resource_feedback for all using (auth.uid() = user_id);

create policy "Users manage own ratings"
  on tree_ratings for all using (auth.uid() = user_id);

create policy "Users submit suggestions"
  on resource_suggestions for insert with check (auth.uid() = user_id);

create policy "Users read own suggestions"
  on resource_suggestions for select using (auth.uid() = user_id);
```
