# Deploy — Cloudflare Pages (free)

The React app (this `app/` folder) deploys to **Cloudflare Pages**. The two
serverless endpoints live in `app/functions/api/` and run as **Pages Functions**
on the Workers runtime (no Node APIs — they use `crypto.subtle`).

## One-time: create the Pages project

1. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.**
2. Pick the `Lucanepa/beach_tournament` repo, branch `react-rebuild` (or `main`
   once merged).
3. **Build settings:**
   - **Framework preset:** None / Vite
   - **Root directory:** `app`
   - **Build command:** `npm install && npm run build`
   - **Build output directory:** `dist`
   - Functions are auto-detected from `app/functions/`.
4. **Environment variables** (add under Settings → Environment variables, for
   **Production** and **Preview**):

   | Name | Value |
   |---|---|
   | `ADMIN_PIN` | `348452` |
   | `APPSCRIPT_SECRET` | the same secret set in the Apps Script `SECRET` |
   | `APPSCRIPT_URL` | the Apps Script `/exec` URL |

5. **Save and Deploy.** You get a `*.pages.dev` URL. Custom domain optional
   (Pages → Custom domains).

No `nodejs_compat` flag is needed. The SPA fallback (`_redirects` → `/index.html`)
and `/api/*` function routing are already configured.

## Local dev

```
cd app
npm install
npm run dev      # http://localhost:5173  (functions are NOT served by vite;
                 # test /api/* against the deployed Pages preview, or use
                 # `npx wrangler pages dev dist` after a build)
```

## Notes
- The Apps Script setup is unchanged from the Netlify version — see
  `../apps-script/SETUP.md`. Only the env vars move to Cloudflare.
- The old vanilla site + Netlify stay live on `main` until you cut over.
