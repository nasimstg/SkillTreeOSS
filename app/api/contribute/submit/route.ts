import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createTreePR, createTreePRFromFork } from '@/lib/github-api'
import { validateTree } from '@/lib/builder-utils'
import type { SkillTree } from '@/types/tree'
import type { Node, Edge } from '@xyflow/react'
import type { BuilderNodeData } from '@/lib/builder-utils'

interface SubmitBody {
  tree:      SkillTree
  anonymous: boolean
}

export async function POST(request: NextRequest) {
  const body = await request.json() as SubmitBody
  const { tree, anonymous } = body

  if (!tree || typeof tree !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Server-side validation — derive nodes/edges from the tree for the validator
  const rfNodes: Node<BuilderNodeData>[] = tree.nodes.map((n, i) => ({
    id:       n.id,
    type:     'builderNode',
    position: n.position ?? { x: i * 200, y: 0 },
    data: {
      label:       n.label,
      description: n.description,
      icon:        n.icon,
      zone:        n.zone,
      resources:   n.resources,
    },
  }))

  const rfEdges: Edge[] = tree.edges.map(e => ({
    id: e.id, source: e.source, target: e.target,
  }))

  const meta = {
    treeId:          tree.treeId,
    title:           tree.title,
    category:        tree.category,
    difficulty:      tree.difficulty,
    description:     tree.description,
    estimatedMonths: tree.estimatedMonths,
    icon:            tree.icon,
    version:         tree.version,
  }

  const errors = validateTree(meta, rfNodes, rfEdges)
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', errors }, { status: 422 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prUrl: string

  try {
    // Determine if this is an update (treeId already exists)
    const isEdit = await checkTreeExists(tree.treeId)

    if (!anonymous && user) {
      // Check for GitHub connection
      const { data: conn } = await supabase
        .from('github_connections')
        .select('github_username, github_access_token')
        .eq('user_id', user.id)
        .maybeSingle()

      if (conn?.github_access_token) {
        const result = await createTreePRFromFork(
          tree,
          conn.github_access_token,
          conn.github_username,
          isEdit,
        )
        prUrl = result.prUrl
      } else {
        // Fallback to bot even if they asked for GitHub (token might be stale)
        const result = await createTreePR(tree, isEdit)
        prUrl = result.prUrl
      }
    } else {
      const result = await createTreePR(tree, isEdit)
      prUrl = result.prUrl
    }
  } catch (err) {
    console.error('GitHub PR creation failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create pull request' },
      { status: 502 },
    )
  }

  // Persist draft as submitted (for signed-in users)
  if (user) {
    // Non-critical — ignore errors (e.g. RLS, network)
    try {
      await supabase.from('tree_drafts').insert({
        user_id:   user.id,
        tree_data: tree,
        status:    'submitted',
        pr_url:    prUrl,
      })
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ prUrl })
}

async function checkTreeExists(treeId: string): Promise<boolean> {
  try {
    const { Octokit } = await import('@octokit/rest')
    const octokit = new Octokit({ auth: process.env.GITHUB_BOT_TOKEN })
    await octokit.rest.repos.getContent({
      owner: 'nasimstg',
      repo:  'SkillTreeOSS',
      path:  `data/trees/${treeId}.json`,
    })
    return true
  } catch {
    return false
  }
}
