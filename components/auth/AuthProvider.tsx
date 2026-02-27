'use client'

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useSkillTreeStore } from '@/lib/store'
import type { UserProfile } from '@/types/user'

function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email ?? '',
    display_name:
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    created_at: user.created_at,
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useSkillTreeStore((s) => s.setUser)

  useEffect(() => {
    const supabase = createClient()

    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? toUserProfile(session.user) : null)
    })

    // Keep store in sync with Supabase auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUserProfile(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return <>{children}</>
}
