import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/** Returns the total number of completed nodes across all trees for the signed-in user. */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ totalCompleted: 0 })

    const { data, error } = await supabase
      .from('user_progress')
      .select('completed_node_ids')
      .eq('user_id', user.id)

    if (error) throw error

    const totalCompleted = (data ?? []).reduce(
      (sum, row) => sum + (row.completed_node_ids?.length ?? 0),
      0,
    )
    return NextResponse.json({ totalCompleted })
  } catch (err) {
    console.error('[progress/GET]', err)
    return NextResponse.json({ totalCompleted: 0 })
  }
}

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
