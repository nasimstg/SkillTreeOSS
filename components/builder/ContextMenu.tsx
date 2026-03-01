'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export interface ContextMenuItem {
  label?:    string
  icon?:     string
  shortcut?: string
  onClick?:  () => void
  danger?:   boolean
  disabled?: boolean
  divider?:  boolean
}

interface Props {
  x:       number
  y:       number
  items:   ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Dismiss on outside click or Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Clamp to viewport so menu never clips off-screen
  const MENU_W = 196
  const ITEM_H = 34
  const menuH  = items.filter(i => !i.divider).length * ITEM_H
               + items.filter(i =>  i.divider).length * 13
               + 12
  const cx = x + MENU_W > window.innerWidth  - 8 ? x - MENU_W : x
  const cy = y + menuH  > window.innerHeight - 8 ? y - menuH  : y

  return (
    <div ref={ref} className="fixed z-[9999] pointer-events-auto" style={{ left: cx, top: cy }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: -6 }}
        animate={{ opacity: 1, scale: 1,    y:  0 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="py-1.5 rounded-xl overflow-hidden"
        style={{
          minWidth:          MENU_W,
          background:        'rgba(7, 10, 20, 0.97)',
          backdropFilter:    'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:            '1px solid rgba(255,255,255,0.09)',
          boxShadow:         '0 20px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)',
        }}
      >
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} className="my-1.5 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ) : (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { item.onClick?.(); onClose() }}
              className="w-full flex items-center gap-2.5 px-3 py-[7px] text-[12.5px] font-medium transition-all duration-75"
              style={{
                color:  item.disabled ? '#374151' : item.danger ? '#f87171' : '#cbd5e1',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (item.disabled) return
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = item.danger ? 'rgba(248,113,113,0.09)' : 'rgba(255,255,255,0.06)'
                el.style.color      = item.danger ? '#fca5a5' : 'white'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = ''
                el.style.color      = item.disabled ? '#374151' : item.danger ? '#f87171' : '#cbd5e1'
              }}
            >
              {item.icon && (
                <span className="material-symbols-outlined text-[15px] flex-shrink-0 opacity-75">
                  {item.icon}
                </span>
              )}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <kbd className="text-[10px] font-mono opacity-35 ml-3">{item.shortcut}</kbd>
              )}
            </button>
          )
        )}
      </motion.div>
    </div>
  )
}
