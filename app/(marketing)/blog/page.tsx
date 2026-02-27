import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — SkilleTreeOSS',
  description: 'Articles on learning science, contributor spotlights, and platform updates. Coming soon.',
}

const UPCOMING_TOPICS = [
  { icon: 'psychology', label: 'Learning science', desc: 'Why skill trees work better than linear courses.' },
  { icon: 'volunteer_activism', label: 'Contributor spotlights', desc: 'Meet the people building the knowledge graph.' },
  { icon: 'new_releases', label: 'Tree announcements', desc: 'Deep dives into every new skill tree we ship.' },
  { icon: 'tips_and_updates', label: 'Platform updates', desc: 'Behind the scenes on new features and design decisions.' },
]

// Blurred placeholder post cards
const PLACEHOLDER_POSTS = [
  { tag: 'Learning Science', title: 'Why Skill Trees Beat Traditional Courses' },
  { tag: 'Tutorial', title: 'How to Contribute Your First Tree in 30 Minutes' },
  { tag: 'Announcement', title: 'Launching the Full-Stack Web Developer Tree' },
]

export default function BlogPage() {
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
              SkilleTreeOSS Blog
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
              Articles on learning science, contributor spotlights, tree announcements, and platform updates.
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

        <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-14 flex flex-col gap-12">

          {/* Blurred post preview */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 blur-sm select-none pointer-events-none">
              {PLACEHOLDER_POSTS.map((post, i) => (
                <div
                  key={i}
                  className="flex flex-col bg-surface-dark rounded-2xl border border-white/5 overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-br from-card-dark to-background-dark border-b border-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/20 text-7xl">article</span>
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{post.tag}</div>
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-4 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2 mt-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background-dark/60 backdrop-blur-[2px] rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-3xl">edit_note</span>
              </div>
              <p className="text-white font-bold text-lg">No posts yet</p>
              <p className="text-slate-400 text-sm">The blog is currently being written.</p>
            </div>
          </div>

          {/* What we'll write about */}
          <div>
            <h2 className="text-white font-bold text-xl mb-5">Topics we&apos;ll cover</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {UPCOMING_TOPICS.map((topic) => (
                <div key={topic.label} className="flex gap-4 bg-surface-dark rounded-xl border border-white/5 p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">{topic.icon}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-0.5">{topic.label}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{topic.desc}</p>
                  </div>
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
