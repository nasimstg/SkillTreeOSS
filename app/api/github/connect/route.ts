import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SignJWT } from 'jose'

// Initiates the GitHub OAuth flow for contribution access (repo scope).
// This is separate from Supabase GitHub auth — it obtains a token that
// lets us create branches and PRs on behalf of the user.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const appUrl   = process.env.APP_URL ?? 'http://localhost:3000'

  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID not configured' }, { status: 500 })
  }

  // Sign a short-lived JWT carrying the user_id so the callback can verify it
  const secret = new TextEncoder().encode(process.env.GITHUB_OAUTH_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? 'fallback-secret')
  const state = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(secret)

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: `${appUrl}/api/github/callback`,
    scope:        'repo',
    state,
  })

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
  )
}
