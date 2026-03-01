import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
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
      <BuilderCanvas existingTree={tree} />
    </div>
  )
}
