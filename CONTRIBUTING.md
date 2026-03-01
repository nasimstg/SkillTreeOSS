# Contributing to SkilleTreeOSS 🌳

First off, thank you for considering contributing to SkilleTreeOSS! Our mission is the **Democratization of Mastery**, and we can only achieve that by crowdsourcing the best learning paths from people who have actually walked them.

You do **not** need to be a programmer to contribute to this project. We welcome two types of contributions:

1. **Content:** Adding new skill trees or updating broken resource links (No coding required!).
2. **Code:** Improving the Next.js/React Flow frontend or Supabase backend.

---

## 🏗️ 1. Using the Visual Builder (Easiest)

The fastest way to create or update a skill tree is to use the **in-app builder** at [/builder](/builder). No JSON editing or GitHub knowledge required.

1. Go to `/builder` (or `/builder/[treeId]` to edit an existing tree)
2. Fill in the tree metadata (title, category, difficulty, description)
3. Double-click the canvas to add nodes; drag between nodes to connect them
4. Edit each node: label, description, zone, icon, and learning resources
5. Click **Preview** to see exactly how the tree will look in the viewer
6. Click **Submit Tree** to open a Pull Request:
   - **Anonymously** — the SkillTreeOSS bot opens the PR on your behalf
   - **As your GitHub account** — connect GitHub first (Settings → Connect GitHub), then the PR comes from your own fork

The PR will be reviewed by maintainers before it goes live.

---

## 🗺️ 2. Contributing Content Manually (JSON)

All the skill trees on the website are generated from simple text files formatted in JSON. They live in the `data/trees/` folder of this repository.

To add a new skill tree or update an existing one, you just need to edit these files!

### Step 1: Understand the JSON Structure

A skill tree file (e.g., `urban-sketching.json`) has three main parts: **Metadata**, **Nodes** (the skills), and **Edges** (the lines connecting them).

Here is a simple template:

```json
{
  "treeId": "urban-sketching",
  "title": "Urban Sketching",
  "category": "Art",
  "difficulty": "easy",
  "description": "Learn to draw the world around you on location.",
  "version": "1.0",
  "estimatedMonths": 2,
  "totalNodes": 2,
  "icon": "brush",
  "nodes": [
    {
      "id": "perspective-101",
      "label": "1-Point Perspective",
      "description": "Understand the horizon line and vanishing points.",
      "icon": "straighten",
      "zone": "Foundation",
      "resources": [
        {
          "id": "perspective-yt-artfundamentals",
          "title": "One Point Perspective Drawing Tutorial",
          "url": "https://youtube.com/watch?v=...",
          "type": "video",
          "author": "ArtFundamentals",
          "estimatedHours": 1.5,
          "isFree": true
        }
      ],
      "requires": []
    },
    {
      "id": "ink-wash",
      "label": "Ink & Wash Basics",
      "description": "Adding depth with watercolor over ink.",
      "icon": "water_drop",
      "zone": "Technique",
      "resources": [
        {
          "id": "ink-wash-yt-sketchingdaily",
          "title": "Beginner Ink and Wash",
          "url": "https://youtube.com/watch?v=...",
          "type": "video",
          "author": "SketchingDaily",
          "estimatedHours": 2,
          "isFree": true
        }
      ],
      "requires": ["perspective-101"]
    }
  ],
  "edges": [
    { "id": "e-perspective-ink", "source": "perspective-101", "target": "ink-wash" }
  ]
}
```

### Step 2: Key Rules for JSON Editing

* **No coordinates needed:** The app uses the Dagre layout engine to automatically compute node positions from the graph structure. You only need to define the `requires` relationships — the visual tree arranges itself. Do **not** add `position` fields; they are ignored.
* **`difficulty` values:** Use `"easy"`, `"medium"`, or `"hard"` (lowercase). The UI maps these to Beginner / Intermediate / Advanced labels.
* **Edges:** The `source` is the ID of the prerequisite skill. The `target` is the ID of the skill it unlocks. Every edge must have a matching entry in the node's `requires` array.
* **Resources:** We only link to **100% free** resources unless `"isFree": false` is explicitly set. Do not link to paid courses, bootcamps, or generic landing pages. Link directly to the specific YouTube video or article that teaches that exact node. Each node can have multiple resources — add alternatives across different formats (video + article + interactive).
* **`totalNodes`:** Keep this field accurate (equal to the number of node objects in the `nodes` array). It is used for progress calculations and stats.

### Step 3: Submitting Your Tree

1. Fork this repository.
2. Create a new branch (e.g., `add-urban-sketching-tree`).
3. Add your `.json` file to the `data/trees/` folder.
4. Submit a Pull Request (PR)! Our automated systems will check your file for missing commas or formatting errors.

---

## 💻 2. Contributing Code

If you want to help build the platform's UI or backend, we are thrilled to have you! We use **Next.js**, **React Flow**, **Zustand**, **Tailwind CSS**, and **Supabase**.

### Local Setup

1. Fork and clone the repo.
2. Run `npm install`.
3. Duplicate `.env.local.example` to `.env.local`. (You can use the mock Supabase keys provided in the example for local UI development, or spin up your own free Supabase project).
4. Run `npm run dev`.

### Development Guidelines

* **State Management:** For anything related to the canvas (dragging, zooming, selecting nodes, XP), strictly use the Zustand store in `lib/store.ts`. Do not use React Context for canvas state — it causes severe performance issues with React Flow.
* **XP / Levels:** `XP_PER_NODE`, `LEVEL_THRESHOLDS`, and `getLevelInfo()` are exported from `lib/utils.ts`. Import from there rather than redefining locally.
* **Styling:** Use Tailwind utility classes. Theme tokens (colors, backgrounds) are defined in `app/globals.css`.
* **Database (Supabase):** If your PR requires schema changes, add a migration file to `supabase/migrations/` and describe it in your PR. Use sequential filenames (`20240104_…`). Always enable RLS on new tables.
* **Server Components & Cookies:** Use `createServerSupabaseClient()` from `lib/supabase-server.ts` in Server Components and Route Handlers. The `setAll` cookie handler silently no-ops in Server Components (by design) — session refresh is handled by middleware.
* **Featured Trees:** To feature a different tree on the landing page, edit `lib/featured-trees.ts` — no other code changes needed.

---

## ✅ The Pull Request Process

1. Ensure your code lints (`npm run lint`) and builds (`npm run build`).
2. Update the README.md with details of changes to the interface or new environment variables.
3. Your PR will be reviewed by a maintainer. We may suggest some UI tweaks or ask you to adjust a node's coordinates so the tree looks perfectly balanced.

Welcome to the party. Let's build the ultimate map of human knowledge!
