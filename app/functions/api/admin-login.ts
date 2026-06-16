// Cloudflare Pages Function — POST /api/admin-login
// Validates the admin PIN and returns a signed 12h session token.
// Env: ADMIN_PIN

export const onRequestPost = async (context: any) => {
  const pin = context.env.ADMIN_PIN
  if (!pin) return json(500, { ok: false, error: 'not_configured' })

  let body: any = {}
  try {
    body = await context.request.json()
  } catch {
    /* ignore */
  }
  const given = String(body?.pin ?? '')
  if (!ctEq(given, pin)) return json(401, { ok: false })

  return json(200, { ok: true, token: await mintToken(pin) })
}

const SESSION_MS = 12 * 60 * 60 * 1000

async function mintToken(key: string) {
  const payload = btoa(JSON.stringify({ exp: Date.now() + SESSION_MS }))
  return `${payload}.${await hmacHex(key, payload)}`
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
  a = String(a)
  b = String(b)
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
