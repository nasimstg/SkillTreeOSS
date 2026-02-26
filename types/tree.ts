export type NodeStatus = 'locked' | 'available' | 'completed'

export type ResourceType = 'video' | 'article' | 'interactive' | 'course' | 'docs'

export interface Resource {
  id: string
  title: string
  url: string
  type: ResourceType
  author: string
  estimatedHours: number
  isFree?: boolean
  language?: string
}

export interface TreeNode {
  id: string
  label: string
  description: string
  icon: string
  zone: string
  resources: Resource[]
  position?: { x: number; y: number }  // omit in JSON; Dagre computes layout automatically. Reserved for future roadmap creator.
  requires: string[]
}

export interface TreeEdge {
  id: string
  source: string
  target: string
}

export interface SkillTree {
  treeId: string
  title: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  version: string
  estimatedMonths: number
  totalNodes: number
  icon: string
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export type CanvasView = 'worldmap' | 'rpg' | 'terminal' | 'neural'

export interface RichNode extends TreeNode {
  status: NodeStatus
}
