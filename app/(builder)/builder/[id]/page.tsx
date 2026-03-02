import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import type { SkillTree } from '@/types/tree'
import BuilderCanvas from '@/components/builder/BuilderCanvas'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title:       `Edit "${id}" — Skill Tree Builder`,
    description: `Edit and submit an updated version of the ${id} skill tree`,
  }
}

export default async function BuilderEditPage({ params }: Props) {
  const { id } = await params
  const treePath = join(process.cwd(), 'data', 'trees', `${id}.json`)

  if (!existsSync(treePath)) notFound()

  let tree: SkillTree
  try {
    tree = JSON.parse(readFileSync(treePath, 'utf8')) as SkillTree
  } catch {
    notFound()
  }

  return (
    <div className="w-full h-full">
      {/* Mobile unsupported overlay — only visible below md breakpoint */}
      <div className="md:hidden fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background-dark px-6 text-center overflow-hidden" style={{ touchAction: 'none' }}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-4xl">desktop_windows</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Builder needs a bigger screen</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            The visual tree builder is optimised for tablets and desktops.
            Open it on a device with at least a 768 px wide display.
          </p>
        </div>
        <Link
          href="/explore"
          className="h-11 px-6 rounded-full bg-primary text-black text-sm font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">explore</span>
          Browse skill trees
        </Link>
      </div>

      <BuilderCanvas existingTree={tree} />
    </div>
  )
}
