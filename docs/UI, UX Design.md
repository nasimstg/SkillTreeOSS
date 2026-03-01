# UI/UX Design Guidelines

---

## Visual Language

* **Theme:** "Clean RPG" aesthetic — forced dark mode (`<html class="dark">`), no light mode.
* **Primary colour:** `#11d452` (emerald green) — glow effects, progress bars, completed nodes, primary CTAs.
* **Accent colour:** `#2b95ff` (electric blue) — available nodes, paths, links, selection rings.
* **Builder accent:** `#00f0ff` (cyan) — builder node handles, multi-select rectangle, bubble animation highlights.
* **Background:** `#0f0f0f` (`background-dark`), `#1a1a1a` (`surface-dark`), `#1a2920` (`card-dark`).
* **Font:** Space Grotesk via `next/font/google`.
* **Icons:** Material Symbols Outlined via Google Fonts `<link>` in root layout.
* **Animations:** Framer Motion for layout transitions, `AnimatePresence` for mount/unmount, `layoutId` shared-layout for element-position animations. CSS `@keyframes` for high-frequency canvas animations (node pulses, glows) to avoid React re-renders.

---

## Viewer Canvas

### Canvas Views (`CanvasView` type)

Four interchangeable themes controlled by `canvasView` in the viewer Zustand store:

| View | Aesthetic | Node Shape | Edge Style |
|------|-----------|------------|------------|
| `worldmap` | Landmark explorer | Circle / rotated diamond | Dashed, muted |
| `rpg` | Quest board cards | Rounded rectangle | Animated glow |
| `terminal` | Monospace inspector | Square with code label | Minimal line |
| `neural` | Neural network | Floating circle with blur halo | Animated flow |

Node status rendering per view:
* **`completed`** — green fill, glow, checkmark badge
* **`available`** — accent-blue border, CSS pulse animation
* **`locked`** — grayscale, low opacity, lock icon overlay

### Node Sidebar

Slides in from the right using Framer Motion `AnimatePresence`. Contains:
- Resource thumbnail + play button link
- Resource metadata (author, type, estimated hours)
- **Prerequisites timeline** — vertical stepper sorted topologically (foundation-first, post-order DFS). Each item: status dot (green check / pulsing blue / dimmed padlock). Immediate prereqs shown inline; distant ancestors collapse into an accordion. Hovering a prereq highlights the canvas node; clicking pans to it and opens its sidebar.
- "Mark as Completed" CTA (disabled if locked or already completed)
- Up/down vote for the resource

### Viewer Canvas Controls (`CanvasFAB`)

A horizontal pill fixed at bottom-centre of the canvas (`components/canvas/CanvasFAB.tsx`):
- **View switcher** (left cluster) — four buttons (worldmap / rpg / terminal / neural); active view gets a primary-tinted background.
- **Divider** — thin vertical separator.
- **Control buttons** (right cluster) — icon-only: center/fit-view, layout direction toggle LR↔TB, auto-arrange via Dagre, share.

### Viewport Centering (Viewer)

`SkillCanvas.centerOnSelectedNode` uses `setViewport` with the formula:
```
screenCX = (vw - sidebarW) / 2   // sidebarW = vw >= 768 ? 500 : 0
viewport.x = screenCX - nodeCX * zoom
viewport.y = screenCY - nodeCY * zoom
```
Reads `node.measured.width/height` for precise node dimensions.

---

