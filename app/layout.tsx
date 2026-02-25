import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Skill-Tree — Democratize Mastery',
  description:
    'Interactive, gamified learning paths built on the best free resources the internet has to offer. Level up your life, one node at a time.',
  keywords: ['skill tree', 'learning path', 'free resources', 'gamified learning', 'open source'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-background-dark text-slate-100 font-display antialiased">
        {children}
      </body>
    </html>
  )
}
