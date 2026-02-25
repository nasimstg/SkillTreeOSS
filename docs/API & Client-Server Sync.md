# API & Client-Server Sync Blueprint

### Optimistic UI Pattern

When a user clicks "Mark as Completed," the UI updates **instantly** via Zustand, while the API call runs silently in the background. On failure, Zustand rolls back to the previous state.

```typescript
// lib/store.ts — completeNode action
completeNode: (nodeId, treeId) => {
  const prev = get().completedNodeIds
  if (prev.includes(nodeId)) return

  const next = [...prev, nodeId]
  set({ completedNodeIds: next })           // ← optimistic update

  fetch('/api/progress/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ treeId, completedNodeIds: next }),
  }).catch(() => {
    set({ completedNodeIds: prev })         // ← rollback on failure
  })
},
```

### API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/progress/update` | Required | Upserts `user_progress` row with new `completed_node_ids` array |
| `POST` | `/api/resources/upvote` | Required | Upserts `resource_feedback` row with `up`/`down` vote |

### `POST /api/progress/update`

**Request body:**
```json
{ "treeId": "full-stack-dev", "completedNodeIds": ["html-basics", "css-basics"] }
```

**Response:** `{ "ok": true }` or `{ "error": "..." }` with appropriate HTTP status.

Uses Supabase `upsert` with `onConflict: 'user_id,tree_id'` so it creates or updates atomically.

### `POST /api/resources/upvote`

**Request body:**
```json
{
  "treeId": "full-stack-dev",
  "nodeId": "html-basics",
  "resourceUrl": "https://www.youtube.com/...",
  "vote": "up"
}
```

**Response:** `{ "ok": true }` or `{ "error": "..." }`.

Uses `upsert` with `onConflict: 'user_id,tree_id,node_id'` — one vote per user per node.

### Authentication Flow

OAuth callback route: `GET /auth/callback` — exchanges Supabase auth code for a session cookie and redirects to `/dashboard`.

Middleware (`middleware.ts`) protects `/dashboard` by checking the Supabase session cookie on every request. Unauthenticated users are redirected to `/login`.