## Builder Canvas

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  BuilderHeader (floating overlay — Build | Preview tabs + ?)    │
├──────────────┬───────────────────────────────┬───────────────────┤
│  LeftToolbar │  ReactFlow canvas              │  BuilderNodeEditor│
│  (fixed left)│  .builder-rf-wrapper           │  (position:fixed  │
│              │  (flex-1, shrinks only         │   right:0         │
│              │   from left; editor is fixed) │   lg:w-2/5)       │
└──────────────┴───────────────────────────────┴───────────────────┘
│  MetadataPanel (floating top-left overlay)                       │
└──────────────────────────────────────────────────────────────────┘
```

The `BuilderNodeEditor` is `position: fixed` — it overlaps the canvas rather than shrinking it. The ReactFlow container (`.builder-rf-wrapper`, `flex-1`) always fills the full window width. All viewport math accounts for `panelW` explicitly.

### Builder Node Card (`BuilderNode`)

- Width: `w-52` (208 px), height: ~180 px
- Top/bottom handles for TB layout; left/right handles for LR layout — driven by `layoutDir` from `useBuilderStore`
- Selection ring: cyan `box-shadow` when selected
- Zone colour dot in header
- Resource and time-estimate chips in footer

### LeftToolbar — Liquid Bubble Animation

The active tool indicator uses Framer Motion shared-layout (`layoutId="toolBubble"`):

```tsx
// Inside each ToolBtn:
{active && (
  <motion.div
    layoutId="toolBubble"
    transition={{ type: 'spring', stiffness: 480, damping: 32, mass: 0.9 }}
    style={{
      background: 'linear-gradient(145deg, rgba(0,240,255,0.18), rgba(0,240,255,0.09))',
      // meniscus highlight + bottom depth shadow
    }}
  />
)}
```

When `activeTool` changes from `'select'` to `'pan'`, Framer Motion detects the `layoutId` unmounting from one button and mounting in the other, and animates the bubble between positions with spring physics — creating the "floating bubble trapped in a glass tube" effect.

The container uses `inset 0 1px 0 rgba(255,255,255,0.08)` (top rim) + `inset 0 -1px 0 rgba(0,0,0,0.30)` (bottom shadow) to reinforce the glass tube illusion.

### BuilderHeader — Tab Bubble Animation

Build/Preview tabs use the same `layoutId="tabBubble"` pattern with `stiffness: 500, damping: 36, mass: 0.85`.

### BuilderNodeEditor Panel

- `position: fixed; right: 0; top: 0` — overlaps the canvas
- Width: `w-full lg:w-2/5` (full on mobile, 40 vw on large screens)
- Slides in/out via `initial={{ x: '100%' }}` → `animate={{ x: 0 }}` with `SPRING = { type: 'spring', damping: 28, stiffness: 300 }`
- `data-builder-panel` attribute used by `BuilderCanvas` to measure width for `setViewport` centering

### Context Menu

- Viewport-clamped: `Math.min(x, vw - menuWidth - 8)` prevents clipping
- Framer Motion entrance: `initial={{ opacity: 0, scale: 0.94, y: -6 }}`
- Glass-dark style: `background: rgba(7, 10, 20, 0.97)`, `backdropFilter: blur(24px)`
- Click-outside + `Escape` dismiss

### ShortcutsModal

- Two-column layout: **left** = 6-step Quick Start guide with coloured Material Symbols icons; **right** = keyboard reference (Tools / Selection / Canvas / History sections)
- Spring scale animation: `{ type: 'spring', stiffness: 420, damping: 32 }`
- Backdrop: `rgba(0,0,0,0.6)` with `backdropFilter: blur(8px)`

### Multi-select

- Rectangular drag creates a selection box styled with custom CSS scoped to `.builder-rf-wrapper`:
  ```css
  .builder-rf-wrapper .react-flow__selection {
    background: rgba(0, 240, 255, 0.04) !important;
    border: 1.5px dashed rgba(0, 240, 255, 0.50) !important;
    border-radius: 6px;
  }
  ```
- `Ctrl+click` adds individual nodes to an existing selection (`multiSelectionKeyCode="Control"`)
- `SelectionMode.Partial` — node is included if the rectangle overlaps any part of it

---

## Keyboard Shortcuts (Builder)

| Key | Action | Notes |
|-----|--------|-------|
| `V` | Select tool | |
| `H` | Pan tool | |
| `N` | Add node at cursor | Uses `mousePosRef` for cursor flow coords |
| `Double-click canvas` | Add node at click point | |
| `Right-click` | Context menu | Node or pane variant |
| `Ctrl+A` | Select all nodes | |
| `Ctrl+L` | Toggle layout direction LR ↔ TB | Re-runs Dagre + `fitView` |
| `Delete` / `Backspace` | Delete selected | ReactFlow native |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo | |
| `?` | Open shortcuts & guide modal | Works in both Build and Preview modes |
| `Escape` | Deselect / close panels | |

All shortcuts are suppressed when an `<input>`, `<textarea>`, or `contentEditable` element has focus.

---

## Navbar Variants

`components/layout/Navbar.tsx` accepts `variant?: 'landing' | 'canvas'`:
- `"landing"` (default) — green-tinted `bg-bg-landing/80`, `border-primary/20`; used on `/`, `/explore`, `/dashboard`.
- `"canvas"` — neutral `bg-background-dark/95`, `border-white/[0.06]`; used on canvas pages via `app/(canvas)/layout.tsx`.

---

## Page Structure

| Route | Layout | Description |
|-------|--------|-------------|
| `/` | Navbar (landing) + Footer | Landing page: hero, featured trees, stats, how-it-works |
| `/tree/[slug]` | Navbar (canvas) + full-height canvas | ReactFlow viewer, CanvasFAB, NodeSidebar |
| `/builder` | Navbar (canvas) + full-height builder | New tree — BuilderCanvas + BuilderHeader |
| `/builder/[id]` | Navbar (canvas) + full-height builder | Edit existing tree |
| `/explore` | Navbar (landing) | Search, filter, sort, paginated tree grid |
| `/dashboard` | Navbar (landing) | User progress, active quests, recent unlocks, mastery |
| `/login` | Minimal (no navbar) | Email/password + GitHub + Google OAuth |
| `/signup` | Minimal (no navbar) | Registration with email confirmation |
