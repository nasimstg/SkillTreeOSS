export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserProgress {
  user_id: string
  tree_id: string
  completed_node_ids: string[]
  last_updated: string
}

export interface ResourceFeedback {
  id: string
  user_id: string
  tree_id: string
  node_id: string
  resource_url: string
  vote: 'up' | 'down'
  created_at: string
}
