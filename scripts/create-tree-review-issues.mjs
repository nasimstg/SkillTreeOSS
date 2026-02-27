/**
 * create-tree-review-issues.mjs
 *
 * Bulk-creates one GitHub issue per skill tree asking subject-matter
 * experts to verify / update resources and roadmap order.
 *
 * Usage:
 *   1. gh auth login          (one time)
 *   2. node scripts/create-tree-review-issues.mjs
 *
 * Requires: Node 18+, GitHub CLI (gh) installed and authenticated.
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TREES_DIR = join(__dirname, '..', 'data', 'trees')
const REPO = 'nasimstg/SkillTreeOSS'

// ─── Labels to create (idempotent — skips if already exists) ─────────────────

const LABELS = [
  { name: 'tree-review',  color: '0075ca', description: 'Community review of a skill tree\'s nodes and resources' },
  { name: 'help wanted',  color: '008672', description: 'Extra attention needed' },
  { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
]

function ensureLabels() {
  for (const label of LABELS) {
    try {
      execSync(
        `gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --repo ${REPO}`,
        { stdio: 'pipe' }
      )
      console.log(`  ✅ Created label: ${label.name}`)
    } catch {
      // Already exists — that's fine
      console.log(`  ⏭️  Label exists: ${label.name}`)
    }
  }
}

// ─── Trees ────────────────────────────────────────────────────────────────────

const TREES = [
  'full-stack-dev', 'ml-ai-engineer', 'photography-mastery',
  'advanced-mathematics', 'aerospace-engineering', 'astronomy-101',
  'backend-dev', 'bioinformatics', 'cryptography', 'culinary-arts',
  'cybersecurity-basics', 'data-analyst', 'devops-engineer',
  'digital-marketing', 'financial-analyst', 'frontend-dev',
  'game-engine-dev', 'git-github-mastery', 'marathon-training',
  'meditation-mindfulness', 'neuroscience', 'public-speaking',
  'quantitative-finance', 'quantum-computing', 'react-native-mobile',
  'rust-backend', 'spanish-basics', 'ui-ux-design', 'writing-novel',
]

function difficultyLabel(d) {
  return { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced' }[d] ?? d
}

function buildBody(tree) {
  return `\
## 🌳 Tree: ${tree.title}

**Category:** ${tree.category}
**Difficulty:** ${difficultyLabel(tree.difficulty)}
**Nodes:** ${tree.totalNodes}
**Description:** ${tree.description}

---

If you have real-world experience in **${tree.title}**, we'd love your expertise!
This issue tracks the community review of this skill tree's nodes and resources.

## ✅ What to check

- [ ] Are all **${tree.totalNodes} nodes** the right skills? Are any important concepts missing?
- [ ] Is the **learning order / prerequisites** logical for a self-learner?
- [ ] Are all linked resources still **working and 100% free**?
- [ ] Are there **better free alternatives** (YouTube, articles, interactive tools) for any node?
- [ ] Is the **difficulty** (${difficultyLabel(tree.difficulty)}) accurate?
- [ ] Is the time estimate realistic?

## 🛠️ How to contribute

You **don't need to be a programmer** — you can edit the file directly on GitHub.

1. Open [\`data/trees/${tree.treeId}.json\`](../blob/main/data/trees/${tree.treeId}.json)
2. Click the ✏️ pencil icon to edit
3. Make your changes following the schema in [CONTRIBUTING.md](../blob/main/CONTRIBUTING.md)
4. Open a Pull Request and link it to this issue with \`Closes #<issue-number>\`

---
*Part of the v0.7.0 community review initiative — help us build the ultimate map of human knowledge!*`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n🏷️  Ensuring labels exist...')
ensureLabels()

console.log('\n📋 Creating issues...\n')

let created = 0
let skipped = 0

for (const treeId of TREES) {
  const filePath = join(TREES_DIR, `${treeId}.json`)
  const tree = JSON.parse(readFileSync(filePath, 'utf8'))

  const title = `[Tree Review] ${tree.title} (${tree.category})`
  const body  = buildBody(tree)

  // Write body to a temp file so newlines aren't mangled by shell escaping
  const tmpFile = join(tmpdir(), `tree-review-${treeId}.md`)
  try {
    writeFileSync(tmpFile, body, 'utf8')
    const result = execSync(
      `gh issue create --title ${JSON.stringify(title)} --body-file ${JSON.stringify(tmpFile)} --label "tree-review" --label "help wanted" --label "good first issue" --repo ${REPO}`,
      { encoding: 'utf8' }
    ).trim()
    console.log(`  ✅ ${tree.title}`)
    console.log(`     ${result}`)
    created++
  } catch (err) {
    console.error(`  ❌ Failed: ${tree.title}`)
    console.error(`     ${err.message}`)
    skipped++
  } finally {
    try { unlinkSync(tmpFile) } catch { /* ignore */ }
  }

  // Small delay to avoid rate-limiting
  await new Promise(r => setTimeout(r, 400))
}

console.log(`\n✨ Done — ${created} issues created, ${skipped} failed.`)
