'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSkillTreeStore } from '@/lib/store'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useSkillTreeStore((s) => s.user)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-bg-landing/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary transition group-hover:bg-primary/30">
            <span className="material-symbols-outlined text-xl">account_tree</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">The Skill-Tree</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 justify-end items-center gap-8">
          <Link
            href="/explore"
            className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
          >
            Explore Trees
          </Link>
          <Link
            href="/contribute"
            className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
          >
            Contribute
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
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-background-dark font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
              >
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
        <div className="md:hidden border-t border-primary/10 bg-bg-landing/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4">
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
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-primary"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-primary text-background-dark font-bold text-sm px-4 py-2 rounded-lg w-fit"
          >
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
