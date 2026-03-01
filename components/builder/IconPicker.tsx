'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isEmoji } from '@/lib/builder-utils'

// ── Material Symbols catalogue ─────────────────────────────────────────────────

const ICON_CATEGORIES = [
  {
    name: 'Learning',
    icon: 'school',
    icons: [
      'school', 'menu_book', 'auto_stories', 'library_books', 'local_library',
      'bookmark', 'bookmarks', 'note_alt', 'edit_note', 'history_edu',
      'calculate', 'functions', 'psychology', 'lightbulb', 'tips_and_updates',
      'quiz', 'grading', 'assignment', 'task_alt', 'verified',
      'emoji_objects', 'fact_check', 'science', 'biotech', 'microscope',
    ],
  },
  {
    name: 'Tech',
    icon: 'code',
    icons: [
      'code', 'terminal', 'data_object', 'javascript', 'css', 'html',
      'memory', 'dns', 'cloud', 'cloud_upload', 'cloud_download', 'router',
      'lan', 'wifi', 'api', 'webhook', 'developer_mode', 'build',
      'construction', 'engineering', 'token', 'fingerprint', 'devices',
      'computer', 'laptop', 'phone_android', 'desktop_windows',
    ],
  },
  {
    name: 'Data & AI',
    icon: 'analytics',
    icons: [
      'analytics', 'bar_chart', 'pie_chart', 'show_chart', 'data_object',
      'query_stats', 'table_chart', 'dashboard', 'monitoring', 'trending_up',
      'assessment', 'insights', 'leaderboard', 'hub', 'model_training',
      'batch_prediction', 'smart_toy', 'auto_awesome', 'database',
      'storage', 'schema', 'dataset', 'data_usage', 'table',
    ],
  },
  {
    name: 'Infra',
    icon: 'dns',
    icons: [
      'security', 'lock', 'lock_open', 'shield', 'vpn_key', 'key',
      'admin_panel_settings', 'manage_accounts', 'backup', 'cloud_sync',
      'settings', 'tune', 'settings_applications', 'deployed_code',
      'package_2', 'inventory_2', 'layers', 'folder', 'folder_open',
      'source', 'merge', 'fork_right', 'account_tree', 'stacks',
    ],
  },
  {
    name: 'Web',
    icon: 'web',
    icons: [
      'web', 'language', 'public', 'open_in_new', 'link', 'search',
      'travel_explore', 'smartphone', 'tablet', 'app_shortcut',
      'mobile_friendly', 'qr_code', 'share', 'rss_feed', 'contactless',
      'http', 'browser_updated', 'css', 'html', 'responsive_layout',
    ],
  },
  {
    name: 'Creative',
    icon: 'palette',
    icons: [
      'palette', 'brush', 'draw', 'design_services', 'photo_camera',
      'image', 'videocam', 'music_note', 'movie', 'edit',
      'format_paint', 'style', 'color_lens', 'interests', 'animation',
      'photo_filter', 'landscape', 'face', 'emoji_emotions', 'auto_fix_high',
      'theater_comedy', 'flare', 'lens', 'crop_free',
    ],
  },
  {
    name: 'Business',
    icon: 'work',
    icons: [
      'work', 'business', 'account_balance', 'payments', 'receipt',
      'trending_up', 'handshake', 'groups', 'supervisor_account',
      'corporate_fare', 'badge', 'diversity_3', 'rocket_launch',
      'flag', 'campaign', 'support_agent', 'workspace_premium',
      'star', 'grade', 'military_tech', 'trophy', 'celebration',
    ],
  },
  {
    name: 'Health',
    icon: 'fitness_center',
    icons: [
      'fitness_center', 'sports', 'sports_esports', 'sports_soccer',
      'favorite', 'health_and_safety', 'self_improvement', 'directions_run',
      'spa', 'restaurant', 'coffee', 'local_cafe', 'water_drop', 'eco', 'sunny',
      'meditation', 'nightlight', 'air', 'nature', 'energy_savings_leaf',
    ],
  },
]

// ── Emoji catalogue ────────────────────────────────────────────────────────────

