'use client'

import { useState, type CSSProperties } from 'react'
import type { Resource, ResourceType } from '@/types/tree'
import { newResourceId } from '@/lib/builder-utils'

const RESOURCE_TYPES: ResourceType[] = ['video', 'article', 'interactive', 'course', 'docs']

const TYPE_ICONS: Record<ResourceType, string> = {
  video:       'play_circle',
  article:     'article',
  interactive: 'code',
  course:      'school',
  docs:        'description',
}

const TYPE_LABELS: Record<ResourceType, string> = {
  video:       'Video',
  article:     'Article',
  interactive: 'Interactive',
  course:      'Course',
  docs:        'Docs',
}

interface Props {
  resources: Resource[]
  onChange:  (resources: Resource[]) => void
}

const EMPTY_RESOURCE: Omit<Resource, 'id'> = {
  title:          '',
  url:            'https://',
  type:           'video',
  author:         '',
  estimatedHours: 1,
  isFree:         true,
}

const ACCENT = '#00f0ff'

export function ResourceEditor({ resources, onChange }: Props) {
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm]       = useState({ ...EMPTY_RESOURCE })

  function startAdd() {
    setForm({ ...EMPTY_RESOURCE })
    setAdding(true)
    setEditing(null)
  }

  function startEdit(r: Resource) {
    const { id: _id, ...rest } = r
    setForm(rest)
    setEditing(r.id)
    setAdding(false)
  }

  function cancel() {
    setAdding(false)
    setEditing(null)
  }

  function saveAdd() {
    if (!form.title.trim() || !form.url.trim()) return
    onChange([...resources, { id: newResourceId(), ...form }])
    setAdding(false)
  }

  function saveEdit() {
    if (!editing || !form.title.trim() || !form.url.trim()) return
    onChange(resources.map(r => r.id === editing ? { id: editing, ...form } : r))
    setEditing(null)
  }

  function remove(id: string) {
    onChange(resources.filter(r => r.id !== id))
  }

  /** Inline resource form (used for both add and edit) */
  const ResourceForm = ({ onSave }: { onSave: () => void }) => (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400">
          {editing ? 'Edit Resource' : 'New Resource'}
        </span>
        <button
          onClick={cancel}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="space-y-2">
        {/* Title */}
        <input
          className="w-full bg-black/20 border-0 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all"
          style={{ '--tw-ring-color': ACCENT } as CSSProperties}
          placeholder="Resource title *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />

        {/* Type + URL row */}
        <div className="flex gap-2">
          <select
            className="bg-black/20 border-0 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 w-24 flex-shrink-0 cursor-pointer"
            style={{ '--tw-ring-color': ACCENT } as CSSProperties}
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as ResourceType }))}
          >
            {RESOURCE_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input
            className="flex-1 bg-black/20 border-0 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all"
            style={{ '--tw-ring-color': ACCENT } as CSSProperties}
            placeholder="https://..."
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
          />
        </div>

        {/* Author + hours row */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-black/20 border-0 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 transition-all"
            placeholder="Author / channel"
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
          />
          <input
            className="w-20 bg-black/20 border-0 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 transition-all"
            type="number"
            min={0.5}
            step={0.5}
            placeholder="h"
            title="Estimated hours"
            value={form.estimatedHours}
            onChange={e => setForm(f => ({ ...f, estimatedHours: parseFloat(e.target.value) || 1 }))}
          />
        </div>

        {/* Free checkbox */}
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded"
            checked={form.isFree ?? true}
            onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))}
          />
          Free resource
        </label>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onSave}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}44` }}
        >
          {editing ? 'Save Changes' : 'Add to Node'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      {/* Existing resources */}
      {resources.map(r => (
        <div key={r.id}>
          {editing === r.id ? (
            <ResourceForm onSave={saveEdit} />
          ) : (
            <div
              className="flex items-center gap-3 p-3 rounded-lg group cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent' }}
            >
              <span className="material-symbols-outlined text-sm text-slate-500 flex-shrink-0">
                {TYPE_ICONS[r.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{r.title}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {[r.author, `${r.estimatedHours}h`, TYPE_LABELS[r.type]].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(r)}
                  className="text-slate-500 hover:text-white transition-colors p-0.5"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add form */}
      {adding && <ResourceForm onSave={saveAdd} />}

      {/* Add button */}
      {!adding && (
        <button
          onClick={startAdd}
          className="w-full text-xs py-2.5 rounded-lg border border-dashed border-white/10 text-slate-500 hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add resource
        </button>
      )}
    </div>
  )
}
