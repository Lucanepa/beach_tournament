// Cloudflare Pages Function — /api/notes
//   GET  → public read of the organizer notes (shown on the start page).
//   POST → admin-authenticated write (verifies the session token, then forwards
//          to the Apps Script Property store).
// Env: ADMIN_PIN, APPSCRIPT_URL, APPSCRIPT_SECRET

export const onRequestGet = async (context: any) => {
  const { APPSCRIPT_URL: url, APPSCRIPT_SECRET: secret } = context.env
  // Degrade gracefully — never break the start page if the backend is missing.
  if (!url || !secret) return json(200, { ok: true, notesDe: '', notesEn: '' })
  try {
    const u = `${url}${url.includes('?') ? '&' : '?'}action=getNotes&secret=${encodeURIComponent(secret)}`
    const data = await callAppsScriptGet(u)
    if (data && data.ok) {
      return json(200, { ok: true, notesDe: String(data.notesDe || ''), notesEn: String(data.notesEn || '') })
    }
  } catch {
    /* fall through to empty */
  }
  return json(200, { ok: true, notesDe: '', notesEn: '' })
}

export const onRequestPost = async (context: any) => {
  try {
    const { ADMIN_PIN: pin, APPSCRIPT_URL: url, APPSCRIPT_SECRET: secret } = context.env
    if (!pin || !url || !secret) return json(500, { ok: false, error: 'not_configured' })

    let body: any
    try {
      body = await context.request.json()
    } catch {
      return json(400, { ok: false, error: 'bad_json' })
    }

    if (!(await verifyToken(body?.token, pin))) return json(401, { ok: false, error: 'unauthorized' })

    const notesDe = clampNote(body.notesDe)
    const notesEn = clampNote(body.notesEn)

    let data: any
    try {
      data = await callAppsScriptPost(url, { secret, action: 'setNotes', notesDe, notesEn })
    } catch (e: any) {
      return json(502, { ok: false, error: 'sheet_unreachable', detail: String(e && (e.message || e)).slice(0, 160) })
    }
    if (!data || !data.ok) return json(502, { ok: false, error: (data && data.error) || 'write_failed' })
    return json(200, { ok: true, notesDe, notesEn })
  } catch (err: any) {
    return json(500, { ok: false, error: 'exception', detail: String((err && (err.stack || err.message)) || err).slice(0, 300) })
  }
}

function clampNote(v: any): string {
  return typeof v === 'string' ? v.slice(0, 2000) : ''
}

// Apps Script answers /exec with a 302 → script.googleusercontent.com. The
// Workers runtime needs that redirect followed explicitly to read the JSON
// (see update-score.ts — same pattern, proven working). We read the body as
// text first so a non-JSON reply (e.g. an HTML error/login page) surfaces as a
// clear error string instead of an opaque failure.
async function callAppsScriptGet(u: string): Promise<any> {
  return appsScript(u, { method: 'GET', redirect: 'manual' })
}

async function callAppsScriptPost(url: string, forward: any): Promise<any> {
  return appsScript(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(forward),
    redirect: 'manual',
  })
}

async function appsScript(url: string, init: RequestInit): Promise<any> {
  let res = await fetch(url, init)
  console.log('notes: appscript first status', res.status)
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location')
    console.log('notes: redirect ->', loc ? loc.slice(0, 90) : '(none)')
    if (loc) res = await fetch(loc, { method: 'GET' })
    console.log('notes: after redirect status', res.status)
  }
  const text = await res.text()
  console.log('notes: appscript body', text.slice(0, 200))
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`non-JSON from appscript (status ${res.status}): ${text.slice(0, 140)}`)
  }
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
