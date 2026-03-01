'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSkillTreeStore } from '@/lib/store'
import { getNodeStatus, formatHours, getZoneColor } from '@/lib/utils'
import type { SkillTree, TreeNode, Resource, ResourceType } from '@/types/tree'
import { useState, useRef, useCallback, useMemo } from 'react'

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

/**
 * Topological sort (post-order DFS) — returns prereqs foundation-first,
 * so base nodes with no ancestors appear at the top of the list.
 */
function sortPrereqsTopologically(prereqs: TreeNode[]): TreeNode[] {
  const ids = new Set(prereqs.map((n) => n.id))
  const result: TreeNode[] = []
  const visited = new Set<string>()
  function dfs(node: TreeNode) {
    if (visited.has(node.id)) return
    visited.add(node.id)
    for (const reqId of node.requires) {
      if (!ids.has(reqId) || visited.has(reqId)) continue
      const req = prereqs.find((n) => n.id === reqId)
      if (req) dfs(req)
    }
    result.push(node)
  }
  for (const node of prereqs) dfs(node)
  return result
}

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

interface Props { tree: SkillTree; preview?: boolean }

// ── Main ───────────────────────────────────────────────────────────────────────

export default function NodeSidebar({ tree, preview = false }: Props) {
  const { selectedNode, setSelectedNode, completedNodeIds, completeNode, currentTree, setHoveredPrereqId } =
    useSkillTreeStore()

  const [distantExpanded, setDistantExpanded] = useState(false)
  // Must be above early return — hooks cannot be called conditionally
  const handlePrereqHover = useCallback((id: string | null) => setHoveredPrereqId(id), [setHoveredPrereqId])

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

  // All transitive ancestors (not just immediate requires), sorted foundation-first
  const prerequisites = getAllAncestors(node, tree.nodes)
  const sortedPrereqs = sortPrereqsTopologically(prerequisites)
  const immediateIds = new Set(node.requires)
  const immediate = sortedPrereqs.filter((p) => immediateIds.has(p.id))
  const distant   = sortedPrereqs.filter((p) => !immediateIds.has(p.id))
  const prereqDoneCount = prerequisites.filter((p) => completedNodeIds.includes(p.id)).length

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
            className="fixed right-0 top-0 z-50 h-screen w-full lg:w-2/5 flex flex-row bg-background-dark border-l border-white/[0.07] shadow-2xl font-display"
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
                <ResourceList node={node} treeId={treeId} nodeId={node.id} preview={preview} />

                {/* Prerequisites — vertical timeline */}
                {prerequisites.length > 0 && (
                  <div className="pt-4 border-t border-white/[0.06]">

                    {/* Section header */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Prerequisites
                      </h4>
                      <span className="text-[10px] text-slate-600 tabular-nums">
                        {prereqDoneCount} / {prerequisites.length} done
                      </span>
                    </div>

                    <div className="flex flex-col">

                      {/* ── Distant ancestors (collapsible) ── */}
                      {distant.length > 0 && (
                        <>
                          <button
                            onClick={() => setDistantExpanded((v) => !v)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors mb-1 group"
                          >
                            <span className={`material-symbols-outlined text-base text-slate-600 transition-transform duration-200 ${distantExpanded ? 'rotate-90' : ''}`}>
                              chevron_right
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors flex-1 text-left">
                              {distantExpanded ? 'Hide' : 'Show'} {distant.length} foundational {distant.length === 1 ? 'prerequisite' : 'prerequisites'}
                            </span>
                            {/* Mini progress dots */}
                            <span className="flex items-center gap-1 shrink-0">
                              {distant.slice(0, 6).map((p) => (
                                <span
                                  key={p.id}
                                  className={`inline-block w-1.5 h-1.5 rounded-full ${completedNodeIds.includes(p.id) ? 'bg-primary' : 'bg-white/15'}`}
                                />
                              ))}
                              {distant.length > 6 && <span className="text-[9px] text-slate-600">+{distant.length - 6}</span>}
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {distantExpanded && (
                              <motion.div
                                key="distant"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                {distant.map((pre, idx) => (
                                  <PrereqTimelineItem
                                    key={pre.id}
                                    prereq={pre}
                                    isLast={idx === distant.length - 1 && immediate.length === 0}
                                    completedNodeIds={completedNodeIds}
                                    onNavigate={setSelectedNode}
                                    onHover={handlePrereqHover}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {/* ── Immediate prerequisites ── */}
                      {immediate.map((pre, idx) => (
                        <PrereqTimelineItem
                          key={pre.id}
                          prereq={pre}
                          isLast={idx === immediate.length - 1}
                          completedNodeIds={completedNodeIds}
                          onNavigate={setSelectedNode}
                          onHover={handlePrereqHover}
                        />
                      ))}

                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer — hidden in builder preview ── */}
              {!preview && (
                <div className="shrink-0 px-6 py-5 border-t border-white/[0.08] bg-background-dark shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.4)]">
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
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ── PrereqTimelineItem ─────────────────────────────────────────────────────────

interface PrereqTimelineItemProps {
  prereq: TreeNode
  isLast: boolean
  completedNodeIds: string[]
  onNavigate: (node: TreeNode) => void
  onHover: (id: string | null) => void
}

function PrereqTimelineItem({ prereq, isLast, completedNodeIds, onNavigate, onHover }: PrereqTimelineItemProps) {
  const status = getNodeStatus(prereq, completedNodeIds)
  const isCompleted = status === 'completed'
  const isAvailable = status === 'available'
  const isLocked    = status === 'locked'

  const zoneStyle = ZONE_ICON_STYLE[prereq.zone] ?? 'bg-slate-400/15 text-slate-400'

  const dotCls = isCompleted
    ? 'bg-primary/15 border-2 border-primary'
    : isAvailable
      ? 'bg-accent-blue/15 border-2 border-accent-blue'
      : 'bg-white/5 border border-white/20'

  const dotIcon = isCompleted ? 'check' : isAvailable ? 'play_arrow' : 'lock'
  const dotIconColor = isCompleted ? 'text-primary' : isAvailable ? 'text-accent-blue' : 'text-slate-600'

  const labelColor = isCompleted
    ? 'text-slate-200'
    : isAvailable
      ? 'text-accent-blue'
      : 'text-slate-400'

  const subText = isCompleted
    ? 'Completed'
    : isAvailable
      ? 'Ready to start'
      : prereq.zone

  const subColor = isCompleted
    ? 'text-primary/80'
    : isAvailable
      ? 'text-accent-blue/60'
      : 'text-slate-600'

  return (
    <div className="flex gap-3">
      {/* Timeline track */}
      <div className="flex flex-col items-center shrink-0 w-5">
        {/* Status dot */}
        <div className={`relative w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10 ${dotCls}`}>
          {isAvailable && (
            <span className="absolute inset-0 rounded-full border-2 border-accent-blue animate-ping opacity-25" />
          )}
          <span className={`material-symbols-outlined leading-none ${dotIconColor}`} style={{ fontSize: 10 }}>
            {dotIcon}
          </span>
        </div>
        {/* Connecting line to next item */}
        {!isLast && <div className="w-px flex-1 mt-1 bg-white/[0.07] min-h-[20px]" />}
      </div>

      {/* Content row */}
      <button
        onClick={() => onNavigate(prereq)}
        onMouseEnter={() => onHover(prereq.id)}
        onMouseLeave={() => onHover(null)}
        className={`flex-1 flex items-center gap-3 pb-4 text-left group transition-opacity ${isLocked ? 'opacity-50 hover:opacity-80' : ''}`}
      >
        {/* Zone icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${zoneStyle}`}>
          <span className="material-symbols-outlined text-base leading-none">{prereq.icon}</span>
        </div>

        {/* Label + sub */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className={`text-sm font-bold truncate transition-colors group-hover:text-white ${labelColor}`}>
            {prereq.label}
          </p>
          <p className={`text-[10px] font-medium ${subColor}`}>{subText}</p>
        </div>

        {/* Hover arrow */}
        <span className="material-symbols-outlined text-sm text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          arrow_forward
        </span>
      </button>
    </div>
  )
}

// ── ResourceList ───────────────────────────────────────────────────────────────

function ResourceList({ node, treeId, nodeId, preview = false }: { node: TreeNode; treeId: string; nodeId: string; preview?: boolean }) {
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

  const filtered = useMemo(
    () => resources.filter((r) => typeFilter === 'all' || r.type === typeFilter),
    [resources, typeFilter],
  )

  const [featured, ...rest] = filtered

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Learning Resources
      </h3>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${typeFilter === t
              ? 'bg-primary/20 text-primary border-primary glow-primary'
              : 'bg-surface-dark text-slate-400 border-white/[0.08] hover:border-slate-600 hover:text-slate-200'
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
            <span className="material-symbols-outlined text-4xl mb-2">filter_list_off</span>
            <p className="text-sm">No resources for this type</p>
            <button
              onClick={() => setTypeFilter('all')}
              className="mt-2 text-xs text-accent-blue hover:underline"
            >
              Show all
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
                className="group relative flex flex-col gap-3 p-4 rounded-xl bg-surface-dark border-2 border-amber-500/40 hover:border-amber-500/70 transition-colors shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]"
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

                {/* Per-resource vote — hidden in builder preview */}
                {!preview && (
                  <ResourceVote
                    vote={votes[featured.id] ?? null}
                    onVote={(v) => handleVote(featured.id, featured.url, v)}
                  />
                )}
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
                  className="flex flex-col rounded-xl bg-surface-dark border border-white/[0.07] hover:border-primary/40 transition-colors shadow-sm overflow-hidden"
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

                  {/* Per-resource vote — hidden in builder preview */}
                  {!preview && (
                    <div className="px-4 pb-3 border-t border-white/[0.05]">
                      <ResourceVote
                        vote={votes[r.id] ?? null}
                        onVote={(v) => handleVote(r.id, r.url, v)}
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Suggest a better resource — hidden in builder preview */}
      {!preview && <SuggestResourceButton treeId={treeId} nodeId={nodeId} nodeLabel={node.label} />}
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
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark to-black/60" />
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

// ── SuggestResourceButton ──────────────────────────────────────────────────────

function SuggestResourceButton({
  treeId,
  nodeId,
  nodeLabel,
}: {
  treeId:    string
  nodeId:    string
  nodeLabel: string
}) {
  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [url,     setUrl]     = useState('')
  const [title,   setTitle]   = useState('')
  const [state,   setState]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setState('loading')
    try {
      const res = await fetch('/api/resources/suggest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId, nodeId, nodeLabel, message, url, title }),
      })
      if (!res.ok) throw new Error('failed')
      setState('done')
    } catch {
      setState('error')
    }
  }

  function reset() {
    setOpen(false)
    setMessage('')
    setUrl('')
    setTitle('')
    setState('idle')
  }

  return (
    <div className="mt-2 pt-4 border-t border-white/[0.06]">
      {/* Toggle button */}
      <button
        onClick={() => { setOpen(v => !v); if (state === 'done') reset() }}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-xs font-semibold transition-all ${
          open
            ? 'border-primary/30 text-primary bg-primary/5'
            : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-sm leading-none">
          {open ? 'expand_less' : 'post_add'}
        </span>
        {open ? 'Cancel' : 'Suggest a better resource'}
      </button>

      {/* Collapsible form */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="suggest-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              {state === 'done' ? (
                /* ── Success state ── */
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                  </div>
                  <p className="text-sm font-bold text-white">Thanks for your suggestion!</p>
                  <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
                    We'll review it and update the resource list if it's a better fit.
                  </p>
                  <button onClick={reset} className="text-xs text-primary hover:underline mt-1">
                    Close
                  </button>
                </motion.div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                  {/* What's wrong / explanation */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      What's wrong or missing?
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="e.g. The recommended video is outdated — the API changed in 2024. I found a free course that covers the new version..."
                      rows={3}
                      required
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-none leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Suggested URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Suggested URL
                      <span className="text-slate-600 ml-1 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {/* Resource title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Resource title
                      <span className="text-slate-600 ml-1 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Full Stack Open 2024"
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {/* Error */}
                  {state === 'error' && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm leading-none">error</span>
                      Something went wrong — please try again.
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!message.trim() || state === 'loading'}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {state === 'loading' ? (
                      <>
                        <span className="material-symbols-outlined text-base leading-none animate-spin">
                          progress_activity
                        </span>
                        Sending…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base leading-none">send</span>
                        Submit Suggestion
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
