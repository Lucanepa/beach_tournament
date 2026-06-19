// Cloudflare Pages Function — /api/notes
//   GET  → public read of the organizer notes (shown on the start page).
//   POST → admin-authenticated write (verifies the session token).
// Notes live in Cloudflare KV (binding: NOTES) — a native store, so there is no
// external fetch / redirect involved (the Apps Script POST path was unreliable
// in production). Env: ADMIN_PIN. Binding: NOTES (KV namespace).

const DE_KEY = 'notesDe'
const EN_KEY = 'notesEn'

export const onRequestGet = async (context: any) => {
  const kv = context.env.NOTES
  // Degrade gracefully — never break the start page if the binding is missing.
  if (!kv) return json(200, { ok: true, notesDe: '', notesEn: '' })
  try {
    const [de, en] = await Promise.all([kv.get(DE_KEY), kv.get(EN_KEY)])
    return json(200, { ok: true, notesDe: de || '', notesEn: en || '' })
  } catch {
    return json(200, { ok: true, notesDe: '', notesEn: '' })
  }
}

export const onRequestPost = async (context: any) => {
  try {
    const { ADMIN_PIN: pin, NOTES: kv } = context.env
    if (!pin) return json(500, { ok: false, error: 'not_configured' })
    if (!kv) return json(500, { ok: false, error: 'kv_unbound' })

    let body: any
    try {
      body = await context.request.json()
    } catch {
      return json(400, { ok: false, error: 'bad_json' })
    }

    if (!(await verifyToken(body?.token, pin))) return json(401, { ok: false, error: 'unauthorized' })

    const notesDe = clampNote(body.notesDe)
    const notesEn = clampNote(body.notesEn)
    await Promise.all([kv.put(DE_KEY, notesDe), kv.put(EN_KEY, notesEn)])
    return json(200, { ok: true, notesDe, notesEn })
  } catch (err: any) {
    return json(500, { ok: false, error: 'exception', detail: String((err && (err.stack || err.message)) || err).slice(0, 300) })
  }
}

function clampNote(v: any): string {
  return typeof v === 'string' ? v.slice(0, 2000) : ''
}

async function verifyToken(token: any, key: string) {
  if (typeof token !== 'string' || token.indexOf('.') < 0) return false
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return false
  const expected = await hmacHex(key, payloadB64)
  if (!ctEq(sig, expected)) return false
  let payload: any
  try {
    payload = JSON.parse(atob(payloadB64))
  } catch {
    return false
  }
  return payload && typeof payload.exp === 'number' && Date.now() <= payload.exp
}

async function hmacHex(key: string, msg: string) {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function ctEq(a: string, b: string) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function json(status: number, obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
