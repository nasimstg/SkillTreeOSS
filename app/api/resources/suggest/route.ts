import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/resources/suggest
 * Body: { treeId, nodeId, nodeLabel, message, url?, title? }
 *
 * Stores a user's resource suggestion in the resource_suggestions table.
 * Works for both signed-in and anonymous users (user_id nullable).
 */
export async function POST(request: Request) {
  try {
    const {
      treeId,
      nodeId,
      nodeLabel,
      message,
      url,
      title,
    } = (await request.json()) as {
      treeId:    string
      nodeId:    string
      nodeLabel: string
      message:   string
      url?:      string
      title?:    string
    }

    if (!treeId || !nodeId || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get user if signed in (null for anonymous — still accepted)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('resource_suggestions').insert({
      user_id:         user?.id ?? null,
      tree_id:         treeId,
      node_id:         nodeId,
      node_label:      nodeLabel ?? null,
      message:         message.trim(),
      suggested_url:   url?.trim()   || null,
      suggested_title: title?.trim() || null,
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[resources/suggest]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
