import { Octokit } from '@octokit/rest'
import type { SkillTree } from '@/types/tree'

const OWNER = 'nasimstg'
const REPO = 'SkillTreeOSS'
const BASE_BRANCH = 'main'

function treePath(treeId: string) {
  return `data/trees/${treeId}.json`
}

function treeContent(tree: SkillTree): string {
  return JSON.stringify(tree, null, 2) + '\n'
}

function branchName(treeId: string): string {
  return `tree-submission/${treeId}-${Date.now()}`
}

/** Get the current HEAD SHA of main */
async function getMainSha(octokit: Octokit): Promise<string> {
  const { data } = await octokit.rest.git.getRef({
    owner: OWNER, repo: REPO, ref: `heads/${BASE_BRANCH}`,
  })
  return data.object.sha
}

/** Get file SHA if it exists in the repo (undefined if not found) */
async function getFileSha(
  octokit: Octokit,
  path: string,
  owner = OWNER,
  repo = REPO,
): Promise<string | undefined> {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
    if ('sha' in data) return data.sha
  } catch {
    // 404 — file doesn't exist yet
  }
  return undefined
}

// ─── Bot flow (anonymous / no GitHub connection) ──────────────────────────────

export async function createTreePR(
  tree: SkillTree,
  isEdit: boolean,
): Promise<{ prUrl: string }> {
  const token = process.env.GITHUB_BOT_TOKEN
  if (!token) throw new Error('GITHUB_BOT_TOKEN is not configured')

  const octokit = new Octokit({ auth: token })
  const branch   = branchName(tree.treeId)
  const path     = treePath(tree.treeId)
  const content  = Buffer.from(treeContent(tree)).toString('base64')
  const mainSha  = await getMainSha(octokit)
  const fileSha  = await getFileSha(octokit, path)

  // Create branch from main
  await octokit.rest.git.createRef({
    owner: OWNER, repo: REPO, ref: `refs/heads/${branch}`, sha: mainSha,
  })

  // Create or update the file on the branch
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path, branch, content,
    message: isEdit
      ? `chore: update ${tree.treeId} skill tree — submitted via builder`
      : `feat: add ${tree.treeId} skill tree — submitted via builder`,
    ...(fileSha ? { sha: fileSha } : {}),
  })

  // Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER, repo: REPO,
    head: branch, base: BASE_BRANCH,
    title: isEdit
      ? `[Update] ${tree.title} skill tree`
      : `[New Tree] ${tree.title}`,
    body: buildPrBody(tree, 'Anonymous contributor via SkilleTree Builder', isEdit),
  })

  return { prUrl: pr.html_url }
}

// ─── Fork flow (GitHub-connected user) ───────────────────────────────────────

export async function createTreePRFromFork(
  tree: SkillTree,
  userToken: string,
  githubUsername: string,
  isEdit: boolean,
): Promise<{ prUrl: string }> {
  const userOctokit = new Octokit({ auth: userToken })
  const botOctokit  = new Octokit({ auth: process.env.GITHUB_BOT_TOKEN })

  // 1. Ensure fork exists
  const forkExists = await checkForkExists(userOctokit, githubUsername)
  if (!forkExists) {
    await userOctokit.rest.repos.createFork({ owner: OWNER, repo: REPO })
    // Wait for fork to be ready (GitHub is eventually consistent)
    await waitForFork(userOctokit, githubUsername)
  }

  // 2. Get upstream main SHA (use bot token so rate limits apply to bot)
  const mainSha = await getMainSha(botOctokit)

  // 3. Create branch in user's fork from upstream main SHA
  const branch = branchName(tree.treeId)
  await userOctokit.rest.git.createRef({
    owner: githubUsername, repo: REPO,
    ref: `refs/heads/${branch}`, sha: mainSha,
  })

  // 4. Check if file exists in user's fork
  const path    = treePath(tree.treeId)
  const content = Buffer.from(treeContent(tree)).toString('base64')
  const fileSha = await getFileSha(userOctokit, path, githubUsername, REPO)

  // 5. Create/update file in fork
  await userOctokit.rest.repos.createOrUpdateFileContents({
    owner: githubUsername, repo: REPO, path, branch, content,
    message: isEdit
      ? `chore: update ${tree.treeId} skill tree — submitted via builder`
      : `feat: add ${tree.treeId} skill tree — submitted via builder`,
    ...(fileSha ? { sha: fileSha } : {}),
  })

  // 6. Create PR from fork → upstream (using bot token to open PR on OWNER/REPO)
  const { data: pr } = await botOctokit.rest.pulls.create({
    owner: OWNER, repo: REPO,
    head: `${githubUsername}:${branch}`, base: BASE_BRANCH,
    title: isEdit
      ? `[Update] ${tree.title} skill tree`
      : `[New Tree] ${tree.title}`,
    body: buildPrBody(tree, `@${githubUsername} via SkilleTree Builder`, isEdit),
  })

  return { prUrl: pr.html_url }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function checkForkExists(octokit: Octokit, username: string): Promise<boolean> {
  try {
    await octokit.rest.repos.get({ owner: username, repo: REPO })
    return true
  } catch {
    return false
  }
}

async function waitForFork(
  octokit: Octokit,
  username: string,
  maxMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    if (await checkForkExists(octokit, username)) return
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Fork creation timed out — please try again in a moment')
}

function buildPrBody(tree: SkillTree, author: string, isEdit: boolean): string {
  return `## ${isEdit ? '✏️ Update' : '🌳 New Skill Tree'}: ${tree.title}

**Submitted by:** ${author}
**Category:** ${tree.category}
**Difficulty:** ${tree.difficulty}
**Nodes:** ${tree.totalNodes}
**Estimated time:** ${tree.estimatedMonths} month${tree.estimatedMonths !== 1 ? 's' : ''}

> ${tree.description}

---

### Checklist for reviewers
- [ ] Schema is valid (treeId, nodes, edges, resources)
- [ ] All resources are free and accessible
- [ ] Node order and prerequisites make sense
- [ ] No duplicate treeId with existing trees
- [ ] \`totalNodes\` equals \`nodes.length\`

---
*Submitted via the [SkilleTree Builder](https://skilltree.dev/builder)*`
}
