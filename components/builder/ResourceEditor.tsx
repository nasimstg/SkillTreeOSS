'use client'

import { useState } from 'react'
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

  const formEl = (onSave: () => void) => (
    <div className="bg-black/30 rounded-lg border border-slate-700 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="col-span-2 input-sm"
          placeholder="Resource title *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        <input
          className="col-span-2 input-sm"
          placeholder="URL (https://...) *"
          value={form.url}
          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        />
        <input
          className="input-sm"
          placeholder="Author / channel"
          value={form.author}
          onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
        />
        <input
          className="input-sm"
          type="number"
          min={0.5}
          step={0.5}
          placeholder="Est. hours"
          value={form.estimatedHours}
          onChange={e => setForm(f => ({ ...f, estimatedHours: parseFloat(e.target.value) || 1 }))}
        />
        <select
          className="input-sm"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value as ResourceType }))}
        >
          {RESOURCE_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={form.isFree ?? true}
            onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))}
          />
          Free resource
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 text-xs py-1.5 rounded-lg bg-primary text-black font-medium hover:bg-primary/80 transition-colors"
        >
          Save
        </button>
        <button
          onClick={cancel}
          className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Resources</p>

      {resources.map(r => (
        <div key={r.id}>
          {editing === r.id ? (
            formEl(saveEdit)
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-transparent hover:border-slate-700 group">
              <span className="material-symbols-outlined text-sm text-slate-400">
                {TYPE_ICONS[r.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{r.title}</p>
                <p className="text-xs text-slate-500 truncate">{r.author} · {r.estimatedHours}h · {r.type}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(r)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && formEl(saveAdd)}

      {!adding && (
        <button
          onClick={startAdd}
          className="w-full text-xs py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add resource
        </button>
      )}
    </div>
  )
}
