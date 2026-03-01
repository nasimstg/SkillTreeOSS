# Changelog

All notable changes to SkilleTreeOSS are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.8.0] — 2026-03-02

### Added — Visual Skill Tree Builder

A full in-app GUI for creating and editing skill trees — no JSON or GitHub knowledge required.

- **Routes** — `/builder` (new blank tree) and `/builder/[treeId]` (edit existing tree)
- **`lib/builder-store.ts`** — dedicated Zustand store (separate from the viewer `lib/store.ts`) managing: nodes, edges, tree metadata, layout direction (`'LR' | 'TB'`), draft auto-save, undo/redo history, selected node, preview mode, custom zones, recent icons, and UI state (`showShortcuts`)
- **`lib/builder-utils.ts`** — `treeToDraft(tree: SkillTree): BuilderDraft` converter and the `BuilderDraft` type (`{ nodes, edges, meta }`)
- **`lib/autoLayout.ts`** — updated `computeAutoLayout` signature to accept optional `dims?: { w: number; h: number }` so the builder can supply exact node dimensions (`224×180`) rather than per-view defaults
- **`components/builder/BuilderCanvas.tsx`** — root builder canvas; `ReactFlowProvider` wrapper, keyboard shortcut handler, context menu orchestration, smart node placement (`findFreePosition`), and auto-center-on-select via `setViewport`
- **`components/builder/BuilderNode.tsx`** — builder node card (`w-52`); handle positions driven by `layoutDir` (`Position.Top/Bottom` for TB, `Position.Left/Right` for LR)
- **`components/builder/BuilderNodeEditor.tsx`** — `position: fixed; right: 0; lg:w-2/5` right panel for editing all node properties; marked with `data-builder-panel` so the canvas can measure its width for viewport centering
- **`components/builder/BuilderHeader.tsx`** — floating top overlay; Build/Preview tab switcher with Framer Motion `layoutId="tabBubble"` liquid animation; `?` shortcut-guide button
- **`components/builder/LeftToolbar.tsx`** — left sidebar: Select / Pan tool buttons with Framer Motion `layoutId="toolBubble"` liquid bubble animation; Add Node, Zoom In/Out, Fit View, Layout Direction Toggle (`LR ↔ TB`), Undo, Redo, and `?` Help
- **`components/builder/ContextMenu.tsx`** — viewport-clamped right-click context menu with Framer Motion entrance; two variants: node menu (Edit, Duplicate, Delete) and pane menu (Add Here, Select All, Fit View, Auto-Layout, Shortcuts & Guide)
- **`components/builder/ShortcutsModal.tsx`** — spring-animated two-column modal: 6-step Quick Start guide (with coloured icons) + full keyboard reference (Tools / Selection / Canvas / History)
- **`components/builder/MetadataPanel.tsx`** — collapsible floating top-left panel for tree-level metadata (title, category, icon, difficulty, description, version, estimatedMonths)
- **`components/builder/ResourceEditor.tsx`** — inline resource list manager (add, edit, remove, drag-reorder)
- **`components/builder/IconPicker.tsx`** — searchable picker with Material Symbols Outlined categories + emoji sets; category tab bar with icon preview
- **`components/builder/ZoneSelector.tsx`** — preset zone chips (Foundation, Frontend, Backend, Full-Stack, DevOps, Data, Security, …) with colour coding + custom zone input

### Builder — Interaction Model

