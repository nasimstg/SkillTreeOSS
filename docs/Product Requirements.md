# Product Requirements Document (PRD)

**Project Name:** SkilleTreeOSS
**Version:** 0.8.0
**Objective:** To provide an interactive, gamified learning platform where complex disciplines are mapped into visual "skill trees" connected to the internet's best free resources — and to give anyone the tools to create and publish those trees without writing code.

---

### Target Personas

* **The Learner:** Self-taught individuals overwhelmed by disjointed tutorials who need clear direction and a sense of progression.
* **The Builder (Subject Matter Expert):** Wants to share their learning path; needs an easy visual tool — not a JSON file or a coding environment.
* **The Contributor (Technical):** Comfortable with JSON and GitHub PRs; wants to contribute trees or improve the platform code.
* **The Maintainer:** Needs to review Pull Requests quickly and ensure no malicious links or malformed data are merged.

---

### Core User Stories

**Learner**
* As a *Learner*, I want to click a node to see the best free resource so I don't waste time searching.
* As a *Learner*, I want to mark nodes as "Completed" to track my progress and see the next available branches light up.
* As a *Learner*, I want to upvote/downvote a resource if it is broken or outdated.
* As a *Learner*, I want to suggest a better resource for any node, including a description of the issue and an optional link.
* As a *Learner*, I want to authenticate via GitHub or Google to save my learning progress across devices.
* As a *Learner*, I want to see my XP and level so I feel a sense of progression across all trees.
* As a *Learner*, I want to rate a tree after completing nodes so others can discover high-quality content.
* As a *Learner*, I want to search and filter all available trees to find exactly the skill I need.
* As a *Learner*, I want to see my in-progress trees so I can quickly resume where I left off.
* As a *Learner*, I want to reset my progress on a tree if I want to start over.

**Builder**
* As a *Builder*, I want to create a skill tree visually by dragging nodes on a canvas so I don't have to learn JSON syntax.
* As a *Builder*, I want to preview exactly how my tree will look to learners before I submit it.
* As a *Builder*, I want to submit my tree as a GitHub PR without needing a GitHub account, so the barrier to contribution is as low as possible.
* As a *Builder*, I want keyboard shortcuts so I can work efficiently without reaching for the mouse constantly.
* As a *Builder*, I want an in-app guide so I can learn how to use the builder without reading external documentation.

---

### Implemented Features

| Feature | Version |
| --- | --- |
| Interactive skill canvas (4 themes, Dagre layout LR/TB) | v0.7 |
| Node completion + progress sync (localStorage + Supabase) | v0.7 |
| Auth (email/password, OAuth via Supabase) | v0.7 |
| XP & level system (50 XP/node, 8 levels: Apprentice → Legend) | v0.7 |
| Navbar UserMenu with SVG level-ring + Lv badge | v0.7 |
| Explore page — search, filter, sort, pagination (12/page) | v0.7 |
| "Continue your journey" in-progress strip on Explore | v0.7 |
| Tree ratings (1–5 stars, `tree_ratings` table, upsert) | v0.7 |
| Implicit enrollment via `user_progress` | v0.7 |
| Live landing-page stats via `site_stats` singleton + Postgres trigger | v0.7 |
| Dynamic featured trees configurable in `lib/featured-trees.ts` | v0.7 |
| Per-resource voting (helpful / not helpful) | v0.7 |
| "Suggest a better resource" inline form → `resource_suggestions` table | v0.7 |
| Reset progress with confirmation modal | v0.7 |
| Canvas toast system (sequential dismissal, card stacking) | v0.7 |
| 29 skill trees across Technology, Science, Art, Health, Finance, Language | v0.7 |
| **Visual Skill Tree Builder** (`/builder`, `/builder/[treeId]`) | **v0.8** |
| **Builder — multi-select** (rectangular drag + `Ctrl+click`) | **v0.8** |
| **Builder — right-click context menu** (node + pane variants) | **v0.8** |
| **Builder — full keyboard shortcut system** (`V`, `H`, `N`, `Ctrl+A`, `Ctrl+L`, `?`, `Escape`) | **v0.8** |
| **Builder — `?` shortcuts & guide modal** (Quick Start + keyboard reference) | **v0.8** |
| **Builder — liquid bubble animation** (Framer Motion `layoutId` for tool/tab switches) | **v0.8** |
| **Builder — smart node placement** (21-point spiral grid, `N` at cursor) | **v0.8** |
| **Builder — auto-center on node select** (accounts for fixed editor panel width) | **v0.8** |
| **Builder — Dagre auto-layout with LR/TB direction toggle** | **v0.8** |
| **Builder — Preview mode** (live `SkillCanvas` from builder state) | **v0.8** |

---

### Database Tables

| Table | Purpose |
| --- | --- |
| `user_progress` | `completed_node_ids text[]` per user per tree |
| `tree_ratings` | 1–5 star ratings, unique per (user, tree) |
| `site_stats` | Singleton row with pre-aggregated platform counters |
| `resource_suggestions` | Community-submitted resource improvement requests |

---

### Success Metrics

| Metric | Description | Target (Q1) |
| --- | --- | --- |
| **User Retention** | % of users returning to mark a second node within 7 days | 25% |
| **Builder Adoption** | % of new tree PRs created via the visual builder (vs. raw JSON) | 60% |
| **Open Source Health** | Merged community PRs adding new trees or fixing links | 50 PRs |
| **Platform Stability** | Uptime of the Next.js frontend and Supabase backend | 99.9% |
| **Resource Quality** | % of resource suggestions reviewed within 14 days | 80% |
| **Tree Ratings** | Average star rating across all rated trees | ≥ 4.0 |

---

### Planned (v0.9+)

- Admin dashboard for reviewing `resource_suggestions`
- GitHub Actions JSON schema linting on PRs (`data/schema.json` + Zod)
- Shareable progress image export
- Builder — collaborative editing (multiple cursors via Supabase Realtime)
- Builder — node templates / starter packs
