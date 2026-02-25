import Link from 'next/link'

const FEATURED_TREES = [
  {
    treeId: 'full-stack-dev',
    title: 'Full-Stack Web Developer',
    category: 'Technology',
    description: 'Master the MERN stack, SQL databases, and modern frontend frameworks in this comprehensive path.',
    icon: 'terminal',
    iconBg: 'bg-accent-blue/20 text-accent-blue',
    nodes: 20,
    duration: '~6mo',
    difficulty: 'HARD',
    difficultyColor: 'text-red-400 border-red-400/30',
    progressColor: 'bg-accent-blue',
    bgPattern: 'linear-gradient(45deg, #102216 25%, transparent 25%, transparent 75%, #102216 75%, #102216), linear-gradient(45deg, #102216 25%, transparent 25%, transparent 75%, #102216 75%, #102216)',
  },
  {
    treeId: 'botanist',
    title: 'Botanist',
    category: 'Science',
    description: 'Learn plant identification, soil chemistry, and sustainable gardening practices from the ground up.',
    icon: 'eco',
    iconBg: 'bg-primary/20 text-primary',
    nodes: 84,
    duration: '~3mo',
    difficulty: 'MEDIUM',
    difficultyColor: 'text-yellow-400 border-yellow-400/30',
    progressColor: 'bg-primary',
    bgPattern: 'radial-gradient(#1e3b28 1px, transparent 1px)',
  },
  {
    treeId: 'urban-sketching',
    title: 'Urban Sketching',
    category: 'Arts & Crafts',
    description: 'Capture city life with perspective drawing, quick shading techniques, and composition.',
    icon: 'brush',
    iconBg: 'bg-purple-500/20 text-purple-400',
    nodes: 45,
    duration: '~1mo',
    difficulty: 'EASY',
    difficultyColor: 'text-primary border-primary/30',
    progressColor: 'bg-purple-400',
    bgPattern: 'repeating-linear-gradient(-45deg, #1e3b28 0, #1e3b28 1px, transparent 0, transparent 50%)',
  },
]

const STATS = [
  { value: '12k+', label: 'Active Players', color: 'text-primary' },
  { value: '850+', label: 'Skill Trees', color: 'text-accent-blue' },
  { value: '54k', label: 'Nodes Unlocked', color: 'text-purple-400' },
  { value: '100%', label: 'Open Source', color: 'text-orange-400' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-landing">

      <main className="flex-grow">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden py-24 lg:py-36 px-6">
          {/* Background: radial gradient + dot grid */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-bg-landing to-bg-landing" />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #11d452 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              v2.0 is now live
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-gradient-primary">
              The Democratization <br />of Mastery.
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
              Level up your life with open-source, community-driven skill trees. Learn anything,
              track your progress, and master your craft like an RPG character.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/explore"
                className="group relative flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-background-dark shadow-[0_0_20px_-5px_rgba(17,212,82,0.4)] transition-all hover:shadow-[0_0_30px_-5px_rgba(17,212,82,0.6)] hover:-translate-y-0.5"
              >
                Start Learning (Free)
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <a
                href="https://github.com/nasimstg/SkillTreeOSS"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-transparent px-8 text-base font-bold text-white transition-all hover:bg-primary/10 hover:border-primary"
              >
                <span className="material-symbols-outlined">code</span>
                View on GitHub
              </a>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                Open Source
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">group</span>
                Community Driven
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">trophy</span>
                Gamified Learning
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Trees Section ── */}
        <section className="py-16 px-6 bg-background-dark">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Featured Skill Trees
                </h2>
                <p className="text-slate-400 mt-1">Start your journey with these popular paths</p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:flex items-center gap-1 text-primary hover:text-primary-dark font-medium transition-colors text-sm"
              >
                View all trees
                <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURED_TREES.map((tree) => (
                <div
                  key={tree.treeId}
                  className="group relative flex flex-col overflow-hidden rounded-xl bg-card-dark border border-white/5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:glow-card"
                >
                  {/* Card header background pattern */}
                  <div
                    className="h-32 w-full relative overflow-hidden"
                    style={{
                      backgroundImage: tree.bgPattern,
                      backgroundSize: '20px 20px',
                      opacity: 0.3,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent" />
                    <div
                      className={`absolute top-4 left-4 p-2 rounded-lg border border-primary/20 backdrop-blur-sm ${tree.iconBg}`}
                    >
                      <span className="material-symbols-outlined">{tree.icon}</span>
                    </div>
                    {/* Difficulty badge */}
                    <div
                      className={`absolute top-4 right-4 bg-background-dark/80 backdrop-blur px-2 py-0.5 rounded text-xs font-bold border ${tree.difficultyColor}`}
                    >
                      {tree.difficulty}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6 pt-3">
                    <p className="text-[10px] font-bold text-accent-text uppercase tracking-wider mb-1">
                      {tree.category}
                    </p>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {tree.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {tree.description}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="w-full bg-background-dark rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`${tree.progressColor} h-full rounded-full`}
                          style={{ width: '0%' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">hub</span>
                          <span>{tree.nodes} Nodes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          <span>{tree.duration}</span>
                        </div>
                      </div>
                      <Link
                        href={`/tree/${tree.treeId}`}
                        className="block w-full text-center rounded-lg bg-primary/10 border border-primary/20 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-background-dark"
                      >
                        Start Quest
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium transition-colors"
              >
                View all trees
                <span className="material-symbols-outlined text-lg">arrow_right_alt</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats Section (from Landing Page 2) ── */}
        <section className="py-16 px-6 border-y border-dashed border-white/10 bg-bg-landing">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className={`text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 px-6 bg-background-dark">
          <div className="mx-auto max-w-[1280px]">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white">How It Works</h2>
              <p className="text-slate-400 mt-2">Three steps to mastery</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: 'travel_explore',
                  title: 'Pick Your Quest',
                  desc: 'Browse community-built skill trees across any discipline — from coding to botany to urban sketching.',
                },
                {
                  step: '02',
                  icon: 'play_lesson',
                  title: 'Learn & Unlock',
                  desc: 'Each node links to the single best free resource. Complete it, hit Unlock, and watch the next path light up.',
                },
                {
                  step: '03',
                  icon: 'workspace_premium',
                  title: 'Share Your Mastery',
                  desc: 'Generate a stunning visual skill resume to share on LinkedIn, GitHub, or wherever the world can see you.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative p-8 rounded-xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-colors"
                >
                  <div className="absolute top-6 right-6 text-4xl font-black text-white/5">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}
