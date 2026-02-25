'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSkillTreeStore } from '@/lib/store'
import { getNodeStatus, formatHours, getZoneColor } from '@/lib/utils'
import type { SkillTree, TreeNode, Resource, ResourceType } from '@/types/tree'
import { useState, useRef, useMemo } from 'react'

// ── Type config ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ResourceType, {
  label: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  badgeIcon: string   // icon inside the inline badge
  cardIcon: string   // large icon in compact-card box
  cardIconColor: string
}> = {
  video: {
    label: 'Video',
    badgeBg: 'bg-red-900/30',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-900/50',
    badgeIcon: 'videocam',
    cardIcon: 'videocam',
    cardIconColor: 'text-red-400',
  },
  docs: {
    label: 'Docs',
    badgeBg: 'bg-blue-900/30',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-900/50',
    badgeIcon: 'description',
    cardIcon: 'menu_book',
    cardIconColor: 'text-slate-300',
  },
  interactive: {
    label: 'Interactive',
    badgeBg: 'bg-amber-900/30',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-900/50',
    badgeIcon: 'touch_app',
    cardIcon: 'sports_esports',
    cardIconColor: 'text-amber-400',
  },
  article: {
    label: 'Article',
    badgeBg: 'bg-indigo-900/30',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-900/50',
    badgeIcon: 'library_books',
    cardIcon: 'article',
    cardIconColor: 'text-indigo-400',
  },
  course: {
    label: 'Course',
    badgeBg: 'bg-purple-900/30',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-900/50',
    badgeIcon: 'school',
    cardIcon: 'school',
    cardIconColor: 'text-purple-400',
  },
}

const ZONE_ICON_STYLE: Record<string, string> = {
  Foundation: 'bg-yellow-400/15 text-yellow-400',
  Frontend: 'bg-blue-400/15 text-blue-400',
  Backend: 'bg-orange-400/15 text-orange-400',
  'Full-Stack': 'bg-primary/15 text-primary',
  DevOps: 'bg-purple-400/15 text-purple-400',
}

const TYPE_FILTER_ORDER: Array<ResourceType | 'all'> =
  ['all', 'video', 'docs', 'interactive', 'course', 'article']

const SPRING = { type: 'spring' as const, damping: 28, stiffness: 300 }

// ── Helpers ────────────────────────────────────────────────────────────────────

function getYouTubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours === 1) return '~1 hr'
  return `~${hours} hrs`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** BFS to collect every transitive ancestor of `node` from `allNodes`. */
function getAllAncestors(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  const visited = new Set<string>()
  const result: TreeNode[] = []
  const queue = [...node.requires]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const ancestor = allNodes.find((n) => n.id === id)
    if (ancestor) {
      result.push(ancestor)
      ancestor.requires.forEach((reqId) => {
        if (!visited.has(reqId)) queue.push(reqId)
      })
    }
  }
  return result
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props { tree: SkillTree }

// ── Main ───────────────────────────────────────────────────────────────────────

