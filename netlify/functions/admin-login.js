// Netlify Function — validates the admin PIN server-side.
//
// Set the secret once in the Netlify dashboard:
//   Site settings → Environment variables → add  ADMIN_PIN = <your pin>
// The PIN is read from process.env here and is NEVER sent to the browser.

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

    const ok = pin.length === expected.length && pin === expected;
    return json(ok ? 200 : 401, { ok });
};

function json(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(body),
    };
}
