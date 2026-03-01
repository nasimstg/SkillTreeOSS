# Testing & QA Strategy

This document defines the testing approach for SkilleTreeOSS — covering unit tests, integration tests, and end-to-end (E2E) tests for both the viewer canvas and the visual builder.

---

## Overview

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Pure functions in `lib/` (`autoLayout`, `builder-utils`, store logic) |
| Integration | Vitest + React Testing Library | Individual React components (non-canvas) |
| E2E | Playwright | Full user journeys in a real browser |
| Manual QA | Browser | ReactFlow canvas interactions (drag, connect, viewport) |

ReactFlow canvases are **not** suited to automated DOM testing (they render to SVG/Canvas with pointer-event simulation that doesn't translate to jsdom). Canvas-heavy interactions are covered by Playwright E2E tests and manual QA checklists.

---

## 1. Unit Tests (Vitest)

### Setup

```bash
npm install --save-dev vitest @vitest/ui jsdom
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

Run: `npx vitest run` (CI) or `npx vitest` (watch mode).

---

### `lib/autoLayout.ts`

Test that `computeAutoLayout` returns correct `{x, y}` positions for a simple tree.

```typescript
// tests/unit/autoLayout.test.ts
describe('computeAutoLayout', () => {
  it('assigns non-overlapping positions for a linear chain', async () => {
    const nodes = [mockNode('a'), mockNode('b'), mockNode('c')]
    const edges = [mockEdge('a', 'b'), mockEdge('b', 'c')]
    const result = await computeAutoLayout(nodes, edges, 'LR')
    // Each node should have a unique x position
    const xs = result.map(n => n.position.x)
    expect(new Set(xs).size).toBe(3)
  })

  it('accepts custom dims for builder nodes', async () => {
    const nodes = [mockNode('a'), mockNode('b')]
    const edges = [mockEdge('a', 'b')]
    const result = await computeAutoLayout(nodes, edges, 'TB', { w: 208, h: 180 })
    expect(result[0].position).toBeDefined()
  })
})
```

---

### `lib/builder-utils.ts`

#### `exportTree`

```typescript
// tests/unit/builder-utils.test.ts
describe('exportTree', () => {
  it('derives requires[] from edges', () => {
    const draft: BuilderDraft = {
      nodes: [mockBuilderNode('a'), mockBuilderNode('b')],
      edges: [mockEdge('a', 'b')],
      meta: mockMeta(),
    }
    const tree = exportTree(draft)
    const nodeB = tree.nodes.find(n => n.id === 'b')!
    expect(nodeB.requires).toEqual(['a'])
  })

  it('sets totalNodes from nodes.length', () => {
    const draft = mockDraftWithNodes(5)
    const tree = exportTree(draft)
    expect(tree.totalNodes).toBe(5)
  })
})
```

#### `validateTree`

```typescript
describe('validateTree', () => {
  it('returns no errors for a valid tree', () => {
    const tree = validTreeFixture()
    expect(validateTree(tree)).toHaveLength(0)
  })

  it('catches a missing requires reference', () => {
    const tree = validTreeFixture()
    tree.nodes[0].requires = ['nonexistent-id']
    const errors = validateTree(tree)
    expect(errors.some(e => e.message.includes('nonexistent-id'))).toBe(true)
  })

  it('detects circular dependencies', () => {
    const tree = validTreeFixture()
    // a → b → a
    tree.nodes[0].requires = ['b']
    tree.nodes[1].requires = ['a']
    const errors = validateTree(tree)
    expect(errors.some(e => e.message.toLowerCase().includes('circular'))).toBe(true)
  })

  it('flags non-https resource URLs', () => {
    const tree = validTreeFixture()
    tree.nodes[0].resources[0].url = 'http://example.com'
    const errors = validateTree(tree)
    expect(errors.some(e => e.message.includes('https'))).toBe(true)
  })

  it('flags mismatched totalNodes', () => {
    const tree = validTreeFixture()
    tree.totalNodes = 999
    const errors = validateTree(tree)
    expect(errors.some(e => e.message.includes('totalNodes'))).toBe(true)
  })
})
```

---

### Zustand Stores

Test store actions in isolation by creating a fresh store instance per test.

```typescript
// tests/unit/store.test.ts
describe('useSkillTreeStore', () => {
  it('optimistically adds nodeId to completedNodeIds', () => {
    const store = createSkillTreeStore()
    store.getState().completeNode('node-1', 'tree-a')
    expect(store.getState().completedNodeIds).toContain('node-1')
  })

  it('rolls back on API failure', async () => {
    const store = createSkillTreeStore()
    // mock fetch to return 500
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    await store.getState().completeNode('node-1', 'tree-a')
    expect(store.getState().completedNodeIds).not.toContain('node-1')
  })
})

describe('useBuilderStore', () => {
  it('addNode increments node count', () => {
    const store = createBuilderStore()
    store.getState().addNode({ label: 'Test', zone: 'Foundation' })
    expect(store.getState().nodes).toHaveLength(1)
  })

  it('undo/redo restores previous state', () => {
    const store = createBuilderStore()
    store.getState().addNode({ label: 'A', zone: 'Foundation' })
    store.getState().addNode({ label: 'B', zone: 'Frontend' })
    store.getState().undo()
    expect(store.getState().nodes).toHaveLength(1)
    store.getState().redo()
    expect(store.getState().nodes).toHaveLength(2)
  })
})
```

---

### XP / Level Calculation

```typescript
// tests/unit/xp.test.ts
describe('XP and level system', () => {
  it('awards 50 XP per completed node', () => {
    expect(calculateXP(3)).toBe(150)
  })

  it('returns Apprentice for 0 XP', () => {
    expect(getLevelName(0)).toBe('Apprentice')
  })

  it('returns Legend at max XP', () => {
    expect(getLevelName(MAX_XP)).toBe('Legend')
  })

  it('completion percentage is clamped to 0–100', () => {
    expect(completionPercent(0, 10)).toBe(0)
    expect(completionPercent(5, 10)).toBe(50)
    expect(completionPercent(10, 10)).toBe(100)
  })
})
```

---

## 2. Integration Tests (React Testing Library)

Non-canvas components can be tested with RTL + jsdom.

### `NodeSidebar`

```typescript
// tests/integration/NodeSidebar.test.tsx
it('renders resource metadata', () => {
  render(<NodeSidebar node={mockNodeWithResources()} />)
  expect(screen.getByText('Mark as Completed')).toBeInTheDocument()
  expect(screen.getByText('2.5 hours')).toBeInTheDocument()
})

it('disables CTA when node is locked', () => {
  render(<NodeSidebar node={mockLockedNode()} />)
  expect(screen.getByRole('button', { name: /mark as completed/i })).toBeDisabled()
})
```

### `MetadataPanel`

```typescript
it('calls setMeta when title input changes', async () => {
  const setMeta = vi.fn()
  render(<MetadataPanel meta={mockMeta()} setMeta={setMeta} />)
  await userEvent.type(screen.getByLabelText('Title'), 'X')
  expect(setMeta).toHaveBeenCalled()
})
```

---

## 3. End-to-End Tests (Playwright)

### Setup

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

Run: `npx playwright test` (CI) or `npx playwright test --headed` (local debug).

---

### E2E Test Suites

#### Suite 1: Viewer — Complete a Node

```typescript
// tests/e2e/viewer-complete-node.spec.ts
test('guest can mark a node as completed (localStorage)', async ({ page }) => {
  await page.goto('/tree/git-github-mastery')

  // Canvas loads
  await expect(page.locator('.react-flow__node')).toHaveCountGreaterThan(0)

  // Click first available node
  const firstNode = page.locator('.react-flow__node').first()
  await firstNode.click()

  // Sidebar opens
  await expect(page.locator('[data-testid="node-sidebar"]')).toBeVisible()

  // Click Mark as Completed
  await page.getByRole('button', { name: /mark as completed/i }).click()

  // Node has completed class
  await expect(firstNode).toHaveClass(/completed/)

  // XP bar updated
  await expect(page.locator('[data-testid="xp-bar"]')).toBeVisible()
})
```

#### Suite 2: Auth — Login and Progress Sync

```typescript
test('authenticated user progress persists on reload', async ({ page }) => {
  // Login via Supabase email
  await page.goto('/login')
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!)
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/dashboard')

  // Open a tree, complete a node
  await page.goto('/tree/git-github-mastery')
  const node = page.locator('.react-flow__node').first()
  await node.click()
  await page.getByRole('button', { name: /mark as completed/i }).click()
  await expect(node).toHaveClass(/completed/)

  // Reload — node should still be completed
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  await expect(node).toHaveClass(/completed/)
})
```

#### Suite 3: Builder — Create a Tree and Preview It

```typescript
test('user can create a minimal tree and switch to preview mode', async ({ page }) => {
  await page.goto('/builder')

  // Builder canvas loads
  await expect(page.locator('.builder-rf-wrapper')).toBeVisible()

  // Double-click to add a node
  await page.locator('.builder-rf-wrapper').dblclick({ position: { x: 400, y: 300 } })

  // Editor panel opens
  await expect(page.locator('[data-builder-panel]')).toBeVisible()

  // Fill in node label
  await page.locator('[data-builder-panel] input[name="label"]').fill('Test Node')

  // Switch to preview mode
  await page.getByRole('tab', { name: /preview/i }).click()

  // SkillCanvas renders (FAB pill visible)
  await expect(page.locator('[data-testid="canvas-fab"]')).toBeVisible()
})
```

#### Suite 4: Explore — Search and Filter

```typescript
test('search filters tree cards', async ({ page }) => {
  await page.goto('/explore')
  const initialCount = await page.locator('[data-testid="tree-card"]').count()

  await page.fill('[data-testid="search-input"]', 'python')
  const filteredCount = await page.locator('[data-testid="tree-card"]').count()

  expect(filteredCount).toBeLessThan(initialCount)
  expect(filteredCount).toBeGreaterThan(0)
})
```

#### Suite 5: Navigation — Auth Guard

```typescript
test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})
```

---

## 4. Manual QA Checklist

These interactions cannot be reliably automated and must be manually verified before each release:

### Viewer Canvas
- [ ] All 4 view modes (worldmap / rpg / terminal / neural) render correctly
- [ ] Dagre auto-layout runs on first load (LR and TB)
- [ ] `Ctrl+L` toggles layout direction and re-runs layout with `fitView`
- [ ] Node sidebar slides in/out correctly (Framer Motion)
- [ ] Prereq timeline shows correct topological order
- [ ] Hovering a prereq item highlights the canvas node
- [ ] Clicking a prereq pans the canvas to that node
- [ ] Center-on-selected pans correctly with the sidebar open
- [ ] Share button copies URL to clipboard (or triggers toast)

### Builder Canvas
- [ ] Double-click creates a node at the clicked position
- [ ] `N` key creates a node at the cursor position
- [ ] Drag between node handles creates an edge
- [ ] Right-click opens the context menu (node and pane variants)
- [ ] Liquid bubble animation works for Select ↔ Pan tool switch
- [ ] Tab bubble animation works for Build ↔ Preview switch
- [ ] Multi-select (rectangular drag + Ctrl+click) works
- [ ] `Ctrl+Z` / `Ctrl+Y` undo/redo works
- [ ] `Ctrl+L` toggles layout direction with `fitView`
- [ ] Auto-center pans selected node into the leftover area (excluding editor panel)
- [ ] Preview mode renders the full SkillCanvas viewer with all 4 themes
- [ ] Submit PR modal shows validation errors before allowing submission
- [ ] Anonymous submit creates a real PR on GitHub
- [ ] `?` modal opens in both Build and Preview modes

---

## 5. Test Data & Fixtures

- Test user credentials stored in `.env.test` (gitignored):
  ```
  TEST_USER_EMAIL=test@skilltreeoss.dev
  TEST_USER_PASSWORD=...
  ```
- Fixture trees for unit tests live in `tests/fixtures/trees/` as minimal valid `SkillTree` objects.
- All fixtures are validated against `data/schema.json` as part of the test setup.

---

## 6. CI Integration

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx vitest run

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

> **Note:** E2E tests are planned for v0.9. Unit tests for `lib/` utilities are the immediate priority.
