// Cloudflare Pages Function — POST /api/update-score
// Verifies the admin session token, then forwards the score/court write to the
// Google Apps Script web app. Env: ADMIN_PIN, APPSCRIPT_URL, APPSCRIPT_SECRET

export const onRequestPost = async (context: any) => {
  const { ADMIN_PIN: pin, APPSCRIPT_URL: url, APPSCRIPT_SECRET: secret } = context.env
  if (!pin || !url || !secret) return json(500, { ok: false, error: 'not_configured' })

  let body: any
  try {
    body = await context.request.json()
  } catch {
    return json(400, { ok: false, error: 'bad_json' })
  }

  if (!(await verifyToken(body?.token, pin))) return json(401, { ok: false, error: 'unauthorized' })

  const tournament = body.tournament
  if (tournament !== 'men' && tournament !== 'women') return json(400, { ok: false, error: 'bad_tournament' })

  const matchNumber = parseInt(body.matchNumber, 10)
  if (!Number.isInteger(matchNumber) || matchNumber < 1 || matchNumber > 99)
    return json(400, { ok: false, error: 'bad_match' })

  const forward: any = { secret, tournament, matchNumber, sets: sanitizeSets(body.sets) }
  if (Object.prototype.hasOwnProperty.call(body, 'court')) forward.court = clampCourt(body.court)

  let data: any
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forward),
    })
    data = await res.json()
  } catch {
    return json(502, { ok: false, error: 'sheet_unreachable' })
  }
  if (!data || !data.ok) return json(502, { ok: false, error: (data && data.error) || 'write_failed' })
  return json(200, { ok: true, matchNumber, sets: forward.sets, court: forward.court })
}

function sanitizeSets(raw: any): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = []
  if (!Array.isArray(raw)) return out
  for (let i = 0; i < Math.min(raw.length, 3); i++) {
    const s = raw[i]
    if (!Array.isArray(s) || s.length !== 2) {
      out.push(null)
      continue
    }
    const a = clampScore(s[0])
    const b = clampScore(s[1])
    out.push(a === null || b === null ? null : [a, b])
  }
  return out
}
function clampScore(v: any): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = parseInt(v, 10)
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : null
}
function clampCourt(v: any): number | '' {
  if (v === '' || v === null || v === undefined) return ''
  const n = parseInt(v, 10)
  return Number.isInteger(n) && n >= 0 && n <= 50 ? n : ''
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
