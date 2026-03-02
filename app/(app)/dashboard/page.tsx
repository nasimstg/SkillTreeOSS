import { redirect } from 'next/navigation'
import Link from 'next/link'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { SkillTree, TreeNode } from '@/types/tree'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your learning progress, XP, active skill tree quests, and recent unlocks.',
  robots: { index: false, follow: false },
}

// XP awarded per completed node
const XP_PER_NODE = 50

function getLevel(xp: number): { level: number; title: string; xpToNext: number } {
  const thresholds = [
    { level: 1, title: 'Apprentice', xp: 0 },
    { level: 2, title: 'Explorer',   xp: 200 },
    { level: 3, title: 'Journeyman', xp: 500 },
    { level: 4, title: 'Adept',      xp: 1000 },
    { level: 5, title: 'Specialist', xp: 2000 },
    { level: 6, title: 'Expert',     xp: 3500 },
    { level: 7, title: 'Master',     xp: 5500 },
    { level: 8, title: 'Grandmaster', xp: 8000 },
  ]
  let current = thresholds[0]
  let next = thresholds[1]
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i].xp) {
      current = thresholds[i]
      next    = thresholds[i + 1]
    }
  }
  return {
    level:   current.level,
    title:   current.title,
    xpToNext: next ? next.xp - xp : 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Load all trees ─────────────────────────────────────────────────────────
  const treesDir  = join(process.cwd(), 'data', 'trees')
  const treeFiles = readdirSync(treesDir).filter(f => f.endsWith('.json'))
  const allTrees  = treeFiles.map(
    f => JSON.parse(readFileSync(join(treesDir, f), 'utf-8')) as SkillTree
  )

  // ── Fetch all user progress in one query ───────────────────────────────────
  let progressMap: Record<string, string[]> = {}
  try {
    const { data } = await supabase
      .from('user_progress')
      .select('tree_id, completed_node_ids')
      .eq('user_id', user.id)
    if (data) {
      for (const row of data) {
        if (row.completed_node_ids?.length > 0) {
          progressMap[row.tree_id] = row.completed_node_ids
        }
      }
    }
  } catch { /* no progress yet */ }

  // ── Derived stats ──────────────────────────────────────────────────────────
  // Active = trees the user has touched (≥1 completed node), sorted by % complete desc
  const activeTrees = allTrees
    .filter(t => (progressMap[t.treeId]?.length ?? 0) > 0)
    .sort((a, b) => {
      const pctA = (progressMap[a.treeId]?.length ?? 0) / a.totalNodes
      const pctB = (progressMap[b.treeId]?.length ?? 0) / b.totalNodes
      return pctB - pctA
    })

  const totalCompleted = Object.values(progressMap).reduce((s, arr) => s + arr.length, 0)
  const totalXP        = totalCompleted * XP_PER_NODE
  const { level, title: levelTitle, xpToNext } = getLevel(totalXP)

  // Most-progressed tree for the mastery card
  const featuredTree = activeTrees[0] ?? allTrees.find(t => t.treeId === 'full-stack-dev') ?? allTrees[0]
  const featuredCompleted = progressMap[featuredTree?.treeId ?? ''] ?? []
  const featuredProgress  = featuredTree
    ? Math.round((featuredCompleted.length / featuredTree.totalNodes) * 100)
    : 0

  // Recent unlocks: last completed node from each active tree, up to 3
  const recentUnlocks: { tree: SkillTree; node: TreeNode }[] = []
  for (const tree of activeTrees) {
    const ids   = progressMap[tree.treeId] ?? []
    const lastId = ids[ids.length - 1]
    const node  = tree.nodes.find(n => n.id === lastId)
    if (node) recentUnlocks.push({ tree, node })
    if (recentUnlocks.length >= 3) break
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name      ||
    user.email?.split('@')[0]     ||
    'Learner'

  const avatarUrl = user.user_metadata?.avatar_url ?? null

  // Trees shown in Active Quests (up to 3; rest shown via "View all")
  const QUEST_LIMIT    = 3
  const shownTrees     = activeTrees.slice(0, QUEST_LIMIT)
  const hiddenCount    = Math.max(0, activeTrees.length - QUEST_LIMIT)

  return (
    <div className="min-h-screen bg-background-dark">
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 sm:py-10 lg:px-8">

        {/* ── Welcome header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pb-8 border-b border-white/5 mb-8">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-primary object-cover"
                style={{ boxShadow: '0 0 20px rgba(17, 212, 82, 0.3)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(17, 212, 82, 0.3)' }}
              >
                <span className="material-symbols-outlined text-primary text-4xl">person</span>
              </div>
            )}
            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-primary rounded-full border-[3px] border-background-dark" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
              Welcome back,{' '}
              <span className="text-primary">{displayName}</span>!
            </h1>
            <p className="text-slate-400 text-base">
              Level {level} ·{' '}
              <span className="text-primary font-semibold">{totalXP} XP</span>{' '}
              ·{' '}
              <span className="text-white font-semibold">{levelTitle}</span>
              {xpToNext > 0 && (
                <span className="text-slate-500"> · {xpToNext} XP to next level</span>
              )}
            </p>
          </div>
        </div>

        {/* ── 12-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ─── LEFT: Main content (8 / 12) ─── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Active Quests */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">swords</span>
                  Active Quests
                </h2>
                <Link href="/explore" className="text-sm text-primary hover:text-white transition-colors">
                  Explore more →
                </Link>
              </div>

              {activeTrees.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500 text-3xl">explore</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-300">No active quests yet</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Browse the skill tree library and mark your first node to begin
                      </p>
                    </div>
                    <Link
                      href="/explore"
                      className="h-10 px-5 rounded-full bg-primary text-black text-sm font-bold flex items-center gap-2 transition-opacity hover:opacity-80"
                    >
                      <span className="material-symbols-outlined text-[16px]">explore</span>
                      Browse Trees
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── Active tree cards ── */
                <div className="flex flex-col gap-4">
                  {shownTrees.map((tree) => {
                    const completed = progressMap[tree.treeId] ?? []
                    const pct       = Math.round((completed.length / tree.totalNodes) * 100)
                    return (
                      <Link
                        key={tree.treeId}
                        href={`/tree/${tree.treeId}`}
                        className="group flex flex-col sm:flex-row items-stretch bg-surface-dark rounded-2xl overflow-hidden border border-white/5 hover:border-primary/40 transition-all hover:shadow-[0_0_30px_rgba(17,212,82,0.08)]"
                      >
                        {/* Icon panel */}
                        <div className="w-full sm:w-36 shrink-0 relative bg-gradient-to-br from-card-dark to-background-dark h-32 sm:h-auto flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5">
                          <div className="absolute inset-0 bg-grid-dark opacity-40" />
                          <div className="relative z-10 w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-primary text-3xl">{tree.icon}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                                {tree.title}
                              </h3>
                              <span className="bg-white/5 text-[10px] font-bold px-2 py-0.5 rounded text-slate-500 uppercase shrink-0 ml-2">
                                {tree.category}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>{completed.length}/{tree.totalNodes} nodes</span>
                              <span className="text-primary font-bold">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-background-dark overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  boxShadow: pct > 0 ? '0 0 6px rgba(17,212,82,0.5)' : 'none',
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              <span className="material-symbols-outlined text-base">play_arrow</span>
                              Resume
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}

                  {/* Hidden trees overflow */}
                  {hiddenCount > 0 && (
                    <Link
                      href="/explore"
                      className="text-center text-sm text-slate-500 hover:text-primary transition-colors py-2"
                    >
                      +{hiddenCount} more active {hiddenCount === 1 ? 'quest' : 'quests'} — view all →
                    </Link>
                  )}

                  {/* Start new quest dashed card */}
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500 text-xl">add</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-300">Start a new quest</p>
                      <p className="text-xs text-slate-500 mt-0.5">Browse the skill tree library</p>
                    </div>
                    <Link href="/explore" className="text-xs font-bold text-primary hover:underline">
                      Explore Trees →
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* ── Build Your Own Tree CTA ── */}
            <section>
              <div
                className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background-dark to-surface-dark p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5"
                style={{ boxShadow: 'inset 0 0 60px rgba(17,212,82,0.04)' }}
              >
                {/* Glow blob */}
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(17,212,82,0.12) 0%, transparent 70%)' }}
                />

                <div className="relative z-10 w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl">build</span>
                </div>

                <div className="relative z-10 flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white mb-1">Build Your Own Skill Tree</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    Have expertise to share? Use the visual builder to create a skill tree and
                    contribute it to the community via GitHub.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                    <Link
                      href="/builder"
                      className="h-10 px-5 rounded-full bg-primary text-black text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                      style={{ boxShadow: '0 0 16px rgba(17,212,82,0.25)' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Start Building
                    </Link>
                    <Link
                      href="/contribute"
                      className="h-10 px-5 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      How It Works
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Recent Unlocks ── */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Unlocks
              </h2>

              <div className="bg-surface-dark rounded-2xl border border-white/5 p-6">
                {recentUnlocks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500 text-3xl">lock</span>
                    </div>
                    <p className="text-sm text-slate-400">No nodes completed yet.</p>
                    <Link
                      href="/explore"
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Start learning
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-white/5 space-y-7">
                    {recentUnlocks.map(({ tree, node }, i) => (
                      <div key={`${tree.treeId}-${node.id}`} className="relative group">
                        <div
                          className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 ring-4 ring-surface-dark transition-all ${
                            i === 0
                              ? 'bg-primary border-primary group-hover:ring-primary/20'
                              : 'bg-surface-dark border-accent-blue'
                          }`}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${i === 0 ? 'text-primary' : 'text-slate-500'}`}>
                              {tree.title}
                            </p>
                            <h4 className="text-white font-bold">Unlocked: {node.label}</h4>
                            <p className="text-slate-500 text-sm">{node.zone} · {node.resources[0]?.estimatedHours ?? 0}h resource</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-dark rounded-lg border border-white/5 shrink-0">
                            <span className="material-symbols-outlined text-yellow-400 text-sm">stars</span>
                            <span className="text-white font-bold text-sm">+{XP_PER_NODE} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {totalCompleted > 3 && (
                      <p className="text-xs text-slate-600 pl-1">
                        +{totalCompleted - recentUnlocks.length} more nodes completed across all trees
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ─── RIGHT: Sidebar (4 / 12) ─── */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Skill Mastery Card */}
            <div className="bg-gradient-to-b from-surface-dark to-background-dark rounded-2xl border border-white/5 p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-base">Skill Mastery</h3>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Lv. {level}
                </span>
              </div>

              {/* Visual — links to most progressed tree */}
              <Link
                href={featuredTree ? `/tree/${featuredTree.treeId}` : '/explore'}
                className="group relative w-full aspect-square bg-background-dark rounded-xl border border-white/5 mb-5 overflow-hidden flex items-center justify-center hover:border-primary/30 transition-colors block"
              >
                <div className="absolute inset-0 bg-neural-grid opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ boxShadow: '0 0 30px rgba(17,212,82,0.4)' }}
                  >
                    <span className="material-symbols-outlined text-primary text-3xl">
                      {totalCompleted >= 50
                        ? 'emoji_events'
                        : totalCompleted >= 10
                          ? 'workspace_premium'
                          : 'account_tree'}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm">{levelTitle}</p>
                  <p className="text-slate-500 text-xs">{totalXP} XP total</p>
                </div>

                {featuredProgress > 0 && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${featuredProgress}%`,
                          boxShadow: '0 0 6px rgba(17,212,82,0.5)',
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {featuredTree?.title} · {featuredProgress}%
                    </p>
                  </div>
                )}
              </Link>

              <div className="space-y-2.5">
                <p className="text-slate-500 text-sm text-center">
                  {totalCompleted === 0
                    ? 'Complete your first node to start earning XP!'
                    : <>
                        You&apos;ve unlocked{' '}
                        <span className="text-white font-bold">{totalCompleted}</span>{' '}
                        {totalCompleted === 1 ? 'skill' : 'skills'} across{' '}
                        <span className="text-white font-bold">{activeTrees.length}</span>{' '}
                        {activeTrees.length === 1 ? 'tree' : 'trees'}.
                      </>
                  }
                </p>
                {xpToNext > 0 && (
                  <p className="text-xs text-slate-600 text-center">{xpToNext} XP to Level {level + 1}</p>
                )}
                <Link
                  href={featuredTree ? `/tree/${featuredTree.treeId}` : '/explore'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/80 text-background-dark h-11 font-bold text-sm transition-colors"
                  style={{ boxShadow: '0 0 20px rgba(17,212,82,0.2)' }}
                >
                  <span className="material-symbols-outlined text-lg">
                    {activeTrees.length > 0 ? 'play_arrow' : 'explore'}
                  </span>
                  {activeTrees.length > 0 ? 'Continue Learning' : 'Start a Quest'}
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'check_circle', label: 'Completed',    value: totalCompleted,        color: 'text-primary'      },
                { icon: 'account_tree', label: 'Active Trees', value: activeTrees.length,    color: 'text-accent-blue'  },
                { icon: 'stars',        label: 'Total XP',     value: totalXP,               color: 'text-yellow-400'   },
                { icon: 'library_books', label: 'Trees Available', value: allTrees.length,   color: 'text-slate-400'    },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-dark rounded-xl border border-white/5 p-4 flex flex-col gap-1"
                >
                  <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
