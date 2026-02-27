import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Roadmap — SkilleTreeOSS',
  description: 'See what\'s planned, in progress, and shipped for SkilleTreeOSS platform.',
}

const SHIPPED = [
  { icon: 'account_tree', title: 'Skill Tree Canvas', desc: 'Interactive React Flow canvas with 4 visual themes — World Map, RPG, Terminal, Neural.' },
  { icon: 'person', title: 'Authentication', desc: 'Sign in with GitHub, Google, or email & password via Supabase.' },
  { icon: 'dashboard', title: 'User Dashboard', desc: 'Track progress, XP, streaks, and recent node unlocks across all active trees.' },
  { icon: 'check_circle', title: 'Progress Sync', desc: 'Optimistic UI updates synced to Supabase in real time with rollback on failure.' },
  { icon: 'schema', title: 'Open JSON Schema', desc: 'Contributor-friendly tree schema with CI validation on every pull request.' },
  { icon: 'thumb_up', title: 'Resource Voting', desc: 'Up/downvote individual learning resources to surface the best content.' },
]

const IN_PROGRESS = [
  { icon: 'explore', title: 'More Skill Trees', desc: 'Growing the library beyond Full-Stack Dev — art, music, science, languages.' },
  { icon: 'search', title: 'Search & Filtering', desc: 'Filter trees by category, difficulty, and estimated time on the Explore page.' },
  { icon: 'groups', title: 'Discord Community', desc: 'A server for learners, contributors, and tree maintainers.' },
]

const PLANNED = [
  { icon: 'leaderboard', title: 'Global Leaderboard', desc: 'Weekly XP rankings, streak competitions, and community leagues.' },
  { icon: 'share', title: 'Skill Resume Export', desc: 'Generate a shareable "skill resume" showing your completed paths and XP.' },
  { icon: 'edit_note', title: 'In-Browser Tree Editor', desc: 'Create and preview skill trees without touching JSON directly.' },
  { icon: 'article', title: 'Blog', desc: 'Learning science deep dives, contributor spotlights, and release notes.' },
  { icon: 'map', title: 'Learning Paths', desc: 'Curated multi-tree journeys (e.g. "Become a Full-Stack Developer in 12 months").' },
  { icon: 'notifications', title: 'Streak Reminders', desc: 'Optional email/push nudges to keep your daily learning streak alive.' },
  { icon: 'phone_iphone', title: 'Mobile App', desc: 'Native iOS & Android app for learning on the go.' },
]

function RoadmapCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 bg-surface-dark rounded-xl border border-white/5 p-5">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col">

      <main className="flex-1">
        {/* Header */}
        <div className="relative border-b border-white/5 py-16 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-[0.04] pointer-events-none" />
          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-5">
              <span className="material-symbols-outlined text-sm">map</span>
              Public Roadmap
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              What we&apos;re building
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              SkilleTreeOSS is open source. Suggest features or vote on ideas by opening a GitHub Discussion.
            </p>
            <a
              href="https://github.com/nasimstg/SkillTreeOSS/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-primary hover:underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              Suggest a feature on GitHub →
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Shipped */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <h2 className="text-white font-black text-lg">Shipped</h2>
              <span className="ml-auto text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                {SHIPPED.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {SHIPPED.map((item) => (
                <RoadmapCard key={item.title} {...item} />
              ))}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-white font-black text-lg">In Progress</h2>
              <span className="ml-auto text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                {IN_PROGRESS.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {IN_PROGRESS.map((item) => (
                <RoadmapCard key={item.title} {...item} />
              ))}
            </div>
          </div>

          {/* Planned */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              <h2 className="text-white font-black text-lg">Planned</h2>
              <span className="ml-auto text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {PLANNED.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {PLANNED.map((item) => (
                <RoadmapCard key={item.title} {...item} />
              ))}
            </div>
          </div>

        </div>
      </main>

    </div>
  )
}
