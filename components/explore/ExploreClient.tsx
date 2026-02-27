'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { SkillTree } from '@/types/tree'
import type { TreeStats } from '@/app/api/trees/stats/route'

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

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
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

type SortKey = 'alpha' | 'enrolled' | 'rating' | 'easiest' | 'shortest'

const SORT_OPTIONS: { value: SortKey; label: string; icon: string }[] = [
  { value: 'alpha',    label: 'A → Z',          icon: 'sort_by_alpha'  },
  { value: 'enrolled', label: 'Most Popular',    icon: 'people'         },
  { value: 'rating',   label: 'Top Rated',       icon: 'star'           },
  { value: 'easiest',  label: 'Easiest First',   icon: 'trending_up'    },
  { value: 'shortest', label: 'Shortest First',  icon: 'schedule'       },
]

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserTreeProgress {
  completedCount: number
  totalNodes:     number
}

interface Props {
  trees:        SkillTree[]
  stats:        Record<string, TreeStats>
  categories:   string[]
  userProgress: Record<string, UserTreeProgress>
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExploreClient({ trees, stats, categories, userProgress }: Props) {
  const [search,     setSearch]     = useState('')
  const [category,   setCategory]   = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sort,       setSort]       = useState<SortKey>('alpha')
  const [page,       setPage]       = useState(1)

