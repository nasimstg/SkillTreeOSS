# Contributing to SkilleTreeOSS 🌳

First off, thank you for considering contributing to SkilleTreeOSS! Our mission is the **Democratization of Mastery**, and we can only achieve that by crowdsourcing the best learning paths from people who have actually walked them.

You do **not** need to be a programmer to contribute to this project. We welcome two types of contributions:

1. **Content:** Adding new skill trees or updating broken resource links (No coding required!).
2. **Code:** Improving the Next.js/React Flow frontend or Supabase backend.

---

## 🏗️ 1. Using the Visual Builder (Easiest)

The fastest way to create or update a skill tree is the **in-app builder** at [/builder](/builder). No JSON editing or GitHub knowledge required.

### Creating a new tree

1. Go to `/builder`
2. Click **Tree Metadata** (top-left panel) and fill in the title, category, difficulty, description, icon, and estimated months
3. **Add nodes** — double-click the canvas, press `N` at the cursor, or click `+` in the left toolbar
4. **Connect nodes** — drag from the bottom handle of one node to the top handle of another (or left→right in LR layout)
5. **Edit a node** — click it to open the right editor panel; set label, description, zone, icon, and learning resources
6. **Multi-select** — drag a rectangle in Select mode, or `Ctrl+click` to add nodes to the selection
7. **Auto-layout** — press `Ctrl+L` or the toolbar button to toggle between Top-Bottom and Left-Right Dagre layout
8. Click **Preview** in the header to see the tree exactly as learners will see it (all 4 themes, sidebar, prereq timeline)
9. Click **Submit PR** to open a Pull Request:
   - **Anonymously** — the SkillTreeOSS bot opens the PR on your behalf
   - **As your GitHub account** — connect GitHub first (Settings → Connect GitHub)

### Editing an existing tree

Go to `/builder/[treeId]` — the tree is loaded from the published JSON and converted into builder nodes automatically.

### Builder keyboard shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select tool |
| `H` | Pan tool |
| `N` | Add node at cursor position |
| `Double-click canvas` | Add node at that point |
| `Ctrl+A` | Select all nodes |
| `Ctrl+L` | Toggle layout direction (LR ↔ TB) |
| `Delete` / `Backspace` | Delete selected node(s) |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `?` | Open shortcuts & guide modal |
| `Escape` | Deselect / close panels |

Press `?` in the builder for the full interactive guide.

<!-- TODO: Builder walkthrough GIF
     Record a ~20s GIF of the complete builder contribution flow:
     1. /builder opens (blank canvas + empty state text)
     2. Open the Metadata panel (top-left) — type a title and pick an icon
     3. Double-click to place 3 nodes; drag handles to connect them
     4. Click a node → editor panel slides in from right; fill label + zone + add one resource
     5. Click "Preview" tab — the full viewer renders with the live tree
     6. Click "Submit PR" — the submit dialog appears (stop here, no need to actually submit)
     Keep it at 1280×800, ≤10 MB. The goal is to show non-technical contributors how easy it is.
     Save to: docs/images/builder-walkthrough.gif
-->
![Builder walkthrough](docs/images/builder-walkthrough.gif)

---

## 🗺️ 2. Contributing Content Manually (JSON)

All the skill trees on the website are generated from simple text files formatted in JSON. They live in the `data/trees/` folder of this repository.

To add a new skill tree or update an existing one, you just need to edit these files!

### Step 1: Understand the JSON Structure

A skill tree file (e.g., `urban-sketching.json`) has three main parts: **Metadata**, **Nodes** (the skills), and **Edges** (the lines connecting them).

Here is a simple template:

```json
{
  "treeId": "urban-sketching",
  "title": "Urban Sketching",
  "category": "Art",
  "difficulty": "easy",
  "description": "Learn to draw the world around you on location.",
  "version": "1.0",
  "estimatedMonths": 2,
  "totalNodes": 2,
  "icon": "brush",
  "nodes": [
    {
      "id": "perspective-101",
      "label": "1-Point Perspective",
      "description": "Understand the horizon line and vanishing points.",
      "icon": "straighten",
      "zone": "Foundation",
      "resources": [
        {
          "id": "perspective-yt-artfundamentals",
          "title": "One Point Perspective Drawing Tutorial",
          "url": "https://youtube.com/watch?v=...",
          "type": "video",
          "author": "ArtFundamentals",
          "estimatedHours": 1.5,
          "isFree": true
        }
      ],
      "requires": []
    },
    {
      "id": "ink-wash",
      "label": "Ink & Wash Basics",
      "description": "Adding depth with watercolor over ink.",
      "icon": "water_drop",
      "zone": "Technique",
      "resources": [
        {
          "id": "ink-wash-yt-sketchingdaily",
          "title": "Beginner Ink and Wash",
          "url": "https://youtube.com/watch?v=...",
          "type": "video",
          "author": "SketchingDaily",
          "estimatedHours": 2,
          "isFree": true
        }
      ],
      "requires": ["perspective-101"]
    }
  ],
  "edges": [
    { "id": "e-perspective-ink", "source": "perspective-101", "target": "ink-wash" }
  ]
}
```

### Step 2: Key Rules for JSON Editing