const EMOJI_SETS = [
  {
    name: 'Tech',
    icons: ['💻','🖥️','📱','⌨️','🔌','💾','📡','🤖','⚡','🔧','⚙️','🛠️','🔩','💡','🔋','💿','🧲','🔦','🖨️','🎮','🕹️','📟','📠','🖱️','📲'],
  },
  {
    name: 'Learn',
    icons: ['📚','📖','🎓','✏️','📝','🔬','🧪','🧬','🔭','📊','📈','🎯','🏆','⭐','🌟','💡','🧮','📐','📏','🗒️','📌','🔖','🏅','🥇','📋'],
  },
  {
    name: 'Work',
    icons: ['💼','🤝','💰','💳','🏦','📄','🏢','🌍','🚀','🏷️','📎','🗂️','📍','🗓️','📅','⏰','📞','📧','📮','🗃️','✅','🔑','🔐','🏗️','🎪'],
  },
  {
    name: 'Creative',
    icons: ['🎨','🖌️','✨','🎭','🎬','🎵','🎸','🎹','🎲','🌈','🖼️','📸','🎟️','🎫','🎺','🎻','🥁','🎷','🎙️','🎤','🎧','🎚️','🎛️','🎠','🎡'],
  },
  {
    name: 'Nature',
    icons: ['🌊','🔥','🌱','🌍','🌙','☀️','❄️','💧','🌿','🍎','🌸','🌺','⛰️','🌲','🍀','🌻','🍃','🦋','🌪️','🔮','🌈','🌓','☁️','🦅','🐉'],
  },
  {
    name: 'People',
    icons: ['💪','🏋️','🧘','❤️','🫂','👥','🙌','👏','🙏','🤔','💭','🗣️','👁️','🫶','🤩','😊','🤓','😎','🎉','🥳','🤜','🌺','😄','🫡','🧠'],
  },
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  value:       string
  onChange:    (icon: string) => void
  recentIcons: string[]
  color?:      string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IconPicker({ value, onChange, recentIcons, color = '#6b7280' }: Props) {
  const [open,           setOpen]           = useState(false)
  const [search,         setSearch]         = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [emojiMode,      setEmojiMode]      = useState(false)

  const categories = emojiMode ? EMOJI_SETS : ICON_CATEGORIES

  const icons = useMemo(() => {
    const source =
      activeCategory === 'all'
        ? categories.flatMap(c => c.icons)
        : categories.find(c => c.name === activeCategory)?.icons ?? []

    if (!search || emojiMode) return source
    const q = search.toLowerCase().replace(/\s+/g, '_')
    return source.filter(i => i.includes(q))
  }, [emojiMode, activeCategory, search, categories])

  function handleSelect(icon: string) {
    onChange(icon)
    setOpen(false)
    setSearch('')
  }

  function handleModeToggle() {
    setEmojiMode(v => !v)
    setSearch('')
    setActiveCategory('all')
  }

  const currentIsEmoji = isEmoji(value)

  return (
    <div className="space-y-2">
      {/* ── Trigger row ── */}
      <div className="flex gap-2 items-center">
        {/* Icon preview badge */}
        <button
          onClick={() => setOpen(v => !v)}
          title="Open icon picker"
          className="size-9 rounded-lg flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {currentIsEmoji ? (
            <span className="text-xl leading-none">{value}</span>
          ) : (
            <span className="material-symbols-outlined text-lg leading-none">{value || 'school'}</span>
          )}
        </button>

        {/* Text input (for manual entry) */}
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#00f0ff]/50 transition-all"
          placeholder="icon name or emoji…"
          value={value}
          onChange={e => onChange(e.target.value)}
        />

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title={open ? 'Collapse picker' : 'Browse icons'}
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="material-symbols-outlined text-base leading-none block"
          >
            expand_more
          </motion.span>
        </button>
      </div>

      {/* ── Expanded picker panel ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="icon-picker-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl border border-white/[0.07] flex flex-col gap-3 p-3"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              {/* Search bar + emoji toggle */}
              <div className="flex gap-2">
                {!emojiMode && (
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined text-sm text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2 leading-none">
                      search
                    </span>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="search icons…"
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                )}
                {emojiMode && (
                  <p className="flex-1 text-xs text-slate-600 flex items-center px-1">Browse by category</p>
                )}

                {/* Mode toggle pill */}
                <button
                  onClick={handleModeToggle}
                  title={emojiMode ? 'Switch to Material Symbols' : 'Switch to Emoji'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                    emojiMode
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {emojiMode ? '😊 Emoji' : '⊞ Symbols'}
                </button>
              </div>

              {/* Category tabs (scrollable) */}
              <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                    activeCategory === 'all'
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setActiveCategory(c.name)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                      activeCategory === c.name
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {!emojiMode && 'icon' in c && (
                      <span className="material-symbols-outlined text-[12px] leading-none">{(c as { icon: string }).icon}</span>
                    )}
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Recents row (symbols mode only) */}
              {!emojiMode && recentIcons.length > 0 && !search && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Recent
                  </p>
                  <div className="flex gap-0.5 flex-wrap">
                    {recentIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => handleSelect(icon)}
                        title={icon}
                        className={`p-1.5 rounded-lg transition-colors ${
                          value === icon
                            ? 'bg-primary/20 text-primary'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base leading-none">{icon}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 border-t border-white/[0.06]" />
                </div>
              )}

              {/* Icon grid */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: 192, scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
              >
                {icons.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-slate-600 gap-1.5">
                    <span className="material-symbols-outlined text-2xl">search_off</span>
                    <p className="text-xs">No icons match "{search}"</p>
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-0.5">
                    {icons.map((icon, i) => (
                      <button
                        key={`${icon}-${i}`}
                        title={emojiMode ? icon : icon.replace(/_/g, ' ')}
                        onClick={() => handleSelect(icon)}
                        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center aspect-square ${
                          value === icon
                            ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                            : 'text-slate-500 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {emojiMode ? (
                          <span className="text-lg leading-none">{icon}</span>
                        ) : (
                          <span className="material-symbols-outlined text-base leading-none">{icon}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
