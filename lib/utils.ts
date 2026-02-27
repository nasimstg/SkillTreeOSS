import type { TreeNode, NodeStatus } from "@/types/tree"

// ─── XP / Level system ────────────────────────────────────────────────────────

export const XP_PER_NODE = 50

export const LEVEL_THRESHOLDS: readonly { level: number; title: string; xp: number }[] = [
  { level: 1, title: 'Apprentice',  xp: 0    },
  { level: 2, title: 'Explorer',   xp: 200  },
  { level: 3, title: 'Journeyman', xp: 500  },
  { level: 4, title: 'Adept',      xp: 1000 },
  { level: 5, title: 'Specialist', xp: 2000 },
  { level: 6, title: 'Expert',     xp: 3500 },
  { level: 7, title: 'Master',     xp: 5500 },
  { level: 8, title: 'Grandmaster',xp: 8000 },
]

export function getLevelInfo(xp: number): { level: number; title: string; progress: number } {
  let currentIdx = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) currentIdx = i
  }
  const current = LEVEL_THRESHOLDS[currentIdx]
  const next    = LEVEL_THRESHOLDS[currentIdx + 1]
  if (!next) return { level: current.level, title: current.title, progress: 1 }
  const xpInLevel = xp - current.xp
  const xpToNext  = next.xp - current.xp
  return { level: current.level, title: current.title, progress: xpInLevel / xpToNext }
}

export function getNodeStatus(node: TreeNode, completedIds: string[]): NodeStatus {
  if (completedIds.includes(node.id)) return "completed"
  if (node.requires.every(req => completedIds.includes(req))) return "available"
  return "locked"
}

export function getProgressPercent(completedIds: string[], totalNodes: number): number {
  if (totalNodes === 0) return 0
  return Math.round((completedIds.length / totalNodes) * 100)
}

export function formatHours(hours: number): string {
  if (hours < 1) return `~${Math.round(hours * 60)} min`
  if (hours === 1) return "~1 hour"
  return `~${hours} hours`
}

export function getZoneColor(zone: string): string {
  const map: Record<string, string> = {
    Foundation: "text-yellow-400",
    Frontend: "text-accent-blue",
    Backend: "text-orange-400",
    "Full-Stack": "text-primary",
    DevOps: "text-purple-400",
  }
  return map[zone] ?? "text-slate-400"
}
