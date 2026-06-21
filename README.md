# ZuZu Beach — live tournament board

A live scoreboard for a beach‑volleyball tournament. It shows what's **playing
now** and **up next** on every court, a knockout **tableau**, the full **game
list**, and a **standings** table — all driven straight from the organizer's
Google Sheets and refreshed automatically. Built to run on a venue display in
**fullscreen kiosk** mode, with a spectator **QR code** that points phones at
the same live board.

> The UI ships bilingual (German / English, default German). It's themed for
> "ZuZu Beach" but everything — name, colors, data — is configurable.

---

## How it works

```
Google Sheets ──(xlsx export, public read)──▶ React SPA (Cloudflare Pages)
   ▲                                              │
   │ score write‑back                             │  /api/* (Pages Functions)
   │                                              ▼
Apps Script web app ◀────── /api/update-score ── Admin page (PIN)
                                                  /api/notes  ── Cloudflare KV
```

- **Data** is read **client‑side** from each sheet's public `…/export?format=xlsx`
  URL — no API key, the sheets just need to be "Anyone with the link → Viewer".
- **Pages Functions** (`app/functions/api/*`) are tiny serverless endpoints on
  the Workers runtime:
  - `admin-login` — checks the organizer PIN, issues a signed session token.
  - `notes` — reads/writes the start‑page info banner, stored in **Cloudflare KV**.
  - `update-score` — forwards admin score edits to a **Google Apps Script** web
    app, which writes them back into the sheet.
- The board re‑fetches the sheets on a timer (default every 10 s), so edits show
  up within seconds with no rebuild.

**Tech:** React 19 · Vite 6 · TypeScript · Tailwind v4 · React Router · TanStack
Query · i18next · Radix/shadcn UI · `xlsx` · Cloudflare Pages + Functions + KV.

---

## Quick start (local)

```bash
git clone git@github.com:Lucanepa/beach_tournament.git
cd beach_tournament/app
npm install
npm run dev            # http://localhost:5173
```

`vite` serves the SPA only. It reads the **live Google Sheets** directly, so the
board works locally out of the box (pointed at the demo sheets until you swap in
your own — see below).

> The `/api/*` functions are **not** served by `vite`. To exercise them locally,
> build first and run the Pages emulator:
> ```bash
> npm run build
> npx wrangler pages dev dist        # serves SPA + functions; bind KV/vars as needed
> ```

---

## Point it at your own tournament

1. **Create / copy the Google Sheets** (one per tournament — e.g. men + women).
   Each sheet needs a **`Match`** tab (preferred) **or** a **`Resultate`** tab,
   plus an optional **`Rangliste`** tab for standings. The parser reads fixed
   columns — see `COLS` in [`app/src/lib/tournament.ts`](app/src/lib/tournament.ts)
   for the exact `Match` / `Resultate` column layout (match #, round, court,
   time, teams, per‑set scores, status, sex).
2. **Share each sheet** "Anyone with the link → **Viewer**" so the xlsx export is
   publicly readable.
3. **Set the sheet IDs.** Edit `DATA_SOURCES` in
   [`app/src/lib/tournament.ts`](app/src/lib/tournament.ts) — replace the
   `googleId` values (and `label` text) with your own. The sheet ID is the long
   string in the sheet URL: `docs.google.com/spreadsheets/d/<THIS>/edit`. Add or
   remove keys here to support a different number of tournaments.

There's nothing else to wire up for a read‑only board — it'll start showing your
data immediately.

---

## Organizer settings

Open **`/admin`** (gear icon, top‑right) and unlock with the PIN. Settings are
stored per‑device in `localStorage` (`getSettings` in
[`app/src/lib/settings.ts`](app/src/lib/settings.ts)):

| Setting | Meaning |
|---|---|
| **Court count** | Fixed number of courts to show. `0` = auto‑detect from the data. |
| **Refresh seconds** | How often the board re‑reads the sheets (min 3, default 10). |
| **Tournaments** | Which `DATA_SOURCES` keys are active (e.g. `men`, `women`). |
| **Default language** | `de` or `en`. |

The admin page also edits the **start‑page info note** (saved to KV, shared
across all devices) and — if the Apps Script is set up — **set‑by‑set scores and
the court** for each match.

### Kiosk / fullscreen

The Courts page has a **Vollbild / Fullscreen** button. In fullscreen all the
chrome (nav bar, hero, info note, team filter) collapses so only the court grid
shows; a small floating button (and `Esc`) exits. Ideal for a venue monitor.

---

## Deploy (Cloudflare Pages)

The app deploys as a **Cloudflare Pages** project connected to this Git repo;
pushing to `main` triggers a production build. Full steps are in
[`app/DEPLOY.md`](app/DEPLOY.md). In short:

- **Build settings:** Root directory `app`, build `npm install && npm run build`,
  output `dist`. Functions are auto‑detected from `app/functions/`.
- **KV binding:** create a KV namespace and bind it as **`NOTES`**
  (Pages → Settings → Functions → KV namespace bindings).
- **Environment variables** (Production + Preview):

  | Variable | Purpose |
  |---|---|
  | `ADMIN_PIN` | Organizer PIN; also signs the admin session token. |
  | `APPSCRIPT_URL` | The Apps Script web‑app `/exec` URL (score write‑back). |
  | `APPSCRIPT_SECRET` | Shared secret; must equal `SECRET` in the Apps Script. |

The SPA fallback (`app/public/_redirects`) and `/api/*` routing are already
configured — no `nodejs_compat` flag needed.

> Don't need score editing? You can skip `APPSCRIPT_*` (and the Apps Script
> step). The board still reads and displays everything; only admin score writes
> are disabled.

---

## Optional: score write‑back (Google Apps Script)

To let the admin page write scores into the sheet, deploy the Apps Script web app
and set the `APPSCRIPT_*` vars. Step‑by‑step (deploy as web app, set `SECRET`,
confirm sheet IDs, copy the `/exec` URL) is in
[`apps-script/SETUP.md`](apps-script/SETUP.md); the script itself is
[`apps-script/Code.gs`](apps-script/Code.gs).

> Note: `apps-script/SETUP.md` predates the Cloudflare migration and still says
> "Netlify" in places — the env‑var **values** are identical, they just live in
> the Cloudflare Pages dashboard now (see Deploy above).

---

## Repo layout

```
app/
  src/
    pages/        Courts · Tableau · AllGames · Admin
    lib/          tournament.ts (data + sheet IDs) · settings.ts · api.ts · i18n.ts
    components/   Layout, TeamFilter, shadcn ui/
  functions/api/  admin-login · notes · update-score   (Cloudflare Pages Functions)
  public/         _redirects (SPA fallback), logo
  DEPLOY.md       Cloudflare Pages setup
apps-script/      Code.gs + SETUP.md  (score write‑back)
```

---

## Customizing the brand

- **Colors / theme:** CSS tokens at the top of `app/src/index.css` (`@theme` +
  `:root`).
- **Name & copy:** translation strings in `app/src/lib/i18n.ts`.
- **Logo:** `app/public/ZuZU.png` (referenced in `Layout.tsx`).
