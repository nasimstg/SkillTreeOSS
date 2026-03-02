import type { Metadata } from 'next'
import Link from 'next/link'
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
      {/* Mobile unsupported overlay — only visible below md breakpoint */}
      <div className="md:hidden fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background-dark px-6 text-center overflow-hidden" style={{ touchAction: 'none' }}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-4xl">desktop_windows</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Builder needs a bigger screen</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            The visual tree builder is optimised for tablets and desktops.
            Open it on a device with at least a 768 px wide display.
          </p>
        </div>
        <Link
          href="/explore"
          className="h-11 px-6 rounded-full bg-primary text-black text-sm font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">explore</span>
          Browse skill trees
        </Link>
      </div>

      <BuilderCanvas initialDraft={initialDraft} />
    </div>
  )
}
