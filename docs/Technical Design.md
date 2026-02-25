# Technical Design Document (TDD): Core Data Schema

Because this project relies entirely on open-source contributions for content, the JSON schema must be perfectly defined. This acts as the contract between the content creators and the UI developers.

### TypeScript Types (`types/tree.ts`)

```typescript
export type NodeStatus = 'locked' | 'available' | 'completed'
export type ResourceType = 'video' | 'article' | 'interactive' | 'course' | 'docs'
export type CanvasView = 'worldmap' | 'rpg' | 'terminal' | 'neural'

export interface Resource {
  title: string
  url: string
  type: ResourceType
  author: string
  estimatedHours: number
}

export interface TreeNode {
  id: string
  label: string
  description: string
  icon: string               // Material Symbols icon name
  zone: string               // e.g. "Frontend", "Foundation"
  resource: Resource
  position: { x: number; y: number }
  requires: string[]         // array of prerequisite node IDs
}

export interface SkillTree {
  treeId: string
  title: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'hard'
  description: string
  version: string
  estimatedMonths: number
  totalNodes: number
  icon: string               // Material Symbols icon
  nodes: TreeNode[]
  edges: TreeEdge[]
}
```

### The `Tree` JSON Schema

Static content lives at `data/trees/{treeId}.json`. Validated against `data/schema.json` (JSON Schema draft-07) in CI.

The `requires` array dictates RPG lock logic — nodes are `locked` until all prerequisite IDs appear in the user's `completed_node_ids`.

```json
{
  "treeId": "full-stack-dev",
  "title": "Full-Stack Web Developer",
  "category": "Technology",
  "difficulty": "hard",
  "description": "...",
  "version": "1.0",
  "estimatedMonths": 6,
  "totalNodes": 20,
  "icon": "terminal",
  "nodes": [
    {
      "id": "html-basics",
      "label": "HTML Basics",
      "description": "Learn the skeleton of the web.",
      "icon": "html",
      "zone": "Frontend",
      "resource": {
        "title": "HTML Full Course - Build a Website Tutorial",
        "url": "https://www.youtube.com/watch?v=mU6anWqZJcc",
        "type": "video",
        "author": "freeCodeCamp",
        "estimatedHours": 2
      },
      "position": { "x": 500, "y": 0 },
      "requires": []
    }
  ],
  "edges": [
    { "id": "e-html-css", "source": "html-basics", "target": "css-basics" }
  ]
}
```

### Supabase Database Schema

Run these SQL statements in the Supabase SQL editor to create required tables:

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

-- Row-level security
alter table user_progress enable row level security;
create policy "Users manage own progress"
  on user_progress for all using (auth.uid() = user_id);

alter table resource_feedback enable row level security;
create policy "Users manage own feedback"
  on resource_feedback for all using (auth.uid() = user_id);
```

**Table summary:**
- `user_progress` — composite PK `(user_id, tree_id)`, `completed_node_ids` as `text[]`, `last_updated` timestamp.
- `resource_feedback` — per-user upvote/downvote for a node's resource URL, unique per `(user_id, tree_id, node_id)`.
