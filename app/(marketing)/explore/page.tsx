import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { SkillTree } from '@/types/tree'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { TreeStats } from '@/app/api/trees/stats/route'
import ExploreClient, { type UserTreeProgress } from '@/components/explore/ExploreClient'

export const metadata: Metadata = {
  title: 'Explore Skill Trees — SkilleTreeOSS',
  description:
    'Browse all available skill trees. Find your next learning path across technology, art, science, and more.',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadAllTrees(): SkillTree[] {
  const treesDir = join(process.cwd(), 'data', 'trees')
  try {
    const files = readdirSync(treesDir).filter(f => f.endsWith('.json'))
    return files.map(
      f => JSON.parse(readFileSync(join(treesDir, f), 'utf-8')) as SkillTree,
    )
  } catch {
    return []
  }
}

async function fetchStats(): Promise<Record<string, TreeStats>> {
  try {
    const supabase = await createServerSupabaseClient()

    const [progressResult, ratingsResult] = await Promise.all([
      supabase.from('user_progress').select('tree_id, completed_node_ids'),
      supabase.from('tree_ratings').select('tree_id, rating'),
    ])

    // Enrollment: users with ≥1 completed node per tree
    const enrollmentMap: Record<string, number> = {}
    for (const row of progressResult.data ?? []) {
      if ((row.completed_node_ids?.length ?? 0) > 0) {
        enrollmentMap[row.tree_id] = (enrollmentMap[row.tree_id] ?? 0) + 1
      }
    }

    // Ratings: avg + count per tree
    const ratingSums: Record<string, { sum: number; count: number }> = {}
    for (const row of ratingsResult.data ?? []) {
      if (!ratingSums[row.tree_id]) ratingSums[row.tree_id] = { sum: 0, count: 0 }
      ratingSums[row.tree_id].sum   += row.rating
      ratingSums[row.tree_id].count += 1
    }

    const allIds = new Set([
      ...Object.keys(enrollmentMap),
      ...Object.keys(ratingSums),
    ])

    const stats: Record<string, TreeStats> = {}
    for (const id of allIds) {
      const r = ratingSums[id]
      stats[id] = {
        enrolled:    enrollmentMap[id] ?? 0,
        avgRating:   r ? Math.round((r.sum / r.count) * 10) / 10 : null,
        ratingCount: r?.count ?? 0,
      }
    }
    return stats
  } catch {
    return {}
  }
}

async function fetchUserProgress(
  trees: SkillTree[],
): Promise<Record<string, UserTreeProgress>> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data } = await supabase
      .from('user_progress')
      .select('tree_id, completed_node_ids')
      .eq('user_id', user.id)

    if (!data) return {}

    // Build a totalNodes lookup from loaded trees
    const totalNodesMap: Record<string, number> = {}
    for (const t of trees) totalNodesMap[t.treeId] = t.totalNodes

    const result: Record<string, UserTreeProgress> = {}
    for (const row of data) {
      const count = row.completed_node_ids?.length ?? 0
      if (count > 0) {
        result[row.tree_id] = {
          completedCount: count,
          totalNodes:     totalNodesMap[row.tree_id] ?? count,
        }
      }
    }
    return result
  } catch {
    return {}
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExplorePage() {
  const trees = loadAllTrees()

  // Fetch DB data in parallel (stats are public; user progress requires auth)
  const [stats, userProgress] = await Promise.all([
    fetchStats(),
    fetchUserProgress(trees),
  ])

  // Derive unique categories from the actual tree files, sorted
  const categories = [...new Set(trees.map(t => t.category))].sort()

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <main className="flex-1 flex flex-col">

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="relative border-b border-white/5 py-16 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-[0.04] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-5">
              <span className="material-symbols-outlined text-sm">explore</span>
              Browse All Trees
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Choose your{' '}
              <span className="text-primary">quest</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Every skill tree is built from the best free resources on the
              internet. Open source, community-curated, always growing.
            </p>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{trees.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Trees</div>
              </div>
              <div className="h-8 w-px bg-white/8" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">{categories.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Categories</div>
              </div>
              <div className="h-8 w-px bg-white/8" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {trees.reduce((s, t) => s + t.totalNodes, 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Total Nodes</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Client-side filter / grid ─────────────────────────────── */}
        {trees.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-700">forest</span>
            <p className="text-slate-400">No skill trees found.</p>
          </div>
        ) : (
          <ExploreClient
            trees={trees}
            stats={stats}
            categories={categories}
            userProgress={userProgress}
          />
        )}

      </main>
    </div>
  )
}
