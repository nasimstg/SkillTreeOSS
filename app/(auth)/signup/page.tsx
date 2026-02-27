'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'github' | 'google') => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-grid-dark opacity-[0.03] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary/30 transition-colors">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SkilleTreeOSS</span>
          </Link>
        </div>

        <div className="bg-surface-dark rounded-2xl border border-white/10 p-8 shadow-2xl">
          {success ? (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">mark_email_read</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We sent a confirmation link to{' '}
                  <span className="text-white font-medium">{email}</span>.
                  Click it to activate your account.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-primary hover:underline font-medium"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-slate-400 text-sm mb-7">Start your skill tree journey — free forever</p>

              {/* OAuth buttons */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Sign up with GitHub
                </button>

                <button
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-600 font-medium">or with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full h-11 rounded-xl bg-background-dark border border-white/10 px-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-11 rounded-xl bg-background-dark border border-white/10 px-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                    className="w-full h-11 rounded-xl bg-background-dark border border-white/10 px-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 text-background-dark font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{ boxShadow: '0 0 20px rgba(17,212,82,0.2)' }}
                >
                  {loading ? 'Creating account…' : 'Create Free Account'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Free forever · Open source · No tracking
        </p>
      </div>
    </div>
  )
}
