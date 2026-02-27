import { redirect } from 'next/navigation'
import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { SkillTree, TreeNode } from '@/types/tree'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — SkilleTreeOSS',
}

// XP awarded per completed node
const XP_PER_NODE = 50

function getLevel(xp: number): { level: number; title: string; xpToNext: number } {
  const thresholds = [
    { level: 1, title: 'Apprentice', xp: 0 },
    { level: 2, title: 'Explorer', xp: 200 },
    { level: 3, title: 'Journeyman', xp: 500 },
    { level: 4, title: 'Adept', xp: 1000 },
    { level: 5, title: 'Specialist', xp: 2000 },
    { level: 6, title: 'Expert', xp: 3500 },
    { level: 7, title: 'Master', xp: 5500 },
    { level: 8, title: 'Grandmaster', xp: 8000 },
  ]
  let current = thresholds[0]
  let next = thresholds[1]
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i].xp) {
      current = thresholds[i]
      next = thresholds[i + 1]
    }
  }
  return {
    level: current.level,
    title: current.title,
    xpToNext: next ? next.xp - xp : 0,
  }
}

const STREAK_DAYS = 7

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load all trees (just full-stack-dev for now)
  const tree = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'trees', 'full-stack-dev.json'), 'utf-8')
  ) as SkillTree

  // Fetch user progress
  let completedNodeIds: string[] = []
  try {
    const { data } = await supabase
      .from('user_progress')
      .select('completed_node_ids')
      .eq('user_id', user.id)
      .eq('tree_id', tree.treeId)
      .single()
    if (data?.completed_node_ids) completedNodeIds = data.completed_node_ids
  } catch {
    // No progress yet
  }

  const totalXP = completedNodeIds.length * XP_PER_NODE
  const { level, title: levelTitle, xpToNext } = getLevel(totalXP)
  const progress = Math.round((completedNodeIds.length / tree.totalNodes) * 100)

  // Compute recent unlocks: last 3 completed nodes in tree order
  const completedNodes: TreeNode[] = tree.nodes
    .filter((n) => completedNodeIds.includes(n.id))
    .slice(-3)
    .reverse()

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Learner'

  const avatarUrl =
    user.user_metadata?.avatar_url || null

  // Build streak bar: last 7 days with fake streak (real streak needs DB)
  const FAKE_STREAK = Math.min(completedNodeIds.length + 1, 5)

  return (
    <div className="min-h-screen bg-background-dark">

      <main className="mx-auto max-w-[1280px] px-6 py-10 lg:px-8">
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-white/5 mb-8">
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

          <div>
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

        {/* 12-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ─── LEFT: Main content (8/12) ─── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Active Quests */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">swords</span>
                  Active Quests
                </h2>
                <Link
                  href="/explore"
                  className="text-sm text-primary hover:text-white transition-colors"
                >
                  Explore more →
                </Link>
              </div>

              {/* Quest card */}
              <Link
                href={`/tree/${tree.treeId}`}
                className="group flex flex-col md:flex-row items-stretch bg-surface-dark rounded-2xl overflow-hidden border border-white/5 hover:border-primary/40 transition-all hover:shadow-[0_0_30px_rgba(17,212,82,0.1)] block"
              >
                {/* Gradient side panel */}
                <div className="w-full md:w-48 shrink-0 relative bg-gradient-to-br from-card-dark to-background-dark h-40 md:h-auto flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                  <div className="absolute inset-0 bg-grid-dark opacity-40" />
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-primary text-4xl">{tree.icon}</span>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {tree.title}
                      </h3>
                      <span className="bg-white/5 text-xs font-bold px-2 py-1 rounded text-slate-500 uppercase">
                        {tree.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{tree.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Progress</span>
                      <span className="text-primary font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background-dark overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          boxShadow: progress > 0 ? '0 0 8px rgba(17,212,82,0.6)' : 'none',
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {completedNodeIds.length}/{tree.totalNodes} nodes unlocked
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-background-dark px-5 py-2 rounded-lg text-sm font-bold transition-colors">
                      <span className="material-symbols-outlined text-lg">play_arrow</span>
                      Resume Path
                    </span>
                  </div>
                </div>
              </Link>

              {/* Empty state when no other trees */}
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-2xl">add</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300">Start a new quest</p>
                  <p className="text-xs text-slate-500 mt-1">Browse the skill tree library and begin your next journey</p>
                </div>
                <Link
                  href="/explore"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Explore Trees →
                </Link>
              </div>
            </section>

            {/* Recent Unlocks */}
            <section>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Unlocks
              </h2>

              <div className="bg-surface-dark rounded-2xl border border-white/5 p-6">
                {completedNodes.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500 text-3xl">lock</span>
                    </div>
                    <p className="text-sm text-slate-400">No nodes completed yet.</p>
                    <Link
                      href={`/tree/${tree.treeId}`}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Start learning
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-white/5 space-y-7">
                    {completedNodes.map((node, i) => (
                      <div key={node.id} className="relative group">
                        <div
                          className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 ring-4 ring-surface-dark transition-all ${i === 0
                              ? 'bg-primary border-primary group-hover:ring-primary/20'
                              : 'bg-surface-dark border-accent-blue'
                            }`}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${i === 0 ? 'text-primary' : 'text-slate-500'}`}>
                              {i === 0 ? 'Most Recent' : i === 1 ? 'Before that' : 'Earlier'}
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

                    {completedNodeIds.length > 3 && (
                      <p className="text-xs text-slate-600 pl-1">
                        +{completedNodeIds.length - 3} more nodes completed
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ─── RIGHT: Sidebar (4/12) ─── */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Skill Mastery Card */}
            <div className="bg-gradient-to-b from-surface-dark to-background-dark rounded-2xl border border-white/5 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-base">Skill Mastery</h3>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Lv. {level}
                </span>
              </div>

              {/* Visual */}
              <Link
                href={`/tree/${tree.treeId}`}
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
                      {completedNodeIds.length >= tree.totalNodes
                        ? 'emoji_events'
                        : completedNodeIds.length > 5
                          ? 'workspace_premium'
                          : 'account_tree'}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm">{levelTitle}</p>
                  <p className="text-slate-500 text-xs">{totalXP} XP total</p>
                </div>

                {/* Arc progress around the icon (pure CSS) */}
                {progress > 0 && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${progress}%`,
                          boxShadow: '0 0 6px rgba(17,212,82,0.5)',
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">{progress}% complete</p>
                  </div>
                )}
              </Link>

              <div className="space-y-2.5">
                <p className="text-slate-500 text-sm text-center">
                  You&apos;ve unlocked{' '}
                  <span className="text-white font-bold">{completedNodeIds.length}</span> skills.
                  {completedNodeIds.length > 0 && ' Your tree is growing!'}
                </p>
                <Link
                  href={`/tree/${tree.treeId}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/80 text-background-dark h-11 font-bold text-sm transition-colors"
                  style={{ boxShadow: '0 0 20px rgba(17,212,82,0.2)' }}
                >
                  <span className="material-symbols-outlined text-lg">description</span>
                  View Skill Tree
                </Link>
              </div>
            </div>

            {/* Daily Streak */}
            <div className="bg-surface-dark rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <span className="material-symbols-outlined text-orange-400 text-xl">local_fire_department</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm">Daily Streak</h4>
                  <p className="text-slate-500 text-xs">Keep learning every day!</p>
                </div>
                <div className="text-2xl font-black text-white">{FAKE_STREAK}</div>
              </div>

              {/* 7-day bar */}
              <div className="flex gap-1 h-2">
                {Array.from({ length: STREAK_DAYS }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${i < FAKE_STREAK ? 'bg-orange-500' : 'bg-white/5'
                      }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className={`text-[10px] font-bold ${i < FAKE_STREAK ? 'text-orange-400' : 'text-slate-600'}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'check_circle', label: 'Completed', value: completedNodeIds.length, color: 'text-primary' },
                { icon: 'lock_open', label: 'Remaining', value: tree.totalNodes - completedNodeIds.length, color: 'text-accent-blue' },
                { icon: 'stars', label: 'Total XP', value: totalXP, color: 'text-yellow-400' },
                { icon: 'schedule', label: 'Hours', value: `~${completedNodeIds.length * 2}h`, color: 'text-slate-400' },
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
