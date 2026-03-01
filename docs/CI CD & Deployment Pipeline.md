# CI/CD & Deployment Pipeline

This document describes the automated pipeline that protects `main` from bad data, provides per-PR preview environments, and governs production deployments.

---

## Overview

```
Developer / Community contributor
        │
        │  opens Pull Request
        ▼
┌───────────────────────────────────────────────────┐
│  GitHub Actions                                   │
│                                                   │
│  1. validate-trees.yml  (if data/trees/** changed)│
│     ├── JSON Schema validation (Ajv, draft-07)    │
│     └── Zod runtime validation                    │
│                                                   │
│  2. typecheck.yml  (on every PR)                  │
│     └── npx tsc --noEmit                          │
└────────────────────┬──────────────────────────────┘
                     │  all checks pass
                     ▼
        ┌────────────────────────┐
        │  Vercel Preview Deploy │  ← auto-triggered by Vercel GitHub App
        │  (per-PR unique URL)   │
        └────────────────────────┘
                     │
                     │  maintainer reviews + approves
                     ▼
        ┌────────────────────────┐
        │  Merge to main         │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Vercel Production     │  ← auto-deployed on merge
        │  Deploy                │
        └────────────────────────┘
```

---

## 1. GitHub Actions Workflows

### `validate-trees.yml` — Tree JSON Validation

Runs on every PR that touches `data/trees/**` or `data/schema.json`.

```yaml
name: Validate Skill Trees

on:
  pull_request:
    paths:
      - 'data/trees/**'
      - 'data/schema.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run validate:trees
```

The `validate:trees` npm script (in `package.json`) runs a Node script that:

1. Reads `data/schema.json` (JSON Schema draft-07)
2. Iterates every file in `data/trees/*.json`
3. Validates each file with **Ajv** against the schema
4. Additionally parses each file through the **Zod** `SkillTreeSchema` (same schema used at runtime) for runtime-type safety
5. Checks business rules not expressible in JSON Schema:
   - All `requires[]` entries on each node must reference a valid `node.id` within the same tree
   - No circular dependency chains (DFS cycle detection)
   - `totalNodes` matches `nodes.length`
   - Every `resource.url` starts with `https://`
   - `estimatedHours` is a positive number on every resource
6. Outputs a summary of all errors with file name + path
7. Exits with code 1 on any error (blocks PR merge)

**Failure output example:**
```
✗ data/trees/my-new-tree.json
  [node "css-grid"] resource[0].estimatedHours: Required
  [node "flexbox"] requires[1]: "nonexistent-node" not found in tree
  totalNodes: declared 12, actual 11

1 file failed validation. Fix errors before merging.
```

---

### `typecheck.yml` — TypeScript Type Check

Runs on every PR (all file paths).

```yaml
name: TypeScript

on:
  pull_request:

jobs:
  tsc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
```

This catches type errors introduced in application code without running a full Next.js build.

---

### `lint.yml` — ESLint (Planned)

Planned for v0.9. Will run ESLint with `next/core-web-vitals` ruleset on every PR.

---

## 2. Branch Protection Rules

The `main` branch is protected with the following rules (configured in GitHub → Settings → Branches):

| Rule | Setting |
|------|---------|
| Require PR before merging | ✅ enabled |
| Required status checks | `validate` (trees workflow), `tsc` (typecheck workflow) |
| Require branches to be up to date | ✅ enabled |
| Dismiss stale reviews on new commits | ✅ enabled |
| Restrict who can push to main | Maintainers only |
| Allow force pushes | ❌ disabled |
| Allow deletions | ❌ disabled |

PRs that fail the `validate-trees` or `typecheck` checks cannot be merged.

---

## 3. Vercel Deployment

### Preview Environments (Per-PR)

Vercel's GitHub App automatically deploys a unique preview URL for every PR. This enables maintainers to:

- Visually inspect new skill trees in all 4 canvas themes before merging
- Verify builder behaviour for `edit existing tree` PRs
- Confirm landing page stats and explore-page changes render correctly

Preview URLs follow the pattern:
```
https://skilltreeoss-git-{branch-name}-{team}.vercel.app
```

Preview builds use production Supabase credentials (read-only for tree data) so the preview shows real data.

### Production Deployment

On merge to `main`, Vercel automatically:

1. Triggers a new production build (`next build` with Turbopack)
2. Runs the Next.js build optimizations (SSG for static pages, ISR for tree pages)
3. Deploys to the CDN edge network
4. Aliases the new deployment to the production domain

**Build time:** typically < 2 minutes for the full Next.js build.

### Environment Variables

All environment variables are set in the Vercel Dashboard (not committed to the repo):

| Variable | Environment | Purpose |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview | Server-side Supabase admin (API routes) |
| `GITHUB_BOT_TOKEN` | Production + Preview | Bot PAT for anonymous PR submissions |
| `GITHUB_CLIENT_ID` | Production + Preview | GitHub OAuth App for "Connect GitHub" |
| `GITHUB_CLIENT_SECRET` | Production + Preview | GitHub OAuth App secret |
| `APP_URL` | Production + Preview | Canonical URL (for OAuth redirect URIs) |

Local development uses `.env.local` (gitignored; copied from `.env.local.example`).

---

## 4. Builder PR Submission Flow

The in-app builder submits trees as GitHub PRs via `/api/builder/submit`. This is separate from the CI/CD pipeline above but interacts with it:

```
User clicks "Submit PR" in builder
        │
        ▼
POST /api/builder/submit
        │
        ├── Serialise builder state → SkillTree JSON
        ├── Validate JSON (same Zod schema as CI)
        ├── Base64-encode content
        │
        ├── [Anonymous] Use GITHUB_BOT_TOKEN
        │       └── create branch → create/update file → open PR
        │
        └── [GitHub-connected] Use user's OAuth token
                └── fork repo → create branch → create/update file → open PR from fork
                        │
                        ▼
                GitHub Actions runs validate-trees.yml on the new PR
                Vercel generates a preview URL for maintainer review
```

---

## 5. Local Development

```bash
# Install dependencies
npm install

# Run dev server (port 3000, Turbopack)
npm run dev

# Type-check without building
npx tsc --noEmit

# Validate all tree JSON files
npm run validate:trees

# Build for production locally
npm run build
npm start
```

---

## 6. Merge Checklist (for Maintainers)

Before merging any PR:

- [ ] All GitHub Actions checks are green (`validate`, `tsc`)
- [ ] Vercel preview URL loads correctly
- [ ] New/edited tree renders in all 4 canvas views (worldmap, rpg, terminal, neural)
- [ ] Node sidebar shows correct resources and prereq timeline
- [ ] No regressions on `/explore` (new tree appears with correct metadata)
- [ ] `CHANGELOG.md` updated if the PR includes app code changes
