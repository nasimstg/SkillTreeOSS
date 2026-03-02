export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] overflow-hidden">
      {children}
    </div>
  )
}
