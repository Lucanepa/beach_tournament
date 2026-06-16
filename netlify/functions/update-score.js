// Netlify Function — authorize an admin and forward a score update to the
// Google Apps Script web app (which writes the set scores into the sheet).
//
// Required Netlify environment variables:
//   ADMIN_PIN         the organizer PIN (also used to sign session tokens)
//   APPSCRIPT_URL     the deployed Apps Script web-app /exec URL
//   APPSCRIPT_SECRET  the shared secret, must equal SECRET in apps-script/Code.gs
//
// The browser never sees APPSCRIPT_URL or APPSCRIPT_SECRET; it only holds a
// short-lived signed session token issued by admin-login.js, which is
// re-verified here on every write.

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const pin = process.env.ADMIN_PIN;
  const url = process.env.APPSCRIPT_URL;
  const secret = process.env.APPSCRIPT_SECRET;
  if (!pin || !url || !secret) {
    return json(500, { ok: false, error: 'not_configured' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { ok: false, error: 'bad_json' }); }

  if (!verifyToken(body.token, pin)) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const tournament = body.tournament;
  if (tournament !== 'men' && tournament !== 'women') {
    return json(400, { ok: false, error: 'bad_tournament' });
  }

  const matchNumber = parseInt(body.matchNumber, 10);
  if (!Number.isInteger(matchNumber) || matchNumber < 1 || matchNumber > 99) {
    return json(400, { ok: false, error: 'bad_match' });
  }

  const sets = sanitizeSets(body.sets);

  // Court is optional. Forward it only when the client sent the field, so a
  // score-only save never touches the court column (and vice-versa).
  const forward = { secret, tournament, matchNumber, sets };
  if (Object.prototype.hasOwnProperty.call(body, 'court')) {
    forward.court = clampCourt(body.court);
  }

  let data;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forward),
    });
    data = await res.json();
  } catch (e) {
    return json(502, { ok: false, error: 'sheet_unreachable' });
  }

  if (!data || !data.ok) {
    return json(502, { ok: false, error: (data && data.error) || 'write_failed' });
  }
  return json(200, { ok: true, matchNumber, sets, court: forward.court });
};

// Court: '' (clear) or an integer 0..50; anything else clears it.
function clampCourt(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = parseInt(v, 10);
  return (Number.isInteger(n) && n >= 0 && n <= 50) ? n : '';
}

// Keep at most 3 sets; each set must be a [a,b] pair of integers 0..99 or it
// is dropped to null (which clears that set in the sheet).
function sanitizeSets(raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < Math.min(raw.length, 3); i++) {
    const s = raw[i];
    if (!Array.isArray(s) || s.length !== 2) { out.push(null); continue; }
    const a = clampScore(s[0]);
    const b = clampScore(s[1]);
    out.push((a === null || b === null) ? null : [a, b]);
  }
  return out;
}

function clampScore(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

// Verify an HMAC session token of the form base64(payload).hex(sig), where
// payload = {exp:<epoch ms>} and sig = HMAC-SHA256(payloadB64, key=ADMIN_PIN).
function verifyToken(token, key) {
  if (typeof token !== 'string' || token.indexOf('.') === -1) return false;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;
  const expected = crypto.createHmac('sha256', key).update(payloadB64).digest('hex');
  let a, b;
  try { a = Buffer.from(sig, 'hex'); b = Buffer.from(expected, 'hex'); }
  catch (e) { return false; }
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  let payload;
  try { payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8')); }
  catch (e) { return false; }
  return payload && typeof payload.exp === 'number' && Date.now() <= payload.exp;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}
