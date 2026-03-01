import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { jwtVerify } from 'jose'
import { Octokit } from '@octokit/rest'

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?github=error&reason=missing_params`)
  }

  // Verify state JWT to get user_id
  const secret = new TextEncoder().encode(
    process.env.GITHUB_OAUTH_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? 'fallback-secret'
  )
  let userId: string
  try {
    const { payload } = await jwtVerify(state, secret)
    userId = payload.uid as string
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?github=error&reason=invalid_state`)
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/settings?github=error&reason=token_exchange_failed`)
  }

  // Get GitHub username
  const octokit = new Octokit({ auth: tokenData.access_token })
  const { data: ghUser } = await octokit.rest.users.getAuthenticated()

  // Upsert connection in Supabase (server-side, no RLS bypass needed — use service role)
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('github_connections').upsert({
    user_id:             userId,
    github_username:     ghUser.login,
    github_access_token: tokenData.access_token,
  })

  if (error) {
    console.error('Failed to store github connection:', error)
    return NextResponse.redirect(`${appUrl}/settings?github=error&reason=db_error`)
  }

  return NextResponse.redirect(`${appUrl}/settings?github=connected`)
}
