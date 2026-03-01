'use client'

import Link from 'next/link'
import { UserMenu } from '@/components/layout/Navbar'
import { useSkillTreeStore } from '@/lib/store'

interface Props {
  treeId: string
}

export function ViewerHeader({ treeId }: Props) {
  const user = useSkillTreeStore(s => s.user)

  return (
    <>
      {/* Gradient fade — canvas shows through at the bottom */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,15,15,0.80) 0%, rgba(15,15,15,0.35) 65%, transparent 100%)',
          height: 64,
        }}
      />

      <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5 z-40">

        {/* ── Left — Logo + back ─────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-7 rounded bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">account_tree</span>
            </div>
            <span className="text-base font-bold tracking-tight text-white hidden sm:block">
              SkillTreeOSS
            </span>
          </Link>
          <div className="w-px h-5 bg-white/10 hidden sm:block" />
          <Link
            href="/explore"
            className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:flex items-center gap-1 text-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Explore
          </Link>
        </div>

        {/* ── Right — Edit + UserMenu ────────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Edit this tree */}
          <Link
            href={`/builder/${treeId}`}
            className="h-8 px-3.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            <span className="hidden sm:inline">Edit Tree</span>
          </Link>

          {user && (
            <>
              <div className="w-px h-5 bg-white/10" />
              <UserMenu user={user} />
            </>
          )}
        </div>
      </header>
    </>
  )
}
