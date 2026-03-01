'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBuilderStore } from '@/lib/builder-store'
import { COMMON_ZONES, ZONE_COLORS, DEFAULT_ZONE_COLOR } from '@/lib/builder-utils'

// ── Color palette for custom zones ────────────────────────────────────────────

export const ZONE_PALETTE = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#a78bfa', // violet
  '#22d3ee', // sky
  '#4ade80', // green
  '#fb923c', // peach
  '#64748b', // slate
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface AllZone {
  name:     string
  color:    string
  isPreset: boolean
}

interface Props {
  value:    string
  onChange: (zone: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ZoneSelector({ value, onChange }: Props) {
  const customZones    = useBuilderStore(s => s.customZones)
  const addCustomZone  = useBuilderStore(s => s.addCustomZone)
  const updateCustomZone = useBuilderStore(s => s.updateCustomZone)
  const removeCustomZone = useBuilderStore(s => s.removeCustomZone)

  const [showAdd,      setShowAdd]      = useState(false)
  const [editingZone,  setEditingZone]  = useState<string | null>(null)
  const [newZoneName,  setNewZoneName]  = useState('')
  const [newZoneColor, setNewZoneColor] = useState(ZONE_PALETTE[0])
  const [editName,     setEditName]     = useState('')
  const [editColor,    setEditColor]    = useState('')

  const allZones: AllZone[] = [
    ...COMMON_ZONES.map(name => ({ name, color: ZONE_COLORS[name] ?? DEFAULT_ZONE_COLOR, isPreset: true })),
    ...customZones.map(z => ({ ...z, isPreset: false })),
  ]

  function handleAdd() {
    const name = newZoneName.trim()
    if (!name) return
    addCustomZone(name, newZoneColor)
    onChange(name)
    setNewZoneName('')
    setNewZoneColor(ZONE_PALETTE[0])
    setShowAdd(false)
  }

  function startEdit(zone: AllZone) {
    setEditingZone(zone.name)
    setEditName(zone.name)
    setEditColor(zone.color)
    setShowAdd(false)
  }

  function handleEditSave() {
    if (!editingZone) return
    const trimmed = editName.trim()
    if (!trimmed) return
    updateCustomZone(editingZone, { name: trimmed, color: editColor })
    if (value === editingZone) onChange(trimmed)
    setEditingZone(null)
  }

  function handleDelete(name: string) {
    removeCustomZone(name)
    if (value === name) onChange('')
    setEditingZone(null)
  }

  return (
    <div className="space-y-3">
      {/* ── Zone pills ── */}
      <div className="flex flex-wrap gap-1.5">
        {/* None */}
        <button
          onClick={() => onChange('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            value === ''
              ? 'bg-white/10 border-white/30 text-white'
              : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
          }`}
        >
          None
        </button>

        {allZones.map(zone => {
          const isSelected = value === zone.name
          const isEditing  = editingZone === zone.name
          return (
            <div key={zone.name} className="relative group">
              <button
                onClick={() => onChange(zone.name)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={
                  isSelected
                    ? { background: `${zone.color}22`, borderColor: `${zone.color}55`, color: zone.color }
                    : { borderColor: 'rgba(255,255,255,0.10)', color: '#94a3b8' }
                }
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: zone.color }}
                />
                {zone.name}
              </button>

              {/* Edit / delete controls on custom zones */}
              {!zone.isPreset && !isEditing && (
                <div className="absolute -top-1.5 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={e => { e.stopPropagation(); startEdit(zone) }}
                    className="w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 border border-white/10 flex items-center justify-center"
                    title="Edit zone"
                  >
                    <span className="material-symbols-outlined text-[9px] text-slate-300 leading-none">edit</span>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(zone.name) }}
                    className="w-4 h-4 rounded-full bg-red-900/60 hover:bg-red-700/80 border border-red-800/40 flex items-center justify-center"
                    title="Delete zone"
                  >
                    <span className="material-symbols-outlined text-[9px] text-red-300 leading-none">close</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Add zone button */}
        <button
          onClick={() => { setShowAdd(v => !v); setEditingZone(null) }}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            showAdd
              ? 'border-primary/40 text-primary bg-primary/10'
              : 'border-dashed border-white/15 text-slate-600 hover:border-white/30 hover:text-slate-400'
          }`}
        >
          <span className="material-symbols-outlined text-[13px] leading-none">
            {showAdd ? 'close' : 'add'}
          </span>
          {showAdd ? 'Cancel' : 'Add zone'}
        </button>
      </div>

      {/* ── Add zone form ── */}
      <AnimatePresence initial={false}>
        {showAdd && (
          <motion.div
            key="add-zone"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <ZoneForm
              nameValue={newZoneName}
              colorValue={newZoneColor}
              onNameChange={setNewZoneName}
              onColorChange={setNewZoneColor}
              onConfirm={handleAdd}
              onCancel={() => setShowAdd(false)}
              confirmLabel="Create zone"
              placeholder="Zone name…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit zone form ── */}
      <AnimatePresence initial={false}>
        {editingZone && (
          <motion.div
            key={`edit-${editingZone}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl border border-white/[0.07] p-3 flex flex-col gap-3"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Editing "{editingZone}"
              </p>
              <ZoneForm
                nameValue={editName}
                colorValue={editColor}
                onNameChange={setEditName}
                onColorChange={setEditColor}
                onConfirm={handleEditSave}
                onCancel={() => setEditingZone(null)}
                confirmLabel="Save changes"
                placeholder="Zone name…"
                extraActions={
                  <button
                    onClick={() => handleDelete(editingZone)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ZoneForm sub-component ────────────────────────────────────────────────────

interface ZoneFormProps {
  nameValue:     string
  colorValue:    string
  onNameChange:  (v: string) => void
  onColorChange: (v: string) => void
  onConfirm:     () => void
  onCancel:      () => void
  confirmLabel:  string
  placeholder?:  string
  extraActions?: React.ReactNode
}

function ZoneForm({
  nameValue, colorValue, onNameChange, onColorChange,
  onConfirm, onCancel, confirmLabel, placeholder = 'Name…', extraActions,
}: ZoneFormProps) {
  return (
    <div
      className="rounded-xl border border-white/[0.07] p-3 flex flex-col gap-3"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      {/* Name input */}
      <input
        autoFocus
        value={nameValue}
        onChange={e => onNameChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel() }}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
      />

      {/* Color palette */}
      <div>
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {ZONE_PALETTE.map(hex => (
            <button
              key={hex}
              onClick={() => onColorChange(hex)}
              className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background:   hex,
                borderColor:  colorValue === hex ? 'white' : 'transparent',
                boxShadow:    colorValue === hex ? `0 0 8px ${hex}` : 'none',
              }}
              title={hex}
            />
          ))}
        </div>

        {/* Preview */}
        {nameValue.trim() && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-slate-600">Preview:</span>
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                background:  `${colorValue}22`,
                borderColor: `${colorValue}55`,
                color:       colorValue,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: colorValue }} />
              {nameValue}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {extraActions}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!nameValue.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
