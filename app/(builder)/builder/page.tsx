import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import BuilderCanvas from '@/components/builder/BuilderCanvas'
import type { BuilderDraft } from '@/lib/builder-utils'

export const metadata: Metadata = {
  title:       'Skill Tree Builder — SkillTreeOSS',
  description: 'Create and contribute a new skill tree',
}

export default async function BuilderPage() {
  let initialDraft: BuilderDraft | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('tree_drafts')
        .select('tree_data')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.tree_data) {
        initialDraft = data.tree_data as BuilderDraft
      }
    }
  } catch {
    // Non-critical — builder still works without a draft
  }

  return (
    <div className="w-full h-full">
      <BuilderCanvas initialDraft={initialDraft} />
    </div>
  )
}
