import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface TreeStats {
  enrolled: number
  avgRating: number | null
  ratingCount: number
}

/**
 * GET — returns enrollment counts + avg ratings for every tree.
 * Enrollment = at least one completed node in user_progress.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const [progressResult, ratingsResult] = await Promise.all([
      supabase.from('user_progress').select('tree_id, completed_node_ids'),
      supabase.from('tree_ratings').select('tree_id, rating'),
    ])

    // Enrollment: count users who have ≥1 completed node per tree
    const enrollmentMap: Record<string, number> = {}
    for (const row of progressResult.data ?? []) {
      if ((row.completed_node_ids?.length ?? 0) > 0) {
        enrollmentMap[row.tree_id] = (enrollmentMap[row.tree_id] ?? 0) + 1
      }
    }

    // Ratings: compute avg and count per tree
    const ratingSums: Record<string, { sum: number; count: number }> = {}
    for (const row of ratingsResult.data ?? []) {
      if (!ratingSums[row.tree_id]) ratingSums[row.tree_id] = { sum: 0, count: 0 }
      ratingSums[row.tree_id].sum   += row.rating
      ratingSums[row.tree_id].count += 1
    }

    const allIds = new Set([
      ...Object.keys(enrollmentMap),
      ...Object.keys(ratingSums),
    ])

    const stats: Record<string, TreeStats> = {}
    for (const id of allIds) {
      const r = ratingSums[id]
      stats[id] = {
        enrolled:    enrollmentMap[id] ?? 0,
        avgRating:   r ? Math.round((r.sum / r.count) * 10) / 10 : null,
        ratingCount: r?.count ?? 0,
      }
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error('[trees/stats]', err)
    return NextResponse.json({})
  }
}
