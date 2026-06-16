import { useState } from 'react'
import { availableTournaments } from './tournament'

const KEY = 'zuzu-tournament'

// Remembers the chosen tournament across pages (Results ↔ Tableau ↔ Admin)
// via localStorage, so switching views doesn't reset it to the first one.
export function useSelectedTournament(): [string, (v: string) => void] {
  const avail = availableTournaments()
  const initial = (() => {
    try {
      const s = localStorage.getItem(KEY)
      return s && avail.includes(s) ? s : avail[0]
    } catch {
      return avail[0]
    }
  })()
  const [sel, setSel] = useState(initial || 'men')
  const set = (v: string) => {
    setSel(v)
    try {
      localStorage.setItem(KEY, v)
    } catch {
      /* ignore */
    }
  }
  return [sel, set]
}
