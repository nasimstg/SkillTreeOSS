import { create } from 'zustand'
import type { SkillTree, TreeNode, CanvasView } from '@/types/tree'
import type { UserProfile } from '@/types/user'
import { XP_PER_NODE } from '@/lib/utils'

const LS_GLOBAL_XP = 'globalXp'

function readGlobalXp(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(LS_GLOBAL_XP) ?? '0', 10) || 0
}

function saveGlobalXp(xp: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_GLOBAL_XP, String(xp))
}

interface SkillTreeState {
  // Auth
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void

  // Tree data
  currentTree: SkillTree | null
  setCurrentTree: (tree: SkillTree | null) => void

  // Progress
  completedNodeIds: string[]
  setCompletedNodeIds: (ids: string[]) => void
  completeNode: (nodeId: string, treeId: string) => void
  uncompleteNode: (nodeId: string) => void

  // Global XP — sum across all trees, persisted in localStorage
  // Hydrated from DB by UserMenu on mount; updated live by complete/uncomplete actions
  globalXp: number
  setGlobalXp: (xp: number) => void

  // UI state
  selectedNode: TreeNode | null
  setSelectedNode: (node: TreeNode | null) => void

  canvasView: CanvasView
  setCanvasView: (view: CanvasView) => void

  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Hover-highlight a prereq node on the canvas from the sidebar
  hoveredPrereqId: string | null
  setHoveredPrereqId: (id: string | null) => void
}

export const useSkillTreeStore = create<SkillTreeState>((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Tree data
  currentTree: null,
  setCurrentTree: (tree) => set({ currentTree: tree }),

  // Progress
  completedNodeIds: [],
  setCompletedNodeIds: (ids) => set({ completedNodeIds: ids }),

  completeNode: (nodeId, treeId) => {
    const prev = get().completedNodeIds
    if (prev.includes(nodeId)) return

    const next = [...prev, nodeId]
    const nextGlobalXp = get().globalXp + XP_PER_NODE
    set({ completedNodeIds: next, globalXp: nextGlobalXp })
    saveGlobalXp(nextGlobalXp)

    if (typeof window !== 'undefined') {
      localStorage.setItem(`progress:${treeId}`, JSON.stringify(next))
    }

    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treeId, completedNodeIds: next }),
    }).catch(() => {
      // Rollback on failure
      const rolledBack = get().globalXp - XP_PER_NODE
      set({ completedNodeIds: prev, globalXp: rolledBack })
      saveGlobalXp(rolledBack)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`progress:${treeId}`, JSON.stringify(prev))
      }
    })
  },

  uncompleteNode: (nodeId) => {
    const treeId = get().currentTree?.treeId
    const newIds = get().completedNodeIds.filter((id) => id !== nodeId)
    const nextGlobalXp = Math.max(0, get().globalXp - XP_PER_NODE)
    set({ completedNodeIds: newIds, globalXp: nextGlobalXp })
    saveGlobalXp(nextGlobalXp)

    if (typeof window !== 'undefined' && treeId) {
      localStorage.setItem(`progress:${treeId}`, JSON.stringify(newIds))
    }

    if (treeId) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId, completedNodeIds: newIds }),
      }).catch(() => {/* Non-critical */})
    }
  },

  // Global XP — initialised from localStorage so it survives page refreshes
  globalXp: readGlobalXp(),
  setGlobalXp: (xp) => {
    set({ globalXp: xp })
    saveGlobalXp(xp)
  },

  // UI state
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node, isSidebarOpen: node !== null }),

  canvasView: 'worldmap',
  setCanvasView: (view) => set({ canvasView: view }),

  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  hoveredPrereqId: null,
  setHoveredPrereqId: (id) => set({ hoveredPrereqId: id }),
}))
