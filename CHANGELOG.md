# Changelog

All notable changes to SkilleTreeOSS are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.7.0] — 2026-02-27

This is the first public OSS release. It represents the full MVP platform, ready for community contributions.

### Added
- **Interactive Skill Canvas** — ReactFlow + Dagre auto-layout (LR/TB), 4 visual themes (World Map, RPG, Terminal, Neural), animated node state transitions (locked → available → completed)
- **Auth & Progress Sync** — Supabase email/password + OAuth, progress persisted in DB with localStorage fallback, reset-progress modal
- **XP & Level System** — 50 XP per completed node, 8 levels (Apprentice → Legend), SVG level-ring + Lv badge in UserMenu
- **Explore Page** — full-text search, category/difficulty filters, sort (A→Z, Most Popular, Top Rated, Easiest, Shortest), "Continue your journey" strip for in-progress trees, pagination (12/page)
- **Tree Ratings** — 1–5 star rating modal, per-tree average rating shown in Explore
- **Per-resource Voting** — upvote / downvote each resource card (helpful / not helpful)
- **Suggest a Better Resource** — inline collapsible form on every node → `resource_suggestions` table with `pending → reviewed → accepted/rejected` workflow
- **Live Platform Stats** — `site_stats` singleton table + Postgres trigger; landing page reads O(1) pre-aggregated counters
- **Dynamic Featured Trees** — configurable via `lib/featured-trees.ts`, backed by real tree JSON + DB stats
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

_Features planned for upcoming milestones are tracked in [GitHub Issues](../../issues)._

### Planned for v0.8.0
- Admin dashboard for reviewing `resource_suggestions`
- Contributor JSON linting in CI (GitHub Actions)
- Shareable progress image export

---

[0.7.0]: https://github.com/nasimstg/SkillTreeOSS/releases/tag/v0.7.0
