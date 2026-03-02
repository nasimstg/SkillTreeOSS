import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SkillTreeOSS — Democratize Mastery',
    short_name: 'SkillTree',
    description:
      'Interactive, gamified learning paths built on the best free resources the internet has to offer.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f0f0f',
    theme_color: '#11d452',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/assets/skilltreeoss.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/skilltreeoss.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/skilltreeoss.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Explore Trees',
        short_name: 'Explore',
        description: 'Browse available skill trees',
        url: '/explore',
        icons: [{ src: '/assets/skilltreeoss.png', sizes: '96x96' }],
      },
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your learning progress',
        url: '/dashboard',
        icons: [{ src: '/assets/skilltreeoss.png', sizes: '96x96' }],
      },
    ],
  }
}
