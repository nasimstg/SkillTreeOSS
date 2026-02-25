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
    const { treeId, nodeId, resourceUrl, vote } = body as {
      treeId: string
      nodeId: string
      resourceUrl: string
      vote: 'up' | 'down'
    }

    if (!treeId || !nodeId || !resourceUrl || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('resource_feedback')
      .upsert(
        {
          user_id: user.id,
          tree_id: treeId,
          node_id: nodeId,
          resource_url: resourceUrl,
          vote,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tree_id,node_id,resource_url' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[resources/upvote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
