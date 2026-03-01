'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSkillTreeStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { getLevelInfo } from '@/lib/utils'
import type { UserProfile } from '@/types/user'

// ─── constants ────────────────────────────────────────────────────────────────

const RING_SIZE   = 44          // px – total button footprint
const STROKE      = 3           // px – ring stroke width
const R           = (RING_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [ghUsername, setGhUsername] = useState<string | null>(null)

  const globalXp    = useSkillTreeStore((s) => s.globalXp)
  const setGlobalXp = useSkillTreeStore((s) => s.setGlobalXp)

  const { level, title, progress } = getLevelInfo(globalXp)
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const initials = (user.display_name ?? user.email).charAt(0).toUpperCase()

  // Fetch GitHub connection status
  useEffect(() => {
    fetch('/api/github/status')
      .then(r => r.json())
      .then(({ connected, username }: { connected: boolean; username: string | null }) => {
        if (connected) setGhUsername(username)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // Hydrate globalXp from DB once on mount so it's correct after a page refresh
  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then(({ totalCompleted }: { totalCompleted: number }) => {
        if (typeof totalCompleted === 'number') {
          setGlobalXp(totalCompleted * 50) // XP_PER_NODE = 50
        }
      })
      .catch(() => {/* keep localStorage value */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])           // re-fetch if the logged-in user changes

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div ref={menuRef} className="relative">

      {/* ── Avatar button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={open}
        className="relative w-11 h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {/* XP ring */}
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* track */}
          <circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={R}
            fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={STROKE}
          />
          {/* progress */}
          <circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={R}
            fill="none"
            stroke="#11d452"
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Avatar image / initials */}
        <div className="absolute inset-[4px] rounded-full overflow-hidden flex items-center justify-center bg-primary/15">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-sm leading-none">{initials}</span>
          )}
        </div>

        {/* Level badge */}
        <span className="absolute -bottom-0.5 -right-0.5 z-10 bg-primary text-background-dark text-[9px] font-black leading-none px-1.5 py-0.5 rounded-full pointer-events-none">
          Lv {level}
        </span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute top-full right-0 mt-2.5 w-58 min-w-[220px] bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50">

          {/* User header */}
          <div className="p-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary/15 shrink-0">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xs leading-none">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-snug">
                  {user.display_name ?? 'User'}
                </p>
                <p className="text-slate-500 text-[10px] truncate leading-snug">{user.email}</p>
              </div>
            </div>

            {/* XP bar + level label */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="text-primary text-[10px] font-bold shrink-0">{title}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5 flex flex-col gap-0.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[17px] leading-none text-slate-500">grid_view</span>
              Dashboard
            </Link>
            <Link
              href="/builder"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[17px] leading-none text-slate-500">build</span>
              Build a Tree
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[17px] leading-none text-slate-500">settings</span>
              Settings
            </Link>

            <div className="h-px bg-white/[0.06] my-0.5" />

            {/* GitHub connection */}
            {ghUsername ? (
              <div className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-[17px] leading-none text-primary">link</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs leading-tight">GitHub connected</p>
                  <p className="text-primary text-[10px] truncate">@{ghUsername}</p>
                </div>
                <button
                  onClick={() => fetch('/api/github/disconnect', { method: 'DELETE' }).then(() => setGhUsername(null))}
                  className="text-slate-600 hover:text-red-400 transition-colors text-[10px]"
                  title="Disconnect GitHub"
                >
                  <span className="material-symbols-outlined text-sm">link_off</span>
                </button>
              </div>
            ) : (
              <a
                href="/api/github/connect"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] leading-none text-slate-500">link</span>
                Connect GitHub
              </a>
            )}

            <div className="h-px bg-white/[0.06] my-0.5" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-[17px] leading-none">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

interface NavbarProps {
  variant?: 'landing' | 'canvas'
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useSkillTreeStore((s) => s.user)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const headerCls = variant === 'canvas'
    ? 'sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background-dark/95 backdrop-blur-md'
    : 'sticky top-0 z-50 w-full border-b border-primary/20 bg-bg-landing/80 backdrop-blur-md'

  return (
    <header className={headerCls}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary transition group-hover:bg-primary/30">
            <span className="material-symbols-outlined text-xl">account_tree</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SkilleTreeOSS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 justify-end items-center gap-8">
          <Link href="/explore" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
            Explore Trees
          </Link>
          <Link href="/contribute" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
            Contribute
          </Link>
          <Link href="/builder" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
            Build
          </Link>
          <a
            href="https://github.com/nasimstg/SkillTreeOSS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
          >
            GitHub
          </a>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-background-dark font-bold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Get Started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-slate-300 hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">
            {mobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${variant === 'canvas' ? 'border-white/[0.06] bg-background-dark/98' : 'border-primary/10 bg-bg-landing/95'} backdrop-blur-md px-6 py-4 flex flex-col gap-4`}>
          <Link href="/explore" className="text-sm font-medium text-slate-300 hover:text-primary">
            Explore Trees
          </Link>
          <Link href="/contribute" className="text-sm font-medium text-slate-300 hover:text-primary">
            Contribute
          </Link>
          <a
            href="https://github.com/nasimstg/SkillTreeOSS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-300 hover:text-primary"
          >
            GitHub
          </a>

          {user ? (
            <>
              {/* Compact user row */}
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary/15 shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-xs">
                      {(user.display_name ?? user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user.display_name ?? 'User'}</p>
                  <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-primary text-background-dark font-bold text-sm px-4 py-2 rounded-lg w-fit"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-red-400 hover:text-red-300 text-left"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-primary">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-primary text-background-dark font-bold text-sm px-4 py-2 rounded-lg w-fit"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
