import Navbar from '@/components/layout/Navbar'

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      {/* Canvas fills all remaining vertical space */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
