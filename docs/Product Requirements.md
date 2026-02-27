# 1. Product Requirements Document (PRD)

**Project Name:** SkilleTreeOSS
**Version:** 0.7.0
**Objective:** To provide an interactive, gamified learning platform where complex disciplines are mapped into visual "skill trees" connected to the internet's best free resources.

### Target Personas

* **The Learner:** Self-taught individuals overwhelmed by disjointed tutorials who need clear direction and a sense of progression.
* **The Contributor (Subject Matter Expert):** Wants to share their learning path but doesn't want to build a whole website, needing an easy way to submit a JSON file.
* **The Maintainer:** Needs to review Pull Requests (PRs) quickly and ensure no malicious links are merged.

### Core User Stories

* As a *Learner*, I want to click a node to see the best free resource so I don't waste time searching.
* As a *Learner*, I want to mark nodes as "Completed" to track my progress and see the next available branches.
* As a *Learner*, I want to upvote/downvote a resource if it is broken or outdated.
* As a *Learner*, I want to suggest a better resource for any node, including a description of the issue and an optional link.
* As a *Contributor*, I want to submit a new skill tree via a standard JSON file.
* As a *Learner*, I want to authenticate via GitHub or Google to save my learning progress across devices.
* As a *Learner*, I want to generate a shareable visual summary of my completed skill tree for my professional network.
* As a *Learner*, I want to see my XP and level so I feel a sense of progression across all trees.
* As a *Learner*, I want to rate a tree after completing nodes so others can discover high-quality content.
* As a *Learner*, I want to search and filter all available trees to find exactly the skill I need.
* As a *Learner*, I want to see my in-progress trees so I can quickly resume where I left off.
* As a *Learner*, I want to reset my progress on a tree if I want to start over.

### Implemented Features (v0.7)

| Feature | Status |
| --- | --- |
| Interactive skill canvas (4 themes, Dagre layout LR/TB) | ✅ |
| Node completion + progress sync (localStorage + Supabase) | ✅ |
| Auth (email/password, OAuth via Supabase) | ✅ |
| XP & level system (50 XP/node, 8 levels: Apprentice → Legend) | ✅ |
| Navbar UserMenu with SVG level-ring + Lv badge | ✅ |
| Explore page — search, filter, sort, pagination (12/page) | ✅ |
| "Continue your journey" in-progress strip on Explore | ✅ |
| Tree ratings (1–5 stars, `tree_ratings` table, upsert) | ✅ |
| Implicit enrollment via `user_progress` | ✅ |
| Live landing-page stats via `site_stats` singleton + Postgres trigger | ✅ |
| Dynamic featured trees configurable in `lib/featured-trees.ts` | ✅ |
| Per-resource voting (helpful / not helpful) | ✅ |
| "Suggest a better resource" inline form → `resource_suggestions` table | ✅ |
| Reset progress with confirmation modal | ✅ |
| Canvas toast system (sequential dismissal, card stacking) | ✅ |
| 29 skill trees across Technology, Science, Art, Health, Finance, Language | ✅ |

### Database Tables

| Table | Purpose |
| --- | --- |
| `user_progress` | `completed_node_ids text[]` per user per tree |
| `tree_ratings` | 1–5 star ratings, unique per (user, tree) |
| `site_stats` | Singleton row with pre-aggregated platform counters |
| `resource_suggestions` | Community-submitted resource improvement requests |

### Success Metrics

| Metric | Description | Target (Q1) |
| --- | --- | --- |
| **User Retention** | Percentage of users returning to mark a second node as completed within 7 days. | 25% |
| **Open Source Health** | Number of merged community PRs adding new trees or fixing links. | 50 PRs |
| **Platform Stability** | Uptime of the Next.js frontend and Supabase backend. | 99.9% |
| **Resource Quality** | Percentage of resource suggestions reviewed within 14 days. | 80% |
| **Tree Ratings** | Average star rating across all rated trees. | ≥ 4.0 |
