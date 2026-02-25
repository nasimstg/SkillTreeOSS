import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import type { SkillTree } from '@/types/tree'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Skill Trees — The Skill-Tree',
  description: 'Browse all available skill trees. Find your next learning path across technology, art, science, and more.',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  hard: 'Advanced',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-primary border-primary/30',
  intermediate: 'text-yellow-400 border-yellow-400/30',
  hard: 'text-red-400 border-red-400/30',
}

const CATEGORY_ICON: Record<string, string> = {
  Technology: 'terminal',
  Art: 'palette',
  Science: 'science',
  Music: 'music_note',
  Language: 'translate',
  Business: 'business_center',
}

function loadAllTrees(): SkillTree[] {
  const treesDir = join(process.cwd(), 'data', 'trees')
  try {
    const files = readdirSync(treesDir).filter((f) => f.endsWith('.json'))
    return files.map((f) =>
      JSON.parse(readFileSync(join(treesDir, f), 'utf-8')) as SkillTree
    )
  } catch {
    return []
  }
}

export default function ExplorePage() {
  const trees = loadAllTrees()

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">

      <main className="flex-1">
        {/* Header */}
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
              Every skill tree is built from the best free resources on the internet.
              Open source, community-curated, always growing.
            </p>
          </div>
        </div>

        {/* Filters row (static for now) */}
        <div className="border-b border-white/5 bg-surface-dark/50">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-4 flex items-center gap-3 overflow-x-auto">
            {['All', 'Technology', 'Art', 'Science', 'Music', 'Language'].map((cat, i) => (
              <button
                key={cat}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  i === 0
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="ml-auto shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-9">
              <span className="material-symbols-outlined text-slate-500 text-lg">search</span>
              <input
                type="text"
                placeholder="Search trees…"
                className="bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none w-40"
              />
            </div>
          </div>
        </div>

        {/* Tree grid */}
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-12">
          {trees.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-700">forest</span>
              <p className="text-slate-400">No skill trees found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trees.map((tree) => (
                <TreeCard key={tree.treeId} tree={tree} />
              ))}

              {/* Coming soon placeholder */}
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
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

function TreeCard({ tree }: { tree: SkillTree }) {
  const categoryIcon = CATEGORY_ICON[tree.category] ?? 'auto_awesome'
  const diffLabel = DIFFICULTY_LABEL[tree.difficulty] ?? tree.difficulty
  const diffColor = DIFFICULTY_COLOR[tree.difficulty] ?? 'text-slate-400 border-slate-400/30'

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

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-600">timeline</span>
            {tree.totalNodes} nodes
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-slate-600">schedule</span>
            ~{tree.estimatedMonths}mo
          </span>
          <span className="ml-auto flex items-center gap-1 text-primary font-bold">
            Start
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
