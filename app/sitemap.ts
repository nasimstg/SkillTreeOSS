import type { MetadataRoute } from 'next'
import { readdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://skilltreeoss.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contribute`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic tree pages — read slugs from the data/trees directory
  let treeSlugs: string[] = []
  try {
    treeSlugs = readdirSync(join(process.cwd(), 'data', 'trees'))
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  } catch {
    // ignore — sitemap still works with only static pages
  }

  const treePages: MetadataRoute.Sitemap = treeSlugs.map(slug => ({
    url: `${BASE_URL}/tree/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...treePages]
}
