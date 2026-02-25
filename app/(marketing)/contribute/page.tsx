import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribute — The Skill-Tree',
  description: 'Add your own skill tree. All trees are open-source JSON files contributed via GitHub pull requests.',
}

const STEPS = [
  {
    icon: 'fork_right',
    title: 'Fork the repository',
    description: 'Fork the Skill-Tree GitHub repo and clone it locally.',
    code: 'git clone https://github.com/nasimstg/SkillTreeOSS.git',
  },
  {
    icon: 'draft',
    title: 'Create a tree JSON file',
    description: 'Add a new file at data/trees/your-tree-id.json following the schema.',
    code: 'cp data/trees/full-stack-dev.json data/trees/your-tree.json',
  },
  {
    icon: 'check_circle',
    title: 'Validate the schema',
    description: 'Run the validator to make sure your JSON matches the contract.',
    code: 'npm run validate',
  },
  {
    icon: 'merge',
    title: 'Open a pull request',
    description: 'Push your branch and open a PR. CI will auto-validate your tree.',
    code: 'git push origin feat/my-skill-tree',
  },
]

const RULES = [
  'All linked resources must be **free** and publicly accessible.',
  'Each node must have exactly **one** primary resource.',
  'Resources should be high quality — prefer established creators and platforms.',
  'Node positions (`x`, `y`) should form a readable left-to-right or top-to-bottom flow.',
  'The `requires` array must only reference IDs that exist in the same tree.',
  'Tree IDs and node IDs must be lowercase, hyphenated (e.g. `full-stack-dev`, `html-basics`).',
]

export default function ContributePage() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col">

      <main className="flex-1">
        {/* Hero */}
        <div className="relative py-20 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-[0.04] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-5">
              <span className="material-symbols-outlined text-sm">volunteer_activism</span>
              Open Source
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-5">
              Build the knowledge graph,{' '}
              <span className="text-primary">together</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              Every skill tree is a JSON file in the GitHub repository. Anyone can add a tree for any skill —
              coding, painting, gardening, music production — via a pull request.
            </p>
            <a
              href="https://github.com/nasimstg/SkillTreeOSS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-background-dark font-bold px-6 py-3 rounded-xl transition-colors"
              style={{ boxShadow: '0 0 20px rgba(17,212,82,0.25)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 space-y-16">

          {/* Steps */}
          <section>
            <h2 className="text-2xl font-black text-white mb-8">How to contribute a tree</h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-5 bg-surface-dark rounded-2xl border border-white/5 p-6">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mt-0.5">
                    <span className="material-symbols-outlined text-primary text-xl">{step.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-primary/60 uppercase tracking-widest">Step {i + 1}</span>
                    </div>
                    <h3 className="text-white font-bold mb-1">{step.title}</h3>
                    <p className="text-slate-400 text-sm mb-3">{step.description}</p>
                    <code className="block bg-background-dark border border-white/5 rounded-lg px-4 py-2.5 text-xs text-primary font-mono overflow-x-auto">
                      {step.code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Content rules */}
          <section>
            <h2 className="text-2xl font-black text-white mb-2">Content guidelines</h2>
            <p className="text-slate-400 text-sm mb-6">
              Every PR is reviewed against these rules before merging. CI also validates the JSON schema automatically.
            </p>
            <div className="bg-surface-dark rounded-2xl border border-white/5 p-6">
              <ul className="space-y-3">
                {RULES.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-400">
                    <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">check</span>
                    <span dangerouslySetInnerHTML={{
                      __html: rule.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Schema snippet */}
          <section>
            <h2 className="text-2xl font-black text-white mb-2">Minimal tree template</h2>
            <p className="text-slate-400 text-sm mb-5">
              Full schema at <code className="text-primary text-xs">data/schema.json</code>.
              See <Link href="/tree/full-stack-dev" className="text-primary hover:underline">full-stack-dev</Link> for a real 20-node example.
            </p>
            <pre className="bg-background-dark border border-white/5 rounded-2xl p-6 text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">
              {`{
  "treeId": "your-tree-id",
  "title": "Your Skill Title",
  "category": "Technology",
  "difficulty": "beginner",
  "description": "A short description of this path.",
  "version": "1.0",
  "estimatedMonths": 2,
  "totalNodes": 5,
  "icon": "palette",
  "nodes": [
    {
      "id": "first-node",
      "label": "Getting Started",
      "description": "What this node teaches.",
      "icon": "start",
      "zone": "Foundation",
      "resource": {
        "title": "Resource title",
        "url": "https://youtube.com/watch?v=...",
        "type": "video",
        "author": "Creator Name",
        "estimatedHours": 1
      },
      "position": { "x": 0, "y": 0 },
      "requires": []
    }
  ],
  "edges": []
}`}
            </pre>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-card-dark to-background-dark border border-primary/20 p-8 text-center">
            <span className="material-symbols-outlined text-primary text-4xl mb-4 block">rocket_launch</span>
            <h3 className="text-xl font-black text-white mb-2">Ready to contribute?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Any skill. Any topic. If it can be learned with free resources, it belongs here.
            </p>
            <a
              href="https://github.com/nasimstg/SkillTreeOSS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-background-dark font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Open a Pull Request
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </a>
          </div>
        </div>
      </main>

    </div>
  )
}
