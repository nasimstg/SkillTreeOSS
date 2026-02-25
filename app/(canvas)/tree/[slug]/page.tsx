import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import SkillCanvas from '@/components/canvas/SkillCanvas'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { SkillTree } from '@/types/tree'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  try {
    const treePath = join(process.cwd(), 'data', 'trees', `${slug}.json`)
    const tree = JSON.parse(readFileSync(treePath, 'utf-8')) as SkillTree
    return {
      title: `${tree.title} — The Skill-Tree`,
      description: tree.description,
    }
  } catch {
    return { title: 'Skill Tree — The Skill-Tree' }
  }
}

export default async function TreePage({ params }: Props) {
  const { slug } = await params

  let tree: SkillTree
  try {
    const treePath = join(process.cwd(), 'data', 'trees', `${slug}.json`)
    tree = JSON.parse(readFileSync(treePath, 'utf-8')) as SkillTree
  } catch {
    notFound()
  }

  // Load user progress from Supabase if logged in
  let initialCompletedIds: string[] = []
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_progress')
        .select('completed_node_ids')
        .eq('user_id', user.id)
        .eq('tree_id', slug)
        .single()
      if (data?.completed_node_ids) {
        initialCompletedIds = data.completed_node_ids
      }
    }
  } catch {
    // Not logged in or table not yet created — start fresh
  }

  return (
    <div className="w-full h-full">
      <SkillCanvas tree={tree} initialCompletedIds={initialCompletedIds} />
    </div>
  )
}
