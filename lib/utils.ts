import type { TreeNode, NodeStatus } from "@/types/tree"

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
