import type { Metadata } from 'next'

// Auth pages are not indexed — no value for search engines
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
