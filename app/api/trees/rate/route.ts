import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/** GET ?treeId=xxx  — returns the signed-in user's existing rating for a tree */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const treeId = searchParams.get('treeId')
  if (!treeId) return NextResponse.json({ rating: null })

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ rating: null })

    const { data } = await supabase
      .from('tree_ratings')
      .select('rating')
      .eq('user_id', user.id)
      .eq('tree_id', treeId)
      .single()

    return NextResponse.json({ rating: data?.rating ?? null })
  } catch {
    return NextResponse.json({ rating: null })
  }
}

/** POST { treeId, rating: 1-5 }  — upsert the signed-in user's rating */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { treeId, rating } = (await request.json()) as { treeId: string; rating: number }

    if (!treeId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabase
      .from('tree_ratings')
      .upsert(
        { user_id: user.id, tree_id: treeId, rating },
        { onConflict: 'user_id,tree_id' },
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[trees/rate]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
