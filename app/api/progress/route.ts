import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { treeId, completedNodeIds } = body as {
      treeId: string
      completedNodeIds: string[]
    }

    if (!treeId || !Array.isArray(completedNodeIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          tree_id: treeId,
          completed_node_ids: completedNodeIds,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id,tree_id' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[progress/update]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
