// Netlify Function — validates the admin PIN server-side and, on success,
// issues a short-lived signed session token used to authorize score writes
// (see update-score.js). The PIN is read from process.env and is NEVER sent
// to the browser.
//
// Set the secret once in the Netlify dashboard:
//   Site settings → Environment variables → add  ADMIN_PIN = <your pin>

const crypto = require('crypto');

const SESSION_MS = 12 * 60 * 60 * 1000; // token valid for 12h (one event day)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    // ADMIN_PIN hasn't been configured in Netlify yet.
    return json(500, { ok: false, error: 'not_configured' });
  }

  let pin = '';
  try { pin = String(JSON.parse(event.body || '{}').pin || ''); } catch (e) { /* ignore */ }

  if (!constantTimeEquals(pin, expected)) {
    return json(401, { ok: false });
  }

  return json(200, { ok: true, token: mintToken(expected) });
};

// Constant-time string comparison (avoids leaking length/content via timing).
function constantTimeEquals(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Signed token: base64(payload).hex(HMAC-SHA256(payloadB64, key=ADMIN_PIN)).
function mintToken(key) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS })).toString('base64');
  const sig = crypto.createHmac('sha256', key).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}
