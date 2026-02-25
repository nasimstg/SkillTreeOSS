import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard — The Skill-Tree',
  description: 'Global XP rankings and streak competitions. Coming soon.',
}

const PLANNED_FEATURES = [
  { icon: 'emoji_events', label: 'Weekly XP rankings' },
  { icon: 'local_fire_department', label: 'Streak battles' },
  { icon: 'groups', label: 'Community leagues' },
  { icon: 'workspace_premium', label: 'XP multipliers' },
  { icon: 'share', label: 'Shareable rank card' },
]

// Blurred placeholder rows
const PLACEHOLDER_ROWS = [
  { rank: 1, name: '██████████', xp: '4,850', streak: 32 },
  { rank: 2, name: '████████', xp: '4,200', streak: 21 },
  { rank: 3, name: '██████████████', xp: '3,780', streak: 18 },
  { rank: 4, name: '█████████', xp: '3,100', streak: 14 },
  { rank: 5, name: '████████', xp: '2,900', streak: 11 },
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col">

      <main className="flex-1">
        {/* Header */}
        <div className="relative border-b border-white/5 py-16 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-[0.04] pointer-events-none" />
          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Planned Feature
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Global Leaderboard
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
              Compete with learners worldwide. Rank up by completing nodes, maintaining streaks, and earning XP.
            </p>
            <a
              href="https://github.com/nasimstg/SkillTreeOSS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Follow progress on GitHub →
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-14 flex flex-col gap-10">

          {/* Blurred preview */}
          <div className="relative">
            <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden">
              {/* Fake tabs */}
              <div className="flex gap-2 p-4 border-b border-white/5">
                {['This Week', 'All Time', 'By Tree'].map((t, i) => (
                  <div key={t} className={`px-4 py-1.5 rounded-full text-xs font-medium border ${i === 0 ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}>{t}</div>
                ))}
              </div>

              {/* Blurred rows */}
              <div className="blur-sm select-none pointer-events-none">
                {PLACEHOLDER_ROWS.map((row, i) => (
                  <div
                    key={row.rank}
                    className={`flex items-center gap-4 px-5 py-4 ${i < PLACEHOLDER_ROWS.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <span className={`w-6 text-center text-sm font-black ${row.rank <= 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      #{row.rank}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-600">
                      —
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 font-mono text-sm">{row.name}</p>
                    </div>
                    <span className="text-xs text-orange-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">local_fire_department</span>
                      {row.streak}d
                    </span>
                    <span className="text-sm font-black text-slate-400">{row.xp} <span className="text-xs font-normal text-slate-600">XP</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlay lock */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background-dark/60 backdrop-blur-[2px] rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-3xl">lock</span>
              </div>
              <p className="text-white font-bold text-lg">Not live yet</p>
              <p className="text-slate-400 text-sm">The leaderboard is currently in development.</p>
            </div>
          </div>

          {/* What's planned */}
          <div>
            <h2 className="text-white font-bold text-xl mb-5">What&apos;s planned</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANNED_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-surface-dark rounded-xl border border-white/5 px-4 py-3">
                  <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                  <span className="text-sm text-slate-300">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/roadmap"
              className="flex items-center gap-2 bg-surface-dark hover:bg-white/5 border border-white/10 text-slate-300 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-lg">map</span>
              View Roadmap
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-background-dark font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              Start Learning Now
            </Link>
          </div>
        </div>
      </main>

    </div>
  )
}
