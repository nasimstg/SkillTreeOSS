import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — The Skill-Tree',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-xl mb-3">1. What We Collect</h2>
            <p className="mb-3">When you use The Skill-Tree, we collect only what is necessary to provide the service:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-300">Account data</strong> — email address, display name, and OAuth profile picture (if you sign in with GitHub or Google).</li>
              <li><strong className="text-slate-300">Progress data</strong> — which skill tree nodes you have marked as completed.</li>
              <li><strong className="text-slate-300">Resource feedback</strong> — your upvote or downvote on individual learning resources.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">2. What We Do NOT Collect</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>We do not collect payment information. The platform is free.</li>
              <li>We do not sell, rent, or share your data with third parties for advertising.</li>
              <li>We do not use tracking pixels, third-party analytics, or fingerprinting.</li>
              <li>We do not store passwords — authentication is handled by Supabase using OAuth or hashed credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>To display your learning progress across sessions and devices.</li>
              <li>To aggregate anonymous resource quality signals (upvotes/downvotes) to surface the best content.</li>
              <li>To send transactional emails (e.g. email confirmation) — no marketing emails.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">4. Data Storage</h2>
            <p>
              Your data is stored in Supabase (PostgreSQL) with Row-Level Security enabled.
              Only you can read and write your own progress and feedback rows.
              Supabase is hosted in the EU (Frankfurt) by default.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">5. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-300">Supabase</strong> — authentication and database. <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.</li>
              <li><strong className="text-slate-300">GitHub OAuth</strong> — if you choose to sign in with GitHub. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.</li>
              <li><strong className="text-slate-300">Google OAuth</strong> — if you choose to sign in with Google. <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">6. Your Rights</h2>
            <p className="mb-3">You can at any time:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-slate-300">Access</strong> your data via your Dashboard.</li>
              <li><strong className="text-slate-300">Delete</strong> your account and all associated data by opening an issue on GitHub. We will process the request within 30 days.</li>
              <li><strong className="text-slate-300">Export</strong> your progress data — contact us via GitHub.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">7. Cookies</h2>
            <p>
              We use only strictly necessary cookies for session management (Supabase auth token stored as an
              HTTP-only cookie). No third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">8. Contact</h2>
            <p>
              Privacy questions or data requests? Open an issue on{' '}
              <a href="https://github.com/nasimstg/SkillTreeOSS/issues" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
