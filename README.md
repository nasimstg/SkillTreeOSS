# 🌳 SkilleTreeOSS

**The Democratization of Mastery.** SkilleTreeOSS is an open-source, gamified learning platform. We map out complex skills (like "Full-Stack Developer," "ML Engineer," or "Photography") into beautiful, interactive RPG-style skill trees. Click a node, find the best free resource on the internet, and level up your life.

---

## 🎯 The Vision

Most learning sites are either hidden behind expensive paywalls or are overwhelming, messy lists of links. Self-learners often face a "curriculum gap" — they don't know *what* they should learn next.

SkilleTreeOSS solves this by turning education into a visual progression system.

* **Zero Overwhelm:** See exactly where you are and what to tackle next.
* **Community Curated:** Nodes link to the single highest-voted free resource for that specific sub-skill.
* **Gamified Progression:** Watch your tree light up as you complete nodes, unlocking advanced branches.

---

## ✨ Features

### 🗺️ Interactive Skill Canvas
- **4 visual themes** — World Map, RPG, Terminal, Neural
- Dagre auto-layout with toggleable LR ↔ TB direction
- Node sidebar with resources, prerequisite timeline, resource voting, and resource suggestions
- Animated node state transitions (locked → available → completed)

### 🔐 Auth & Progress
- Supabase auth (email/password, OAuth)
- Progress synced to DB in real time; localStorage fallback
- **XP & level system** — 50 XP per completed node, 8 levels (Apprentice → Legend)
- Navbar **UserMenu** with SVG level-ring progress indicator and Lv badge
- Reset-progress button with confirmation modal

### 🌐 Explore Page
- Full-text search across titles, descriptions, categories, node labels, zones, and resource titles
- Filter by **category** (dynamically derived from tree files) and **difficulty**
- Sort by: A→Z, Most Popular (enrolled), Top Rated, Easiest First, Shortest First
- **"Continue your journey"** strip for in-progress trees
- Pagination (12 per page)

### ⭐ Tree Ratings & Enrollment
- 1–5 star rating modal on the canvas toolbar
- Enrollment auto-detected from completed nodes (no separate join flow)
- Per-tree enrolled counts and average ratings shown in Explore and landing page

### 📊 Live Platform Stats
- Landing page stats (Active Learners, Skill Trees, Nodes Unlocked) served from a **`site_stats` singleton** kept current by a Postgres trigger — O(1) read, no full table scans
- Featured trees configurable in `lib/featured-trees.ts` with real data from tree JSON + DB

### 💡 Community Feedback
- Per-resource **upvote / downvote** on every resource card
- **"Suggest a better resource"** inline form on every node — stores explanation, optional URL, and title in a `resource_suggestions` table with a status workflow (`pending → reviewed → accepted/rejected`)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Canvas Engine | ReactFlow (`@xyflow/react`) + Dagre |
| State | Zustand (with localStorage persistence) |
| Styling | Tailwind CSS v4, Framer Motion |
| Auth + DB | Supabase (Postgres, RLS, SSR client) |

---

## 🗄️ Database Migrations

Run these in order from `supabase/migrations/` via the Supabase SQL editor:

| File | Table | Purpose |
|---|---|---|
| `20240101_tree_ratings.sql` | `tree_ratings` | 1–5 star ratings per user per tree |
| `20240102_site_stats.sql` | `site_stats` | Singleton counter + Postgres trigger for landing-page stats |
| `20240103_resource_suggestions.sql` | `resource_suggestions` | Community resource feedback queue |

> **`user_progress`** (existing) — stores `completed_node_ids text[]` per user per tree. Enrollment is implicit: any row with ≥1 completed node counts as enrolled.

---

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/nasimstg/SkillTreeOSS.git
cd SkillTreeOSS
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. **Run database migrations** — paste each file from `supabase/migrations/` into the Supabase SQL editor and execute in order.

5. **Run the dev server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌲 Adding or Editing Trees

All skill trees live in `data/trees/` as JSON files. You do **not** need to be a developer — just edit a JSON file and open a PR.

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full schema, rules, and PR process.

To change the featured trees on the landing page, edit `lib/featured-trees.ts`:
```ts
export const FEATURED_TREE_IDS = ['full-stack-dev', 'ml-ai-engineer', 'photography-mastery']
```

---

## 🤝 Contributing

We welcome new trees, bug fixes, UI improvements, and backend integrations. Check the **Issues** tab for `good first issue` and `help wanted` labels.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and developer guidelines.

---

## 📜 License

MIT — see [LICENCE.md](./LICENCE.md). Education should be free, and so is this code.
