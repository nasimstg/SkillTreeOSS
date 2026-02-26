import { create } from 'zustand'
import type { SkillTree, TreeNode, CanvasView } from '@/types/tree'
import type { UserProfile } from '@/types/user'

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
    set({ completedNodeIds: next })

    // Optimistic save to backend
    fetch('/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treeId, completedNodeIds: next }),
    }).catch(() => {
      // Rollback on failure
      set({ completedNodeIds: prev })
    })
  },

  uncompleteNode: (nodeId) => {
    set((state) => ({
      completedNodeIds: state.completedNodeIds.filter((id) => id !== nodeId),
    }))
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
