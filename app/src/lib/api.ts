// Client for the serverless functions (Cloudflare Pages Functions at /api/*).
import type { SetPair } from './tournament'

const TOKEN_KEY = 'zuzu-admin-token'

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}
export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

// A token is "base64(payload).hexsig"; we can read the exp client-side.
export function tokenValid(): boolean {
  const tok = getToken()
  if (!tok || tok.indexOf('.') < 0) return false
  try {
    const payload = JSON.parse(atob(tok.split('.')[0]))
    return payload && typeof payload.exp === 'number' && Date.now() <= payload.exp
  } catch {
    return false
  }
}

export async function adminLogin(pin: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok && !!data.token, token: data.token, error: data.error }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export type ScorePayload = {
  tournament: string
  matchNumber: number
  sets: (SetPair | null)[]
  court: number | ''
}

export async function updateScore(
  p: ScorePayload
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('/api/update-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), ...p }),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok && data.ok, status: res.status, error: data.error }
  } catch {
    return { ok: false, status: 0, error: 'network' }
  }
}

export type Notes = { notesDe: string; notesEn: string }

export async function getNotes(): Promise<Notes> {
  try {
    const res = await fetch('/api/notes', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    return { notesDe: String(data?.notesDe || ''), notesEn: String(data?.notesEn || '') }
  } catch {
    return { notesDe: '', notesEn: '' }
  }
}

export async function saveNotes(
  notesDe: string,
  notesEn: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), notesDe, notesEn }),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok && data.ok, status: res.status, error: data.error }
  } catch {
    return { ok: false, status: 0, error: 'network' }
  }
}
