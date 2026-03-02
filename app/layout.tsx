import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/auth/AuthProvider'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import Script from 'next/script'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'SkillTreeOSS — Democratize Mastery',
  description:
    'Interactive, gamified learning paths built on the best free resources the internet has to offer. Level up your life, one node at a time.',
  keywords: ['skill tree', 'learning path', 'free resources', 'gamified learning', 'open source'],
  // PWA / Apple web-app meta
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SkillTree',
  },
  icons: {
    icon: '/assets/skilltreeoss.png',
    apple: '/assets/skilltreeoss.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
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
        {/*
          strategy="beforeInteractive" — runs before React hydrates, injected into <head> by Next.js.
          This is the only way to reliably capture `beforeinstallprompt`, which fires very early.
          A plain <script> inside <head> or a default-strategy <Script> both run too late.
        */}
        <Script
          id="pwa-capture"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__pwaPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
        <AuthProvider>{children}</AuthProvider>
        <InstallPrompt />
      </body>
    </html>
  )
}