  // ── "Continue your journey" strip ─────────────────────────────────────────
  const inProgressTrees = useMemo(
    () =>
      trees
        .filter(t => (userProgress[t.treeId]?.completedCount ?? 0) > 0)
        .sort(
          (a, b) =>
            (userProgress[b.treeId]?.completedCount ?? 0) -
            (userProgress[a.treeId]?.completedCount ?? 0),
        ),
    [trees, userProgress],
  )

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = trees.filter(t => {
      if (category !== 'All' && t.category !== category) return false
      if (difficulty !== 'All' && t.difficulty !== difficulty) return false
      if (q) {
        const hay = [
          t.title,
          t.description,
          t.category,
          ...t.nodes.map(n => n.label),
          ...t.nodes.map(n => n.zone),
          ...t.nodes.flatMap(n => n.resources.map(r => r.title)),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'enrolled': {
          const diff =
            (stats[b.treeId]?.enrolled ?? 0) - (stats[a.treeId]?.enrolled ?? 0)
          return diff !== 0 ? diff : a.title.localeCompare(b.title)
        }
        case 'rating': {
          const ra = stats[a.treeId]?.avgRating ?? 0
          const rb = stats[b.treeId]?.avgRating ?? 0
          if (rb !== ra) return rb - ra
          const rc =
            (stats[b.treeId]?.ratingCount ?? 0) -
            (stats[a.treeId]?.ratingCount ?? 0)
          return rc !== 0 ? rc : a.title.localeCompare(b.title)
        }
        case 'easiest': {
          const da = DIFFICULTY_ORDER[a.difficulty] ?? 99
          const db = DIFFICULTY_ORDER[b.difficulty] ?? 99
          return da !== db ? da - db : a.title.localeCompare(b.title)
        }
        case 'shortest':
          return a.estimatedMonths !== b.estimatedMonths
            ? a.estimatedMonths - b.estimatedMonths
            : a.title.localeCompare(b.title)
        default:
          return a.title.localeCompare(b.title)
      }
    })

    return result
  }, [trees, stats, search, category, difficulty, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasActive  = search !== '' || category !== 'All' || difficulty !== 'All'

  function resetPage() { setPage(1) }
  function clearFilters() {
    setSearch('')
    setCategory('All')
    setDifficulty('All')
    setPage(1)
  }

  return (
    <div className="flex-1">

      {/* ── Continue your journey ─────────────────────────────────────── */}
      {inProgressTrees.length > 0 && (
        <div className="border-b border-white/5 py-8 bg-surface-dark/30">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-lg leading-none">
                play_circle
              </span>
              <h2 className="text-sm font-bold text-white">Continue your journey</h2>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                {inProgressTrees.length}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {inProgressTrees.map(t => (
                <ContinueCard
                  key={t.treeId}
                  tree={t}
                  progress={userProgress[t.treeId]}
                  treeStats={stats[t.treeId]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky filter bar ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">

          {/* Row 1: search + results count + sort */}
          <div className="flex items-center gap-3 pt-3 pb-2.5">
            {/* Search input */}
            <div className="flex items-center gap-2 flex-1 max-w-sm bg-white/5 border border-white/10 rounded-xl px-3 h-9 focus-within:border-primary/40 focus-within:bg-primary/5 transition-colors">
              <span className="material-symbols-outlined text-slate-500 text-[18px] leading-none shrink-0">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                placeholder="Search trees, topics, skills…"
                className="bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none w-full"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); resetPage() }}
                  className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">close</span>
                </button>
              )}
            </div>

            {/* Results count */}
            <span className="hidden sm:block text-xs text-slate-600 shrink-0 tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'tree' : 'trees'}
            </span>

            {/* Clear filters */}
            {hasActive && (
              <button
                onClick={clearFilters}
                className="hidden sm:flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[15px] leading-none">filter_alt_off</span>
                Clear
              </button>
            )}

            {/* Sort dropdown */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-slate-600 text-[16px] leading-none hidden md:block">
                swap_vert
              </span>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); resetPage() }}
                className="bg-surface-dark border border-white/10 rounded-lg px-2.5 h-9 text-xs text-white focus:outline-none focus:border-primary/40 cursor-pointer appearance-none pr-6 relative"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1a1a1a]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: category pills + difficulty pills */}
          <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none">
            {/* Category pills */}
            {['All', ...categories].map(cat => {
              const icon = CATEGORY_ICON[cat]
              const active = category === cat
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); resetPage() }}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {icon && (
                    <span className="material-symbols-outlined text-[13px] leading-none">
                      {icon}
                    </span>
                  )}
                  {cat}
                </button>
              )
            })}

            {/* Divider */}
            <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

            {/* Difficulty pills */}
            {[
              { key: 'All',    label: 'All Levels',   activeClass: 'bg-primary/20 border-primary/40 text-primary'             },
              { key: 'easy',   label: 'Beginner',     activeClass: 'bg-primary/15 border-primary/30 text-primary'             },
              { key: 'medium', label: 'Intermediate', activeClass: 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'    },
              { key: 'hard',   label: 'Advanced',     activeClass: 'bg-red-400/15 border-red-400/40 text-red-400'             },
            ].map(d => (
              <button
                key={d.key}
                onClick={() => { setDifficulty(d.key); resetPage() }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  difficulty === d.key
                    ? d.activeClass
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tree grid ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-10">

        {/* Mobile results/clear row */}
        {(filtered.length > 0 || hasActive) && (
          <div className="flex items-center justify-between mb-6 sm:hidden">
            <span className="text-xs text-slate-600">{filtered.length} trees</span>
            {hasActive && (
              <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-700">search_off</span>
            <p className="text-slate-400 font-semibold">No trees match your search</p>
            <p className="text-slate-600 text-sm">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map(tree => (
                <TreeCard
                  key={tree.treeId}
                  tree={tree}
                  treeStats={stats[tree.treeId]}
                  progress={userProgress[tree.treeId]}
                />
              ))}

              {/* Coming soon placeholder — only on last page */}
              {page === totalPages && (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center gap-3 text-center justify-center min-h-[240px]">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 text-2xl">add</span>
                  </div>
                  <p className="text-sm font-bold text-slate-400">More trees coming soon</p>
                  <p className="text-xs text-slate-600">Want to add one?</p>
                  <Link
                    href="/contribute"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Contribute a tree →
                  </Link>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-base leading-none">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      p === page
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-base leading-none">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── ContinueCard ─────────────────────────────────────────────────────────────

function ContinueCard({
  tree,
  progress,
  treeStats,
}: {
  tree:       SkillTree
  progress:   UserTreeProgress
  treeStats?: TreeStats
}) {
  const pct = Math.round((progress.completedCount / Math.max(1, progress.totalNodes)) * 100)

  return (
    <Link
      href={`/tree/${tree.treeId}`}
      className="group shrink-0 w-52 rounded-xl border border-white/8 bg-surface-dark hover:border-primary/40 hover:shadow-[0_0_20px_rgba(17,212,82,0.08)] transition-all duration-300 overflow-hidden"
    >
      {/* Mini header */}
      <div className="relative h-20 bg-gradient-to-br from-card-dark to-background-dark flex items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-20" />
        <div className="relative z-10 w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-primary text-2xl">{tree.icon}</span>
        </div>
        {/* Progress ring overlay */}
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] font-black text-primary">{pct}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-white text-xs font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {tree.title}
        </p>
        <p className="text-slate-600 text-[10px] mt-0.5">
          {progress.completedCount} / {progress.totalNodes} nodes
        </p>

        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stats row */}
        {treeStats && (
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
            {treeStats.avgRating !== null && (
              <span className="flex items-center gap-0.5">
                <span
                  className="material-symbols-outlined text-amber-400 text-[11px] leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {treeStats.avgRating.toFixed(1)}
              </span>
            )}
            {treeStats.enrolled > 0 && (
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px] leading-none">people</span>
                {treeStats.enrolled}
              </span>
            )}
          </div>
        )}

        {/* Resume label */}
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary">
          <span className="material-symbols-outlined text-[12px] leading-none">play_arrow</span>
          Resume
        </div>
      </div>
    </Link>
  )
}

// ─── TreeCard ─────────────────────────────────────────────────────────────────

function TreeCard({
  tree,
  treeStats,
  progress,
}: {
  tree:       SkillTree
  treeStats?: TreeStats
  progress?:  UserTreeProgress
}) {
  const categoryIcon = CATEGORY_ICON[tree.category] ?? 'auto_awesome'
  const diffLabel    = DIFFICULTY_LABEL[tree.difficulty]    ?? tree.difficulty
  const diffColor    = DIFFICULTY_COLOR[tree.difficulty]    ?? 'text-slate-400 border-slate-400/30'
  const isStarted    = (progress?.completedCount ?? 0) > 0
  const pct          = isStarted
    ? Math.round((progress!.completedCount / Math.max(1, progress!.totalNodes)) * 100)
    : 0

  return (
    <Link
      href={`/tree/${tree.treeId}`}
      className="group relative flex flex-col bg-surface-dark rounded-2xl border border-white/5 overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(17,212,82,0.08)]"
    >
      {/* Top gradient panel */}
      <div className="relative h-36 bg-gradient-to-br from-card-dark to-background-dark flex items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-30" />
        <div
          className="relative z-10 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{ boxShadow: '0 0 24px rgba(17,212,82,0.15)' }}
        >
          <span className="material-symbols-outlined text-primary text-4xl">{tree.icon}</span>
        </div>

        {/* Difficulty badge */}
        <div className={`absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${diffColor}`}>
          {diffLabel}
        </div>

        {/* Progress bar (if started) */}
        {isStarted && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span className="material-symbols-outlined text-sm">{categoryIcon}</span>
            {tree.category}
          </div>
          <h3 className="text-white font-bold text-base group-hover:text-primary transition-colors leading-snug">
            {tree.title}
          </h3>
          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {tree.description}
          </p>
        </div>

        {/* Social proof row */}
        {(treeStats?.enrolled ?? 0) > 0 || (treeStats?.avgRating ?? null) !== null ? (
          <div className="flex items-center gap-3 text-xs">
            {(treeStats?.enrolled ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="material-symbols-outlined text-sm text-slate-600">people</span>
                {treeStats!.enrolled.toLocaleString()} enrolled
              </span>
            )}
            {treeStats?.avgRating !== null && treeStats?.avgRating !== undefined && (
              <span className="flex items-center gap-1 text-slate-500">
                <span
                  className="material-symbols-outlined text-sm text-amber-400 leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="text-amber-400 font-semibold">{treeStats.avgRating.toFixed(1)}</span>
                {treeStats.ratingCount > 0 && (
                  <span className="text-slate-700">({treeStats.ratingCount})</span>
                )}
              </span>
            )}
          </div>
        ) : null}

        {/* Progress bar (if started) */}
        {isStarted && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1">
              <span>{progress!.completedCount} of {progress!.totalNodes} nodes</span>
              <span className="text-primary font-bold">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Bottom stats row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-600">timeline</span>
            {tree.totalNodes} nodes
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-600">schedule</span>
            ~{tree.estimatedMonths}mo
          </span>
          <span className={`ml-auto flex items-center gap-1 font-bold ${isStarted ? 'text-primary' : 'text-primary'}`}>
            {isStarted ? 'Resume' : 'Start'}
            <span className="material-symbols-outlined text-sm">{isStarted ? 'play_arrow' : 'arrow_forward'}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
