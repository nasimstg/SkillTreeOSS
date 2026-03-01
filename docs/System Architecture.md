# System Architecture Document

This document describes how the components of SkilleTreeOSS communicate and how data flows through the system.

---

## Overview

SkilleTreeOSS uses a **serverless, decoupled architecture**:

- **Static curriculum content** (the skill trees) lives as JSON files in the GitHub repository — the single source of truth for what can be learned.
- **Dynamic user data** (progress, ratings, votes) lives in Supabase (Postgres).
- **The visual builder** lets anyone create or edit trees in the browser and submit them as GitHub PRs, without touching JSON directly.

```
                         GitHub Repository
                         ┌─────────────────────┐
                         │  data/trees/*.json  │◄── PRs from builder / manual JSON
                         │  data/schema.json   │
                         └────────┬────────────┘
                                  │ read at build/request time
                         ┌────────▼────────────┐
                         │   Next.js App       │
                         │   (Vercel CDN)      │
                         │                     │
                         │  /tree/[slug]  ──►  SkillCanvas (viewer)
                         │  /builder      ──►  BuilderCanvas
                         │  /builder/[id] ──►  BuilderCanvas (edit)
                         │  /explore      ──►  Tree grid + search
                         │  /dashboard    ──►  User progress summary
                         └─────┬──────┬────────┘
                               │      │
                  Supabase     │      │  GitHub API
                  (Postgres)   │      │  (PR submission)
              ┌────────────────▼─┐  ┌─▼───────────────┐
              │  user_progress   │  │  Create PR       │
              │  tree_ratings    │  │  (bot token or   │
              │  resource_       │  │   user OAuth)    │
              │    feedback      │  └─────────────────-┘
              │  resource_       │
              │    suggestions   │
              │  site_stats      │
              └──────────────────┘
```

---

## Component Breakdown

### 1. Curriculum Content (GitHub)

- All skill trees are stored as `data/trees/{treeId}.json` files validated against `data/schema.json` (JSON Schema draft-07).
- Updates are submitted as Pull Requests — either manually or via the in-app builder's Submit PR flow.
- A GitHub Actions workflow runs schema validation on every PR touching `data/trees/`. Invalid files block the merge.
- The `main` branch is the single source of truth; Vercel rebuilds automatically on merge.

### 2. Frontend (Next.js 16, App Router, Vercel)

Pages are a mix of server and client components:

| Route | Rendering | Notes |
|-------|-----------|-------|
| `/` | Server + Client | Hero, featured trees (server fetch from Supabase + JSON), stats (server fetch) |
| `/tree/[slug]` | Server layout + Client canvas | Tree JSON read at request time; ReactFlow canvas is fully client-side |
| `/builder` | Client | Entire builder is client-side; no server data needed for a blank canvas |
| `/builder/[id]` | Server + Client | Server fetches the existing tree JSON; client loads it into builder store |
| `/explore` | Server + Client | Server renders initial page; client handles search/filter interactions |
| `/dashboard` | Server + Client | Server fetches user progress from Supabase; client renders interactivity |

**Middleware** (`middleware.ts`) — protects `/dashboard` and other authenticated routes by checking the Supabase session cookie on every request. Unauthenticated users are redirected to `/login`.

### 3. Viewer Canvas (`SkillCanvas`)

The viewer is a fully client-side ReactFlow canvas:

1. Receives a `SkillTree` object (from JSON) and `completedNodeIds` (from Supabase or localStorage) as props.
2. `buildNodes` maps `TreeNode[] → ReactFlow Node<SkillNodeData>[]`, computing `status`, `animationState`, and `highlightRequired` from store state each render.
3. `buildEdges` maps `TreeEdge[] → ReactFlow Edge[]`, applying view-specific edge styles.
4. `lib/autoLayout.ts` (Dagre) computes `{x, y}` positions on mount (or when layout direction changes).
5. `centerOnSelectedNode` uses `setViewport` with an explicit formula accounting for the sidebar width to pan the selected node into the visible area.

State is managed by `useSkillTreeStore` (`lib/store.ts`). Progress updates use an **optimistic pattern**: Zustand updates immediately, then `POST /api/progress/update` runs asynchronously and rolls back on failure.