export default function NodeSidebar({ tree }: Props) {
  const { selectedNode, setSelectedNode, completedNodeIds, completeNode, currentTree } =
    useSkillTreeStore()

  const isOpen = selectedNode !== null

  // Cache last non-null node so exit animation has content to render
  const lastNodeRef = useRef(selectedNode)
  if (selectedNode !== null) lastNodeRef.current = selectedNode
  const node = lastNodeRef.current
  if (!node) return null

  const status = getNodeStatus(node, completedNodeIds)
  const isCompleted = status === 'completed'
  const isLocked = status === 'locked'
  const treeId = currentTree?.treeId ?? tree.treeId
  // All transitive ancestors (not just immediate requires)
  const prerequisites = getAllAncestors(node, tree.nodes)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Panel */}
          <motion.aside
            key={`sidebar`}
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.6 }}
            transition={SPRING}
            className="fixed right-0 top-0 z-50 h-screen w-full md:w-[600px] lg:w-[750px] flex flex-row bg-bg-landing border-l border-white/[0.07] shadow-2xl font-display"
          >
            <motion.button
              onClick={() => setSelectedNode(null)}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              whileTap={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              className="shrink-0 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer border-r border-r-white/[0.06]"
              aria-label="Close panel"
            >
              <motion.span
                className="material-symbols-outlined text-[24px] leading-none block"
              >
                arrow_right
              </motion.span>
            </motion.button>
            <div className='h-screen w-full flex flex-col'>
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
                <div className="flex flex-col gap-1 pr-8">
                  <h2 className="text-2xl font-bold tracking-tight leading-tight text-white">
                    {node.label}
                  </h2>
                  <p className="text-sm text-slate-400 font-normal leading-relaxed">
                    {node.description}
                  </p>
                </div>
                <motion.button
                  onClick={() => setSelectedNode(null)}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                  whileTap={{ scale: 0.92 }}
                  className="shrink-0 rounded-full p-2 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close panel"
                >
                  <motion.span
                    className="material-symbols-outlined text-[24px] leading-none block"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.18, type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    close
                  </motion.span>
                </motion.button>
              </div>

              {/* ── Scrollable body ── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Resources */}
                <ResourceList node={node} treeId={treeId} nodeId={node.id} />

                {/* Prerequisites */}
                {prerequisites.length > 0 && (
                  <div className="pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Prerequisites
                      </h4>
                      <span className="text-[10px] text-slate-600">
                        {prerequisites.filter(p => getNodeStatus(p, completedNodeIds) === 'completed').length}
                        /{prerequisites.length} done
                      </span>
                    </div>
                    <div className="space-y-2">
                      {prerequisites.map((pre) => {
                        const done = getNodeStatus(pre, completedNodeIds) === 'completed'
                        const zoneStyle = ZONE_ICON_STYLE[pre.zone] ?? 'bg-slate-400/15 text-slate-400'
                        return (
                          <button
                            key={pre.id}
                            onClick={() => setSelectedNode(pre)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer group
                              ${done
                                ? 'bg-card-dark border-white/[0.06] hover:border-primary/30'
                                : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10'
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${zoneStyle}`}>
                              <span className="material-symbols-outlined text-[20px]">{pre.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate transition-colors ${done ? 'text-slate-200 group-hover:text-primary' : 'text-amber-200 group-hover:text-amber-100'}`}>
                                {pre.label}
                              </p>
                              <p className="text-xs text-slate-500">{done ? 'Completed' : pre.zone}</p>
                            </div>
                            <span className={`material-symbols-outlined text-[20px] shrink-0 ${done ? 'text-primary' : 'text-amber-500/60'}`}>
                              {done ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="shrink-0 px-6 py-5 border-t border-white/[0.08] bg-bg-landing shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.4)]">
                {isCompleted ? (
                  <div className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold">
                    <span className="material-symbols-outlined">workspace_premium</span>
                    Node Mastered!
                  </div>
                ) : isLocked ? (
                  <div className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-bold cursor-not-allowed">
                    <span className="material-symbols-outlined">lock</span>
                    Complete prerequisites first
                  </div>
                ) : (
                  <button
                    onClick={() => completeNode(node.id, treeId)}
                    className="w-full relative group overflow-hidden rounded-xl bg-primary hover:bg-primary-dark transition-all duration-300 text-background-dark h-14 font-bold text-base tracking-wide flex items-center justify-center gap-3 glow-primary hover:glow-primary-lg"
                  >
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform duration-300">
                      lock_open
                    </span>
                    Mark as Completed
                  </button>
                )}

              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ── ResourceList ───────────────────────────────────────────────────────────────

function ResourceList({ node, treeId, nodeId }: { node: TreeNode; treeId: string; nodeId: string }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [votes, setVotes] = useState<Record<string, 'up' | 'down'>>({})

  const handleVote = (resourceId: string, resourceUrl: string, vote: 'up' | 'down') => {
    setVotes((prev) => ({ ...prev, [resourceId]: vote }))
    fetch('/api/resources/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treeId, nodeId, resourceUrl, vote }),
    })
  }

  const resources = node.resources

  // Only surface type chips that have at least one resource
  const availableTypes = useMemo<Array<ResourceType | 'all'>>(() => {
    const present = new Set(resources.map((r) => r.type))
    return TYPE_FILTER_ORDER.filter((t) => t === 'all' || present.has(t as ResourceType))
  }, [resources])

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.author.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [resources, typeFilter, search])

  const [featured, ...rest] = filtered

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Learning Resources
      </h3>

      {/* Search */}
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card-dark border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-500 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${typeFilter === t
              ? 'bg-primary/20 text-primary border-primary glow-primary'
              : 'bg-card-dark text-slate-400 border-white/[0.08] hover:border-slate-600 hover:text-slate-200'
              }`}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Cards */}
      <AnimatePresence mode="popLayout" initial={false}>
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 text-slate-600"
          >
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p className="text-sm">No resources match your search</p>
            <button
              onClick={() => { setSearch(''); setTypeFilter('all') }}
              className="mt-2 text-xs text-accent-blue hover:underline"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── Featured card (first result) ── */}
            {featured && (
              <motion.div
                key={featured.id + '-featured'}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="group relative flex flex-col gap-3 p-4 rounded-xl bg-card-dark border-2 border-amber-500/40 hover:border-amber-500/70 transition-colors shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]"
              >
                {/* RECOMMENDED tag */}
                <div className="absolute -top-3 -right-2 z-20">
                  <div className="flex items-center gap-1 bg-amber-500 text-black px-2 py-0.5 rounded-full shadow-lg border border-amber-300 font-bold text-[10px] uppercase tracking-wider rotate-3">
                    <span className="material-symbols-outlined text-[13px]">star</span>
                    Recommended
                  </div>
                </div>

                {/* Thumbnail */}
                <FeaturedThumbnail resource={featured} />

                {/* Meta */}
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <TypeBadge type={featured.type} />
                    <span className="text-[10px] text-slate-400">{formatDuration(featured.estimatedHours)}</span>
                  </div>
                  <h4 className="text-base font-bold leading-tight text-slate-100 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h4>
                  <p className="text-xs text-slate-500">By {featured.author}</p>
                </a>

                {/* Per-resource vote */}
                <ResourceVote
                  vote={votes[featured.id] ?? null}
                  onVote={(v) => handleVote(featured.id, featured.url, v)}
                />
              </motion.div>
            )}

            {/* ── Compact cards (rest) ── */}
            {rest.map((r) => {
              const cfg = TYPE_CONFIG[r.type]
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col rounded-xl bg-card-dark border border-white/[0.07] hover:border-primary/40 transition-colors shadow-sm overflow-hidden"
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-4"
                  >
                    {/* Type icon box */}
                    <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <span className={`material-symbols-outlined text-2xl ${cfg.cardIconColor}`}>
                        {cfg.cardIcon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <TypeBadge type={r.type} />
                        <span className="text-[10px] text-slate-500 shrink-0">{formatDuration(r.estimatedHours)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors leading-snug">
                        {r.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">By {r.author}</p>
                    </div>
                  </a>

                  {/* Per-resource vote */}
                  <div className="px-4 pb-3 border-t border-white/[0.05]">
                    <ResourceVote
                      vote={votes[r.id] ?? null}
                      onVote={(v) => handleVote(r.id, r.url, v)}
                    />
                  </div>
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── FeaturedThumbnail ──────────────────────────────────────────────────────────

function FeaturedThumbnail({ resource }: { resource: Resource }) {
  const thumb = resource.type === 'video' ? getYouTubeThumbnail(resource.url) : null

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 block"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={resource.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-card-dark to-black/60" />
      )}
      {/* Overlay + play button */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white text-2xl ml-0.5">play_arrow</span>
        </div>
      </div>
      {/* Duration overlay */}
      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
        {formatDuration(resource.estimatedHours)}
      </div>
    </a>
  )
}

// ── TypeBadge ──────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ResourceType }) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
      <span className="material-symbols-outlined text-[11px]">{cfg.badgeIcon}</span>
      {cfg.label}
    </span>
  )
}

// ── ResourceVote ───────────────────────────────────────────────────────────────

function ResourceVote({
  vote, onVote,
}: {
  vote: 'up' | 'down' | null
  onVote: (v: 'up' | 'down') => void
}) {
  return (
    <div className="flex items-center gap-2 pt-2.5">
      <span className="text-[11px] text-slate-600 mr-1">Helpful?</span>
      <button
        aria-label="Helpful"
        onClick={() => onVote('up')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${vote === 'up'
          ? 'bg-primary/15 border-primary/40 text-primary'
          : 'bg-black/20 border-white/[0.06] text-slate-500 hover:border-primary/30 hover:text-primary'
          }`}
      >
        <span className="material-symbols-outlined text-[14px]">thumb_up</span>
        Yes
      </button>
      <button
        aria-label="Not helpful"
        onClick={() => onVote('down')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${vote === 'down'
          ? 'bg-red-500/15 border-red-500/30 text-red-400'
          : 'bg-black/20 border-white/[0.06] text-slate-500 hover:border-red-500/30 hover:text-red-400'
          }`}
      >
        <span className="material-symbols-outlined text-[14px]">thumb_down</span>
        No
      </button>
    </div>
  )
}
