import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ connected: false, username: null })
  }

  const { data } = await supabase
    .from('github_connections')
    .select('github_username')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    connected: !!data,
    username:  data?.github_username ?? null,
  })
}
