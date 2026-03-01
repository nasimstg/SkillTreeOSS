import Link from 'next/link'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FEATURED_TREE_IDS } from '@/lib/featured-trees'
import type { SkillTree } from '@/types/tree'

// Revalidate at most once per hour (ISR)
export const revalidate = 3600

// ─── Types ───────────────────────────────────────────────────────────────────

interface LiveStats {
  activeLearners: number
  skillTrees:     number
  nodesUnlocked:  number
}

interface TreeCardStats {
  enrolled:   number
  avgRating:  number | null
  ratingCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`
  if (n >= 10_000)    return `${Math.floor(n / 1_000)}k+`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k+`
  return n > 0 ? n.toLocaleString() : '0'
}

function countTreeFiles(): number {
  try {
    return readdirSync(join(process.cwd(), 'data', 'trees'))
      .filter(f => f.endsWith('.json'))
      .length
  } catch { return 0 }
}

function loadTreeById(id: string): SkillTree | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), 'data', 'trees', `${id}.json`), 'utf-8')
    ) as SkillTree
  } catch { return null }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchLiveStats(): Promise<LiveStats> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('site_stats')
      .select('active_learners, nodes_unlocked')
      .single()
    return {
      activeLearners: data?.active_learners ?? 0,
      skillTrees:     countTreeFiles(),
      nodesUnlocked:  data?.nodes_unlocked  ?? 0,
    }
  } catch {
    return { activeLearners: 0, skillTrees: countTreeFiles(), nodesUnlocked: 0 }
  }
}

async function fetchFeaturedTreeStats(
  ids: string[],
): Promise<Record<string, TreeCardStats>> {
  try {
    const supabase = await createServerSupabaseClient()

    const [progressRes, ratingsRes] = await Promise.all([
      supabase
        .from('user_progress')
        .select('tree_id, user_id, completed_node_ids')
        .in('tree_id', ids),
      supabase
        .from('tree_ratings')
        .select('tree_id, rating')
        .in('tree_id', ids),
    ])

    // Enrollment per tree (distinct users with ≥1 node)
    const enrolled: Record<string, Set<string>> = {}
    for (const row of progressRes.data ?? []) {
      if ((row.completed_node_ids?.length ?? 0) > 0) {
        if (!enrolled[row.tree_id]) enrolled[row.tree_id] = new Set()
        enrolled[row.tree_id].add(row.user_id)
      }
    }

    // Avg rating per tree
    const ratingAgg: Record<string, { sum: number; count: number }> = {}
    for (const row of ratingsRes.data ?? []) {
      if (!ratingAgg[row.tree_id]) ratingAgg[row.tree_id] = { sum: 0, count: 0 }
      ratingAgg[row.tree_id].sum   += row.rating
      ratingAgg[row.tree_id].count += 1
    }

    const result: Record<string, TreeCardStats> = {}
    for (const id of ids) {
      const r = ratingAgg[id]
      result[id] = {
        enrolled:    enrolled[id]?.size ?? 0,
        avgRating:   r ? Math.round((r.sum / r.count) * 10) / 10 : null,
        ratingCount: r?.count ?? 0,
      }
    }
    return result
  } catch {
    return {}
  }
}

// ─── Card UI constants ────────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, string> = {
  easy:   'Beginner',
  medium: 'Intermediate',
  hard:   'Advanced',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   'text-primary border-primary/30',
  medium: 'text-yellow-400 border-yellow-400/30',
  hard:   'text-red-400 border-red-400/30',
}