* **No coordinates needed:** The app uses the Dagre layout engine to automatically compute node positions from the graph structure. You only need to define the `requires` relationships — the visual tree arranges itself. Do **not** add `position` fields.
* **`difficulty` values:** Use `"easy"`, `"medium"`, or `"hard"` (lowercase).
* **Edges:** `source` is the prerequisite node ID; `target` is the node it unlocks. Every edge must have a corresponding `requires` entry on the target node.
* **Resources:** Link only to **100% free** resources unless `"isFree": false` is set. Link directly to the specific video or article — no generic landing pages or paid courses. Each node can have multiple resources (video + article + interactive).
* **`totalNodes`:** Must equal the number of entries in the `nodes` array exactly.
* **`treeId`:** Kebab-case (`^[a-z0-9-]+$`); must match the JSON filename without the extension.

### Step 3: Submitting Your Tree

1. Fork this repository.
2. Create a new branch (e.g., `add-urban-sketching-tree`).
3. Add your `.json` file to the `data/trees/` folder.
4. Submit a Pull Request — automated CI will validate your JSON against `data/schema.json`.

---

## 💻 3. Contributing Code

If you want to help build the platform's UI or backend, we are thrilled to have you! We use **Next.js 16**, **ReactFlow**, **Zustand**, **Tailwind CSS v4**, **Framer Motion**, and **Supabase**.

### Local Setup

1. Fork and clone the repo.
2. Run `npm install`.
3. Duplicate `.env.local.example` to `.env.local` and fill in your Supabase credentials (or use the mock keys from the example file for local UI development).
4. Run `npm run dev`.

Open `http://localhost:3000` for the main app and `http://localhost:3000/builder` for the builder.

### Codebase Map

| Path | Purpose |
|---|---|
| `app/(canvas)/` | Canvas layout group — tree viewer and builder pages |
| `app/(canvas)/tree/[slug]/` | Skill tree viewer page |
| `app/(canvas)/builder/` | New tree builder page |
| `app/(canvas)/builder/[id]/` | Edit existing tree page |
| `components/canvas/` | Viewer canvas components (`SkillCanvas`, `CustomNode`, `NodeSidebar`, `CanvasFAB`) |
| `components/builder/` | Builder components (`BuilderCanvas`, `BuilderNode`, `BuilderNodeEditor`, `BuilderHeader`, `LeftToolbar`, `ContextMenu`, `ShortcutsModal`, `MetadataPanel`, `ResourceEditor`, `IconPicker`, `ZoneSelector`) |
| `components/layout/` | `Navbar`, `Footer`, `UserMenu` |
| `lib/store.ts` | Zustand store — viewer/learner state |
| `lib/builder-store.ts` | Zustand store — builder state (separate from viewer) |
| `lib/builder-utils.ts` | `treeToDraft` converter, `BuilderDraft` type |
| `lib/autoLayout.ts` | Dagre auto-layout (used by both viewer and builder) |
| `lib/utils.ts` | Pure utilities: `getNodeStatus`, `getProgressPercent`, `formatHours`, `getLevelInfo` |
| `data/trees/` | Skill tree JSON content files |
| `data/schema.json` | JSON Schema (draft-07) for CI validation |
| `supabase/migrations/` | SQL migration files |
| `types/` | Shared TypeScript types (`tree.ts`, `user.ts`) |

### Development Guidelines

* **State Management — viewer:** Use `lib/store.ts` (`useSkillTreeStore`) for anything in the viewer canvas (completed nodes, selected node, canvas view, XP). Never use React Context for canvas state — it causes severe performance issues with ReactFlow.
* **State Management — builder:** Use `lib/builder-store.ts` (`useBuilderStore`) for all builder state. The two stores are completely independent; do not read from one in the other.
* **Builder node placement:** When adding a node programmatically, call `findFreePosition(cx, cy, existingNodes)` from `BuilderCanvas.tsx` to pick the first unoccupied spiral-grid slot. This prevents nodes from stacking.
* **Builder viewport centering:** Use `setViewport({ x: screenCX - nodeCX * zoom, y: screenCY - nodeCY * zoom, zoom })` — not `setCenter` — so the fixed-position editor panel is accounted for. Read `panelW` from `document.querySelector('[data-builder-panel]').offsetWidth`.
* **`autoLayout.ts`:** Call `computeAutoLayout(tree, view, dir, dims?)` — pass `{ w: 224, h: 180 }` as `dims` from the builder so Dagre uses the actual builder node size rather than per-view defaults.
* **XP / Levels:** `XP_PER_NODE`, `LEVEL_THRESHOLDS`, and `getLevelInfo()` are exported from `lib/utils.ts`. Import from there rather than redefining locally.
* **Styling:** Use Tailwind utility classes. Theme tokens are defined in `app/globals.css` (`background-dark=#0f0f0f`, `surface-dark=#1a1a1a`, `card-dark=#1a2920`, `primary=#11d452`).
* **Animations:** Use Framer Motion `layoutId` for element-position animations between shared elements (builder tool bubble, header tab bubble). Use `AnimatePresence` for mount/unmount transitions.
* **Database (Supabase):** If your PR requires schema changes, add a migration file to `supabase/migrations/` (`20240104_…` format) and describe it in your PR. Always enable RLS on new tables.
* **Server Components & Cookies:** Use `createServerSupabaseClient()` from `lib/supabase-server.ts` in Server Components and Route Handlers.
* **Featured Trees:** Edit `lib/featured-trees.ts` only — no other code changes needed.

---

## ✅ The Pull Request Process

1. Ensure your code type-checks (`npx tsc --noEmit`), lints (`npm run lint`), and builds (`npm run build`).
2. Update `CHANGELOG.md` with a brief description of your change under `[Unreleased]`.
3. Update `README.md` if you've added new environment variables, routes, or major features.
4. Your PR will be reviewed by a maintainer within a few days.

Welcome to the party. Let's build the ultimate map of human knowledge!
