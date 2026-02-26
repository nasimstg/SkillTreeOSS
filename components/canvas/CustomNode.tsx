'use client'

import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeStatus, CanvasView } from '@/types/tree'

export interface SkillNodeData {
  label: string
  description: string
  icon: string
  zone: string
  status: NodeStatus
  view: CanvasView
  animationState?: 'completing' | 'unlocking'
  highlightRequired?: boolean   // node must be completed to unlock selected locked node
}

// ─── Shared animation shell ───────────────────────────────────────────────────
// Wraps only the icon element so Handle components stay untransformed.

function NodeAnimShell({
  selected,
  animationState,
  ringShape = 'rounded-xl',
  highlightRequired = false,
  children,
}: {
  selected: boolean
  animationState?: 'completing' | 'unlocking'
  ringShape?: string
  highlightRequired?: boolean
  children: React.ReactNode
}) {
  const isCompleting = animationState === 'completing'
  const isUnlocking = animationState === 'unlocking'

  return (
    <motion.div
      className="relative"
      animate={
        isCompleting
          ? { scale: [1, 0.87, 1.33, 0.93, 1.08, 0.98, 1] }
          : isUnlocking
            ? { scale: [0.70, 1.20, 0.95, 1.05, 1] }
            : selected
              ? { scale: 1.06 }
              : { scale: 1 }
      }
      transition={
        isCompleting
          ? { duration: 0.62, times: [0, 0.08, 0.30, 0.50, 0.68, 0.85, 1], ease: 'easeOut' }
          : isUnlocking
            ? { duration: 0.58, times: [0, 0.30, 0.55, 0.78, 1], ease: 'easeOut' }
            : { type: 'spring' as const, stiffness: 500, damping: 28 }
      }
      whileTap={{ scale: 0.91 }}
    >
      {children}

      {/* ── Selection ring ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && !animationState && (
          <motion.div
            key="sel-ring"
            className={`absolute -inset-[7px] ${ringShape} border-2 border-primary/55 pointer-events-none`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.16 }}
          />
        )}
      </AnimatePresence>

      {/* ── Required-prerequisite amber ring ────────────────────────────── */}
      <AnimatePresence>
        {highlightRequired && !animationState && (
          <motion.div
            key="req-ring"
            className={`absolute -inset-[8px] ${ringShape} border-2 border-amber-400/75 pointer-events-none`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* ── Completion burst: white flash + two expanding rings ─────────── */}
      <AnimatePresence>
        {isCompleting && (
          <>
            {/* Instant white flash */}
            <motion.div
              key="flash"
              className={`absolute inset-0 ${ringShape} bg-white pointer-events-none`}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            {/* Fast burst ring */}
            <motion.div
              key="burst-1"
              className={`absolute -inset-[6px] ${ringShape} border-2 border-primary pointer-events-none`}
              initial={{ opacity: 0.9, scale: 0.72 }}
              animate={{ opacity: 0, scale: 1.65 }}
              exit={{}}
              transition={{ duration: 0.50, ease: 'easeOut' }}
            />
            {/* Slower trailing ring */}
            <motion.div
              key="burst-2"
              className={`absolute -inset-[6px] ${ringShape} border border-primary/50 pointer-events-none`}
              initial={{ opacity: 0.7, scale: 0.72 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{}}
              transition={{ duration: 0.72, ease: 'easeOut', delay: 0.07 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Unlock ripple: two expanding blue rings ──────────────────────── */}
      <AnimatePresence>
        {isUnlocking && (
          <>
            <motion.div
              key="unlock-1"
              className={`absolute -inset-[6px] ${ringShape} border-2 border-accent-blue/90 pointer-events-none`}
              initial={{ opacity: 1, scale: 0.55 }}
              animate={{ opacity: 0, scale: 1.9 }}
              exit={{}}
              transition={{ duration: 0.60, ease: 'easeOut' }}
            />
            <motion.div
              key="unlock-2"
              className={`absolute -inset-[6px] ${ringShape} border border-accent-blue/50 pointer-events-none`}
              initial={{ opacity: 0.75, scale: 0.55 }}
              animate={{ opacity: 0, scale: 2.5 }}
              exit={{}}
              transition={{ duration: 0.90, ease: 'easeOut', delay: 0.10 }}
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── World Map Landmark Node ──────────────────────────────────────────────────

function WorldMapNode({ data, selected, sourcePosition, targetPosition }: NodeProps) {
  const d = data as unknown as SkillNodeData
  const { label, icon, status, animationState, highlightRequired } = d

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center gap-2 cursor-pointer group">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-full" highlightRequired={highlightRequired}>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary transition-transform group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 0 16px rgba(17,212,82,0.4))' }}
            >
              <span className="material-symbols-outlined text-4xl text-primary">{icon}</span>
            </div>
            {/* Mastered badge */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-surface-dark border-2 border-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary text-[16px]">workspace_premium</span>
            </div>
          </div>
        </NodeAnimShell>
        <div className="text-center mt-1">
          <p className="text-white font-black uppercase text-xs tracking-tight">{label}</p>
          <p className="text-primary text-[9px] font-bold uppercase tracking-wider">Mastered</p>
        </div>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div >
    )
  }

  if (status === 'available') {
    return (
      <div className="flex flex-col items-center gap-2 cursor-pointer group">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-xl" highlightRequired={highlightRequired}>
          <div className="relative">
            <div className="absolute inset-0 -m-2 rounded-xl bg-accent-blue/15 blur-sm" />
            <div className="w-24 h-24 bg-accent-blue/10 rounded-[1.5rem] rotate-45 flex items-center justify-center border-4 border-accent-blue transition-transform group-hover:scale-110 glow-blue">
              <span className="material-symbols-outlined text-4xl text-accent-blue -rotate-45">{icon}</span>
            </div>
            {/* Quest badge */}
            <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue text-white shadow-xl animate-bounce z-10">
              <span className="material-symbols-outlined text-[16px]">explore</span>
            </div>
          </div>
        </NodeAnimShell>
        <div className="mt-7 text-center">
          <p className="text-sm font-black text-white uppercase tracking-tight">{label}</p>
          <p className="text-accent-blue text-[9px] font-bold uppercase tracking-wider">Quest Available</p>
        </div>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  // Locked
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer grayscale">
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-xl" highlightRequired={highlightRequired}>
        <div className="w-16 h-16 bg-surface-dark rounded-xl flex items-center justify-center border-2 border-dashed border-white/30">
          <span className="material-symbols-outlined text-xl text-zinc-500">{icon}</span>
        </div>
      </NodeAnimShell>
      <div className="text-center">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-tight">{label}</p>
        <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Locked Territory</p>
      </div>
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div>
  )
}

// ─── RPG Card Node ────────────────────────────────────────────────────────────

function RPGNode({ data, selected, sourcePosition, targetPosition }: NodeProps) {
  const d = data as unknown as SkillNodeData
  const { label, icon, status, animationState, highlightRequired } = d

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center gap-2 cursor-pointer group">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-2xl" highlightRequired={highlightRequired}>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary glow-primary transition-transform hover:scale-105 ring-4 ring-primary/20">
            <span className="material-symbols-outlined text-3xl text-background-dark font-bold">check</span>
            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background-dark border-2 border-primary text-primary text-[9px] font-bold">
              ✓
            </div>
          </div>
        </NodeAnimShell>
        <div className="text-center">
          <p className="text-xs font-bold text-white">{label}</p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary uppercase tracking-wider">
            Completed
          </span>
        </div>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div className="flex flex-col items-center gap-2 cursor-pointer group">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-2xl" highlightRequired={highlightRequired}>
          <div className="relative">
            <div className="absolute inset-0 -m-1 rounded-[1.3rem] bg-accent-blue opacity-40 blur-sm" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-dark border-2 border-accent-blue glow-blue transition-transform hover:scale-105">
              <span className="material-symbols-outlined text-3xl text-accent-blue">{icon}</span>
            </div>
          </div>
        </NodeAnimShell>
        <div className="text-center">
          <p className="text-xs font-bold text-white">{label}</p>
          <span className="inline-flex items-center rounded-full bg-accent-blue/10 border border-accent-blue/20 px-2 py-0.5 text-[9px] font-medium text-accent-blue uppercase tracking-wider">
            Available
          </span>
        </div>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  // Locked
  return (
    <div className="flex flex-col items-center gap-2 cursor-not-allowed grayscale">
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-2xl" highlightRequired={highlightRequired}>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-dark border border-white/8">
          <span className="material-symbols-outlined text-2xl text-slate-500">lock</span>
        </div>
      </NodeAnimShell>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium text-slate-500 uppercase tracking-wider">
          Locked
        </span>
      </div>
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div >
  )
}

// ─── Terminal Node ────────────────────────────────────────────────────────────
// Code-snippet style nodes: sharp edges, tiny monospace text inside each node.

function getCodeSnippet(zone: string, nodeId: string): string {
  if (zone === 'Frontend') {
    if (/html|semantic|dom/.test(nodeId)) return '<div>\n  <h1>\n</div>'
    if (/css|style|layout|flex/.test(nodeId)) return '.cls {\n  flex:1;\n}'
    if (/react|next|ts/.test(nodeId)) return 'const C =\n() =>\n<div />'
    return 'import {\n  mod\n} from'
  }
  if (zone === 'Backend') return 'app.get(\n  "/api",\n  fn)'
  if (zone === 'DevOps') return 'FROM node\nRUN:\n  npm i'
  if (zone === 'Full-Stack') return '{ deps:\n  [...]\n}'
  return '$ ./run\n  --env\n  dev'
}

function TerminalNode({ data, selected, id, sourcePosition, targetPosition }: NodeProps) {
  const d = data as unknown as SkillNodeData
  const { label, status, zone, animationState, highlightRequired } = d
  const snippet = getCodeSnippet(zone, id)
  const shortLabel = `${zone.slice(0, 2).toUpperCase()}: ${label.replace(/ /g, '_').toUpperCase().slice(0, 12)}`

  if (status === 'completed') {
    return (
      <div className="group cursor-pointer flex flex-col items-center">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-none" highlightRequired={highlightRequired}>
          <div className="relative w-14 h-14 bg-primary flex items-center justify-center glow-primary">
            <pre className="text-[6.5px] leading-tight text-background-dark font-mono text-center whitespace-pre select-none">
              {snippet}
            </pre>
            <span className="material-symbols-outlined absolute -top-1.5 -right-1.5 text-[13px] bg-white text-primary rounded-full leading-none p-0.5">check</span>
          </div>
        </NodeAnimShell>
        <p className="text-[9px] font-bold font-mono whitespace-nowrap mt-1.5 text-primary uppercase">
          {shortLabel}
        </p>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div className="group cursor-pointer flex flex-col items-center">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-none" highlightRequired={highlightRequired}>
          <div className="relative w-14 h-14 bg-surface-dark border-2 border-accent-blue flex items-center justify-center shadow-[0_0_20px_rgba(43,149,255,0.2)]">
            <pre className="text-[6.5px] leading-tight text-accent-blue font-mono text-center whitespace-pre select-none">
              {snippet}
            </pre>
          </div>
        </NodeAnimShell>
        <p className="text-[9px] font-bold font-mono whitespace-nowrap mt-1.5 text-accent-blue uppercase">
          {shortLabel}
        </p>
        <span className="text-[7px] bg-accent-blue/10 text-accent-blue px-1.5 py-0.5 uppercase tracking-tighter font-mono border border-accent-blue/20">
          Available
        </span>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  // Locked
  return (
    <div className="group cursor-not-allowed grayscale flex flex-col items-center">
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-none" highlightRequired={highlightRequired}>
        <div className="w-14 h-14 bg-surface-dark border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-xl text-slate-600">lock</span>
        </div>
      </NodeAnimShell>
      <p className="text-[9px] font-bold font-mono whitespace-nowrap mt-1.5 text-slate-600 uppercase">
        {shortLabel}
      </p>
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div>
  )
}

// ─── Neural Node ──────────────────────────────────────────────────────────────
// Organic sci-fi style: energy-signature halos, floating animations, glowing circles.

function NeuralNode({ data, selected, sourcePosition, targetPosition }: NodeProps) {
  const d = data as unknown as SkillNodeData
  const { label, icon, status, animationState, highlightRequired } = d

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center node-float cursor-pointer group">
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-full" highlightRequired={highlightRequired}>
          <div className="relative h-20 w-20 flex items-center justify-center">
            {/* Spinning conic-gradient energy halo */}
            <motion.div
              className="absolute inset-0 energy-signature rounded-full opacity-70"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
            />
            {/* Slow pulse ring */}
            <div className="absolute inset-2 border border-primary/40 rounded-full animate-pulse" />
            {/* Filled inner circle */}
            <div className="relative h-14 w-14 rounded-full bg-primary glow-primary-lg flex items-center justify-center z-10">
              <span className="material-symbols-outlined text-background-dark font-bold text-2xl">{icon}</span>
            </div>
          </div>
        </NodeAnimShell>
        <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">{label}</span>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div className="flex flex-col items-center node-float cursor-pointer group" style={{ animationDelay: '-1.5s' }}>
        <Handle type="target" position={targetPosition ?? Position.Top} />
        <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-full" highlightRequired={highlightRequired}>
          <div className="relative h-[72px] w-[72px] flex items-center justify-center">
            {/* Blue reverse-spin energy halo */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-50"
              style={{
                background: 'conic-gradient(from 180deg, transparent, rgba(43,149,255,0.3), transparent 40%)',
                filter: 'blur(8px)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
            />
            {/* Inner circle */}
            <div className="relative h-12 w-12 rounded-full bg-surface-dark border-2 border-accent-blue glow-blue flex items-center justify-center z-10">
              <span className="material-symbols-outlined text-accent-blue text-xl animate-pulse">{icon}</span>
            </div>
          </div>
        </NodeAnimShell>
        <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-accent-blue uppercase">{label}</span>
        <Handle type="source" position={sourcePosition ?? Position.Bottom} />
      </div>
    )
  }

  // Locked
  return (
    <div className="flex flex-col items-center grayscale cursor-not-allowed" style={{ animationDelay: '-3s' }}>
      <Handle type="target" position={targetPosition ?? Position.Top} />
      <NodeAnimShell selected={!!selected} animationState={animationState} ringShape="rounded-full" highlightRequired={highlightRequired}>
        <div className="h-12 w-12 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600 text-base">lock</span>
        </div>
      </NodeAnimShell>
      <span className="mt-1.5 text-[9px] font-medium tracking-[0.3em] text-slate-600 uppercase">{label}</span>
      <Handle type="source" position={sourcePosition ?? Position.Bottom} />
    </div>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const allNodeTypes = {
  worldmap: memo(WorldMapNode),
  rpg: memo(RPGNode),
  terminal: memo(TerminalNode),
  neural: memo(NeuralNode),
}
