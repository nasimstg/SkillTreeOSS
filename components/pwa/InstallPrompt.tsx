'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PromptState = 'hidden' | 'android-native' | 'android-guide' | 'ios'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  )
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isSafariEngine = /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua)
  return isIOS && isSafariEngine
}

function isAndroidChrome(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

const DISMISSED_KEY = 'pwa-prompt-dismissed-v2'
const DISMISS_TTL   = 30 * 24 * 60 * 60 * 1000 // 30 days
const ANDROID_DELAY       = 4_000
const ANDROID_GUIDE_DELAY = 8_000
const IOS_DELAY           = 8_000

const FEATURES = [
  { icon: 'bolt',       text: 'Instant access from your home screen' },
  { icon: 'fullscreen', text: 'Full-screen, distraction-free learning' },
  { icon: 'wifi_off',   text: 'Works offline for cached pages'        },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function InstallPrompt() {
  const [promptState,    setPromptState]    = useState<PromptState>('hidden')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing,     setInstalling]     = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    const ts = localStorage.getItem(DISMISSED_KEY)
    if (ts && Date.now() - parseInt(ts, 10) < DISMISS_TTL) return

    // Register SW first — browser needs it for installability criteria
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }

    if (isIOSSafari()) {
      const timer = setTimeout(() => setPromptState('ios'), IOS_DELAY)
      return () => clearTimeout(timer)
    }

    // `beforeinstallprompt` fires before React hydrates — captured early by the
    // inline script in layout.tsx into window.__pwaPrompt.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const captured = (window as any).__pwaPrompt as BeforeInstallPromptEvent | null
    if (captured) {
      setDeferredPrompt(captured)
      const timer = setTimeout(() => setPromptState('android-native'), ANDROID_DELAY)
      return () => clearTimeout(timer)
    }

    // Fallback timer: on Android, show manual Chrome guide if native prompt never
    // fires (e.g. HTTP local dev — beforeinstallprompt requires HTTPS).
    const guideTimer = isAndroidChrome()
      ? setTimeout(() => setPromptState('android-guide'), ANDROID_GUIDE_DELAY)
      : null

    // Fallback listener for cases where the event fires after mount
    const handler = (e: Event) => {
      if (guideTimer) clearTimeout(guideTimer)
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setPromptState('android-native'), ANDROID_DELAY)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      if (guideTimer) clearTimeout(guideTimer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const dismiss = () => {
    setPromptState('hidden')
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
  }

  const install = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    setDeferredPrompt(null)
    if (outcome === 'accepted') setPromptState('hidden')
  }

  return (
    <AnimatePresence>
      {promptState !== 'hidden' && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[9998] mx-auto max-w-lg"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div
              className="rounded-t-3xl px-6 pt-5 pb-8"
              style={{
                background: 'rgba(15,15,15,0.98)',
                borderTop:   '1px solid rgba(255,255,255,0.08)',
                borderLeft:  '1px solid rgba(255,255,255,0.06)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Drag handle */}
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/10" />

              {/* App identity row */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-primary/10">
                  <Image
                    src="/assets/skilltreeoss.png"
                    alt="SkillTreeOSS"
                    width={60}
                    height={60}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white text-lg font-bold leading-tight">SkillTreeOSS</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {promptState === 'ios' || promptState === 'android-guide' ? 'Add to Home Screen' : 'Install the app'}
                  </p>
                </div>
                {/* Close */}
                <button
                  onClick={dismiss}
                  className="ml-auto shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-base leading-none">close</span>
                </button>
              </div>

              {/* Feature list */}
              <div className="space-y-3 mb-6">
                {FEATURES.map(({ icon, text }) => (
                  <div key={icon} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[15px] leading-none">{icon}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-snug">{text}</p>
                  </div>
                ))}
              </div>

              {promptState === 'ios' ? (
                /* iOS: manual "Share → Add to Home Screen" guide */
                <>
                  <div
                    className="rounded-2xl border border-white/[0.08] p-4 mb-4 space-y-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {[
                      { step: '1', icon: 'ios_share',    text: 'Tap the Share button in the toolbar' },
                      { step: '2', icon: 'add_box',      text: 'Tap "Add to Home Screen"'            },
                      { step: '3', icon: 'check_circle', text: 'Tap "Add" to confirm'                },
                    ].map(({ step, icon, text }) => (
                      <div key={step} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                          {step}
                        </span>
                        <span className="material-symbols-outlined text-slate-400 text-lg leading-none shrink-0">{icon}</span>
                        <p className="text-slate-300 text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={dismiss}
                    className="w-full h-11 rounded-2xl text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                  >
                    Maybe later
                  </button>
                </>
              ) : promptState === 'android-guide' ? (
                /* Android: manual Chrome guide (shown when native prompt unavailable, e.g. HTTP) */
                <>
                  <div
                    className="rounded-2xl border border-white/[0.08] p-4 mb-4 space-y-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {[
                      { step: '1', icon: 'more_vert',    text: 'Tap the ⋮ menu in Chrome\'s address bar' },
                      { step: '2', icon: 'add_box',      text: 'Tap "Add to Home Screen"'                },
                      { step: '3', icon: 'check_circle', text: 'Tap "Add" to confirm'                    },
                    ].map(({ step, icon, text }) => (
                      <div key={step} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                          {step}
                        </span>
                        <span className="material-symbols-outlined text-slate-400 text-lg leading-none shrink-0">{icon}</span>
                        <p className="text-slate-300 text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={dismiss}
                    className="w-full h-11 rounded-2xl text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                  >
                    Maybe later
                  </button>
                </>
              ) : (
                /* Android / Chrome: native install prompt */
                <>
                  <button
                    onClick={install}
                    disabled={installing}
                    className="w-full h-12 rounded-2xl bg-primary text-black font-bold text-sm flex items-center justify-center gap-2 mb-3 transition-opacity hover:opacity-85 disabled:opacity-60"
                    style={{ boxShadow: '0 0 24px rgba(17,212,82,0.25)' }}
                  >
                    <span className={`material-symbols-outlined text-lg leading-none ${installing ? 'animate-spin' : ''}`}>
                      {installing ? 'progress_activity' : 'download'}
                    </span>
                    {installing ? 'Installing…' : 'Install App'}
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                  >
                    Not now
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