### 4. Builder Canvas (`BuilderCanvas`)

The builder is a separate client-side canvas using `lib/builder-store.ts` (independent Zustand store):

1. **New tree** (`/builder`) — starts blank; `hydrateFromLocal` loads any auto-saved draft from localStorage.
2. **Edit existing** (`/builder/[id]`) — server fetches the `SkillTree` JSON; `treeToDraft` converts it to builder nodes/edges; `loadDraft` populates the store.
3. The builder uses its own ReactFlow instance with `BuilderNode` (not `CustomNode`).
4. **Preview mode** — assembles a `SkillTree` object from builder state and renders the full `SkillCanvas` viewer inline. All four viewer themes are available; the viewer's progress system is bypassed (all nodes start as available).
5. **Submit PR** — serialises the builder state to the tree JSON format and calls the GitHub API (via `/api/builder/submit`) with either a bot token (anonymous) or user OAuth token (GitHub-connected).

### 5. Authentication & User State (Supabase)

- **OAuth providers:** GitHub and Google, configured in Supabase Dashboard.
- **Callback route:** `GET /auth/callback` — exchanges the Supabase auth code for a session cookie and redirects to `/dashboard`.
- **Session:** Managed by the Supabase SSR client; cookies are refreshed by middleware on every request.
- **Data minimisation:** Only `email` and `display_name` are read from the OAuth payload. No access tokens are stored; no private repository access is requested for GitHub OAuth (that is a separate GitHub App connection for PR submission).

### 6. API Routes (`app/api/`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/progress/update` | Required | Upserts `user_progress` row with new `completed_node_ids[]` |
| `POST` | `/api/resources/upvote` | Required | Upserts `resource_feedback` row with `up`/`down` vote |
| `POST` | `/api/ratings/upsert` | Required | Upserts `tree_ratings` row |
| `POST` | `/api/suggestions/create` | Required | Inserts into `resource_suggestions` |
| `POST` | `/api/builder/submit` | Optional | Serialises builder draft → JSON → GitHub PR via API |

All mutating routes validate the Supabase session server-side before touching the database.

### 7. Database (Supabase / Postgres)

Row Level Security is enabled on every user-data table. See `docs/Security & Data Privacy Policy.md` for full RLS policy definitions and `docs/Technical Design.md` for the full DDL.

| Table | Access Pattern |
|-------|----------------|
| `user_progress` | Composite PK `(user_id, tree_id)`; upserted on node completion; read on tree load |
| `resource_feedback` | Unique per `(user_id, tree_id, node_id)`; upserted on vote |
| `tree_ratings` | Unique per `(user_id, tree_id)`; upserted on rate |
| `site_stats` | Singleton row; updated by a Postgres trigger on `user_progress` INSERT/UPDATE; read O(1) on landing page |
| `resource_suggestions` | Append-only by users; read/updated by maintainers (future admin dashboard) |

---

## Data Flow: Completing a Node

```
User clicks "Mark as Completed"
        │
        ▼
useSkillTreeStore.completeNode(nodeId, treeId)
        │
        ├── 1. Optimistically add nodeId to completedNodeIds in Zustand
        │        → Canvas re-renders: node status → 'completed', downstream nodes → 'available'
        │        → XP bar updates
        │
        └── 2. POST /api/progress/update { treeId, completedNodeIds }
                    │
                    ├── success → (no-op; Zustand already has correct state)
                    └── failure → Zustand rolls back completedNodeIds to previous state
                                  → Canvas reverts
```

## Data Flow: Creating a Tree via the Builder

```
User builds a tree in /builder
        │
        ▼
useBuilderStore (nodes, edges, meta)
        │
        ├── Auto-save to localStorage on every change
        │
        ├── "Preview" button
        │       → sets isPreviewMode = true
        │       → BuilderCanvas renders <SkillCanvas tree={assembledTree} />
        │
        └── "Submit PR" button
                → POST /api/builder/submit
                    │
                    ├── Serialise store → SkillTree JSON (adds requires[] from edges)
                    ├── Base64-encode JSON
                    ├── GitHub API: create branch → create file → open PR
                    └── Return PR URL to user
```
