# Score editing — one-time setup

The admin page can now enter set-by-set scores **and the court** straight into
the Google Sheet. Because the **Result**, **Tableau** and **Rangliste** tabs are
all formulas, the editor only writes the six per-set cells (`L,N / O,Q / R,T`)
plus the **Court** cell (`C`) of the **Resultate** sheet and the rest recomputes
itself; the public board picks the change up on its next auto-refresh.

The flow is:

```
admin.html  →  /.netlify/functions/update-score  →  Apps Script web app  →  Google Sheet
            (signed token)        (shared secret, server-side only)
```

You need to do three things once.

## 1. Deploy the Apps Script web app

1. Open **either** tournament Google Sheet → **Extensions → Apps Script**.
2. Delete the default code, paste the contents of `apps-script/Code.gs`.
3. Edit the `SECRET` line near the top — set it to a long random string
   (e.g. run `openssl rand -hex 24`). Keep this value; you'll reuse it in step 3.
4. Confirm the two IDs in `SPREADSHEETS` match your men/women sheets (they're the
   same IDs already used in `script.js`).
5. **Deploy ▸ New deployment ▸** gear icon **▸ Web app**:
   - **Description:** score write-back
   - **Execute as:** **Me** (your Google account — it owns both sheets)
   - **Who has access:** **Anyone**
6. Click **Deploy**, authorize when prompted, and **copy the Web app URL**
   (it ends in `/exec`).

> One script handles both sheets — it opens the right one by ID based on the
> `tournament` field. You do **not** need to deploy it twice.

## 2. Make sure the sheets are editable by you

The script runs as you, so it can already edit both sheets. No sharing changes
are needed for writing. (The sheets must stay **"Anyone with the link – Viewer"**
for the public board to keep *reading* them, which they already are.)

## 3. Set the Netlify environment variables

**Site settings → Environment variables**, add:

| Variable | Value |
|---|---|
| `ADMIN_PIN` | the organizer PIN (also signs the admin session) |
| `APPSCRIPT_URL` | the `/exec` URL from step 1.6 |
| `APPSCRIPT_SECRET` | the **same** string you put in `SECRET` in step 1.3 |

Then **redeploy** (or trigger a deploy) so the functions pick up the variables.

## Test it

1. Open `admin.html`, unlock with the PIN.
2. Under **Spielstände / Scores**, pick a tournament, type a set score, **Save**.
3. The cell should change in the Google Sheet within a second; the bracket and
   standings on `tableau.html` update on the next refresh (default ~10 s).

## If a save fails

- **"ADMIN_PIN is not set…"** → set the env vars (step 3) and redeploy.
- **Session expired** → unlock again (tokens last 12 h).
- **Error saving** → check the Apps Script deployment is **Anyone**-accessible and
  that `APPSCRIPT_SECRET` exactly equals `SECRET` in `Code.gs`. The Netlify
  function log shows the specific error (`sheet_unreachable`, `write_failed`, …).

> Runtime note: `update-score.js` uses the global `fetch`, which requires the
> Netlify Functions Node runtime to be **18 or newer** (the current default).
