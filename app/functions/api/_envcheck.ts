// TEMP DEBUG — reports which env vars the Pages Functions runtime sees.
// Returns only booleans + the list of binding NAMES (never values). Remove after.
export const onRequest = async (context: any) => {
  const env = context.env || {}
  const present: Record<string, boolean> = {}
  for (const k of ['ADMIN_PIN', 'APPSCRIPT_URL', 'APPSCRIPT_SECRET']) present[k] = !!env[k]
  return new Response(JSON.stringify({ present, keys: Object.keys(env) }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