const CATEGORY_ICON: Record<string, string> = {
  Technology: 'terminal',
  Art:        'palette',
  Science:    'science',
  Music:      'music_note',
  Language:   'translate',
  Business:   'business_center',
  Design:     'brush',
  Health:     'favorite',
  Finance:    'payments',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  // Load featured trees from FS + fetch all stats in parallel
  const featuredTrees = FEATURED_TREE_IDS
    .map(id => loadTreeById(id))
    .filter((t): t is SkillTree => t !== null)

  const [live, featuredStats] = await Promise.all([
    fetchLiveStats(),
    fetchFeaturedTreeStats(FEATURED_TREE_IDS),
  ])

  const STATS = [
    { value: fmt(live.activeLearners), label: 'Active Learners', icon: 'group',        color: 'text-primary'    },
    { value: fmt(live.skillTrees),     label: 'Skill Trees',     icon: 'account_tree', color: 'text-accent-blue' },
    { value: fmt(live.nodesUnlocked),  label: 'Nodes Unlocked',  icon: 'lock_open',    color: 'text-purple-400' },
    { value: '100%',                   label: 'Open Source',     icon: 'code',          color: 'text-orange-400' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-bg-landing">
      <main className="flex-grow">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 lg:py-36 px-6">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-bg-landing to-bg-landing" />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #11d452 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              v0.8 · Visual Builder is live
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-gradient-primary">
              The Democratization <br />of Mastery.
            </h1>
            <p className="max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
              Level up your life with open-source, community-driven skill trees. Learn anything,
              track your progress, and master your craft like an RPG character.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/explore"
                className="group relative flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-background-dark shadow-[0_0_20px_-5px_rgba(17,212,82,0.4)] transition-all hover:shadow-[0_0_30px_-5px_rgba(17,212,82,0.6)] hover:-translate-y-0.5"
              >
                Start Learning (Free)
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
              <Link
                href="/builder"
                className="group flex h-12 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-transparent px-8 text-base font-bold text-white transition-all hover:bg-primary/10 hover:border-primary"
              >
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Build a Tree
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 font-medium">
              {[
                { icon: 'check_circle',  label: 'Open Source'      },
                { icon: 'group',         label: 'Community Driven'  },
                { icon: 'trophy',        label: 'Gamified Learning' },
                { icon: 'account_tree',  label: 'Visual Builder'    },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Trees ────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-background-dark">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Featured Skill Trees
                </h2>
                <p className="text-slate-400 mt-1">Start your journey with these popular paths</p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:flex items-center gap-1 text-primary font-medium transition-colors text-sm hover:underline"
              >
                View all {live.skillTrees} trees
                <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
              </Link>
            </div>

            {featuredTrees.length === 0 ? (
              <div className="text-center py-16 text-slate-600">No featured trees configured.</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredTrees.map(tree => (
                  <FeaturedCard
                    key={tree.treeId}
                    tree={tree}
                    stats={featuredStats[tree.treeId]}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link href="/explore" className="inline-flex items-center gap-1 text-primary font-medium transition-colors">
                View all trees
                <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-y border-dashed border-white/10 bg-bg-landing">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2">
                  <span className={`material-symbols-outlined text-2xl ${stat.color} opacity-60`}>
                    {stat.icon}
                  </span>
                  <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-background-dark">
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white">How It Works</h2>
              <p className="text-slate-400 mt-2">Three steps to mastery</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', icon: 'travel_explore',    title: 'Pick Your Quest',    desc: 'Browse community-built skill trees across any discipline — from coding to botany to urban sketching.'         },
                { step: '02', icon: 'play_lesson',       title: 'Learn & Unlock',     desc: 'Each node links to the single best free resource. Complete it, hit Unlock, and watch the next path light up.' },
                { step: '03', icon: 'workspace_premium', title: 'Share Your Mastery', desc: 'Generate a stunning visual skill resume to share on LinkedIn, GitHub, or wherever the world can see you.'      },
                { step: '04', icon: 'account_tree',      title: 'Build & Contribute', desc: 'Use the visual builder to create your own skill tree and submit it as a PR — no JSON or Git knowledge needed.' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative p-8 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-colors"
                >
                  <div className="absolute top-6 right-6 text-4xl font-black text-white/5">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

// ─── FeaturedCard ─────────────────────────────────────────────────────────────

function FeaturedCard({
  tree,
  stats,
}: {
  tree:   SkillTree
  stats?: TreeCardStats
}) {
  const diffLabel = DIFFICULTY_LABEL[tree.difficulty] ?? tree.difficulty
  const diffColor = DIFFICULTY_COLOR[tree.difficulty] ?? 'text-slate-400 border-slate-400/30'
  const catIcon   = CATEGORY_ICON[tree.category] ?? 'auto_awesome'

  return (
    <Link
      href={`/tree/${tree.treeId}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card-dark border border-white/5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(17,212,82,0.08)]"
    >
      {/* Header panel */}
      <div className="relative h-32 bg-gradient-to-br from-card-dark to-background-dark flex items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div
          className="relative z-10 p-3 rounded-xl bg-primary/15 border border-primary/25 group-hover:scale-110 transition-transform duration-300"
          style={{ boxShadow: '0 0 20px rgba(17,212,82,0.12)' }}
        >
          <span className="material-symbols-outlined text-primary text-4xl">{tree.icon}</span>
        </div>
        {/* Difficulty badge */}
        <div className={`absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-background-dark/80 backdrop-blur ${diffColor}`}>
          {diffLabel}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        {/* Category */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="material-symbols-outlined text-sm">{catIcon}</span>
          {tree.category}
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug mb-1.5">
            {tree.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {tree.description}
          </p>
        </div>

        {/* Social proof */}
        {((stats?.enrolled ?? 0) > 0 || stats?.avgRating != null) && (
          <div className="flex items-center gap-3 text-xs">
            {(stats?.enrolled ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="material-symbols-outlined text-sm text-slate-600">people</span>
                {stats!.enrolled.toLocaleString()} enrolled
              </span>
            )}
            {stats?.avgRating != null && (
              <span className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-sm text-amber-400 leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="text-amber-400 font-semibold">{stats.avgRating.toFixed(1)}</span>
                {stats.ratingCount > 0 && (
                  <span className="text-slate-700">({stats.ratingCount})</span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Bottom stats + CTA */}
        <div className="mt-auto space-y-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-slate-600">hub</span>
              {tree.totalNodes} nodes
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-slate-600">schedule</span>
              ~{tree.estimatedMonths}mo
            </div>
          </div>
          <div className="block w-full text-center rounded-lg bg-primary/10 border border-primary/20 py-2 text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-background-dark">
            Start Quest
          </div>
        </div>
      </div>
    </Link>
  )
}
