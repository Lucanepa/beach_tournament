// Organizer settings, persisted in localStorage (ported from the vanilla site).
export type Settings = {
  courtCount: number
  refreshSeconds: number
  tournaments: string[]
  defaultLang: 'de' | 'en'
}

const SETTINGS_KEY = 'zuzu-settings'

export const DEFAULT_SETTINGS: Settings = {
  courtCount: 0,
  refreshSeconds: 10,
  tournaments: ['men', 'women'],
  defaultLang: 'de',
}

export function getSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const merged: Settings = { ...DEFAULT_SETTINGS, ...stored }
    merged.courtCount = Math.max(0, parseInt(String(merged.courtCount), 10) || 0)
    merged.refreshSeconds = Math.max(3, parseInt(String(merged.refreshSeconds), 10) || 10)
    if (!Array.isArray(merged.tournaments) || merged.tournaments.length === 0) {
      merged.tournaments = [...DEFAULT_SETTINGS.tournaments]
    }
    if (merged.defaultLang !== 'de' && merged.defaultLang !== 'en') merged.defaultLang = 'de'
    return merged
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
