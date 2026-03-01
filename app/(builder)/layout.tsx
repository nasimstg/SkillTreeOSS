import type { ReactNode } from 'react'

// Builder gets its own full-screen layout with NO standard Navbar.
// BuilderCanvas renders its own header (BuilderHeader) inside.
export default function BuilderRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#030712]">
      {children}
    </div>
  )
}
