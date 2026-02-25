# UI/UX Design Guidelines

### Visual Language

* **Theme:** "Clean RPG" aesthetic with forced dark mode (`<html class="dark">`).
* **Primary color:** `#11d452` (emerald green) — glow effects, progress bars, completed nodes.
* **Accent color:** `#2b95ff` (electric blue) — available nodes, paths, links.
* **Background:** `#0f0f0f` (background-dark), `#1a1a1a` (surface-dark).
* **Font:** Space Grotesk via `next/font/google`.
* **Icons:** Material Symbols Outlined via Google Fonts `<link>` in root layout.

### Canvas Views (`CanvasView` type)

Four interchangeable views controlled by `canvasView` in Zustand:

| View | Aesthetic | Node Shape | Edge Style |
|------|-----------|------------|------------|
| `worldmap` | Landmark explorer | Circle / rotated diamond | Dashed, muted |
| `rpg` | Quest board cards | Rounded rectangle | Animated glow |
| `terminal` | Monospace inspector | Square with code label | Minimal line |
| `neural` | Neural network | Floating circle with blur halo | Animated flow |

Node status per view:
* **completed** — green fill, glow, checkmark
* **available** — accent-blue border, pulse animation
* **locked** — grayscale, low opacity, lock icon

### Node Sidebar

Slides in from the right using Framer Motion `AnimatePresence`. Contains:
- Resource thumbnail + play button link
- Resource metadata (author, type, estimated hours)
- Prerequisites list with completion indicators
- "Mark as Completed" CTA (disabled if locked or already completed)
- Up/down vote for the resource

### State Management (Frontend)

**Zustand store** (`lib/store.ts`) manages:
- `user: UserProfile | null` — loaded from Supabase session
- `currentTree: SkillTree | null` — active tree
- `completedNodeIds: string[]` — synced with Supabase via optimistic updates
- `selectedNode: TreeNode | null` — drives sidebar open/close
- `canvasView: CanvasView` — persists selected view
- `isSidebarOpen: boolean`

**Framer Motion** is used for sidebar slide transitions. Canvas node animations use pure CSS (`@keyframes`) for performance — avoiding React re-renders on every animation frame.

### Page Structure

| Route | Layout | Description |
|-------|--------|-------------|
| `/` | Navbar + Footer | Landing page with hero, featured trees, stats, how-it-works |
| `/tree/[slug]` | Full-screen (no navbar) | React Flow canvas with SkillCanvas header |
| `/dashboard` | Navbar | User progress, active quests, recent unlocks, mastery |
| `/login` | Minimal (no navbar) | Email/password + GitHub + Google OAuth |
| `/signup` | Minimal (no navbar) | Registration with email confirmation |