- **Multi-select** — rectangular drag in Select mode (`selectionOnDrag`, `SelectionMode.Partial`); `Ctrl+click` adds to selection; custom cyan dashed selection-box via scoped CSS on `.builder-rf-wrapper`
- **Keyboard shortcuts** — `V` Select tool, `H` Pan tool, `N` add node at cursor (uses `mousePosRef` tracking live cursor position), `Ctrl+A` select all, `Ctrl+L` toggle layout direction, `Delete`/`Backspace` delete selected, `?` open shortcuts modal, `Escape` deselect / close panels; all shortcuts are suppressed while an `<input>` or `<textarea>` has focus
- **Smart node placement** (`findFreePosition`) — 21-point outward spiral grid search (slot size `240×212`) prevents stacking; toolbar Add button maps the centre of the `flex-1` canvas wrapper (which already excludes the editor panel) to flow coordinates; `N` shortcut uses the live `mousePosRef` cursor position
- **Auto-center on node select** — mirrors `SkillCanvas.centerOnSelectedNode`; uses `setViewport` with the precise formula `offset = screenCenter − flowCenter × zoom` where `screenCenter = (vw − panelW) / 2`; `panelW` is read from `[data-builder-panel].offsetWidth` (CSS width, unaffected by the `translateX` slide animation); 80 ms delay lets the panel animation begin before the viewport pans
- **Liquid bubble animation** — Framer Motion shared-layout `layoutId` pattern: an absolutely-positioned `<motion.div layoutId="toolBubble">` inside the active toolbar button animates between Select and Pan with spring physics (`stiffness: 480, damping: 32, mass: 0.9`); Build/Preview tabs use `layoutId="tabBubble"` with similar springs
- **Direction toggle** — `Ctrl+L` or toolbar button; recomputes Dagre with the new `rankdir` and calls `fitView` after a 60 ms delay; node handles update immediately via `layoutDir` from the store
- **Preview mode** — assembles a live `SkillTree` object from builder state and renders `<SkillCanvas>` with all four viewer themes, sidebar, and prereq timeline; `?` modal still accessible in preview mode; `Escape` deselects

### Fixed

- `BuilderCanvas.tsx` / `LeftToolbar.tsx` — inline `SkillTree` stubs for Dagre auto-layout were missing required `description: ''` and `estimatedMonths: 0` fields (TS2739)
- `BuilderNodeEditor.tsx` — TypeScript re-widened captured `node` variable inside `handleIconChange` closure despite a preceding null-guard; fixed with `node!.id` non-null assertion
- `IconPicker.tsx` — `c.icon` accessed on the shared `categories` array which is typed as `ICON_CATEGORIES | EMOJI_SETS`; `EMOJI_SETS` entries lack the `icon` property; fixed with `'icon' in c` narrowing guard (TS2551)
- `BuilderCanvas.tsx` — auto-center effect had a typo `node.position.x + 504` (should derive from `node.measured`); corrected to use `node.measured.width ?? 208` and `node.measured.height ?? 180`

---

## [0.7.0] — 2026-02-27

First public OSS release — full MVP platform, ready for community contributions.

### Added
- **Interactive Skill Canvas** — ReactFlow + Dagre auto-layout (LR/TB), 4 visual themes (World Map, RPG, Terminal, Neural), animated node state transitions (locked → available → completed)
- **Auth & Progress Sync** — Supabase email/password + OAuth, progress persisted in DB with localStorage fallback, reset-progress modal
- **XP & Level System** — 50 XP per completed node, 8 levels (Apprentice → Legend), SVG level-ring + Lv badge in UserMenu
- **Explore Page** — full-text search, category/difficulty filters, sort (A→Z, Most Popular, Top Rated, Easiest, Shortest), "Continue your journey" in-progress strip, pagination (12/page)
- **Tree Ratings** — 1–5 star rating modal, per-tree average rating shown on Explore
- **Per-resource Voting** — upvote / downvote each resource card (helpful / not helpful)
- **Suggest a Better Resource** — inline collapsible form → `resource_suggestions` table with `pending → reviewed → accepted/rejected` workflow
- **Live Platform Stats** — `site_stats` singleton + Postgres trigger; O(1) landing-page reads
- **Dynamic Featured Trees** — configurable via `lib/featured-trees.ts`
- **Canvas Toast System** — sequential dismissal, card stacking
- **Node Sidebar** — resources, prerequisite timeline, collapsible distant-ancestor accordion, hover-to-highlight prereq on canvas
- **29 Skill Trees** across Technology, Science, Art, Health, Finance, and Language

### Database
- `user_progress` — `completed_node_ids text[]` per user per tree (implicit enrollment)
- `tree_ratings` — 1–5 star ratings, unique per (user, tree)
- `site_stats` — singleton counter maintained by Postgres trigger
- `resource_suggestions` — community resource feedback queue

### Tech Stack
- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- ReactFlow (`@xyflow/react`) + Dagre, Framer Motion, Zustand
- Supabase (Postgres, RLS, SSR client)

---

## [Unreleased]

_Tracked in [GitHub Issues](../../issues)._

### Planned
- Admin dashboard for reviewing `resource_suggestions`
- GitHub Actions JSON schema linting on PRs (`data/schema.json` + Zod)
- Shareable progress image export

---

[0.8.0]: https://github.com/nasimstg/SkillTreeOSS/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/nasimstg/SkillTreeOSS/releases/tag/v0.7.0
