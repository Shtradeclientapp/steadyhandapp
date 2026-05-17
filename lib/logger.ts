type Ctx = Record<string, unknown>

export function log(route: string, event: string, ctx?: Ctx) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', route, event, ...ctx }))
}

export function warn(route: string, event: string, ctx?: Ctx) {
  console.warn(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', route, event, ...ctx }))
}

export function error(route: string, event: string, err: unknown, ctx?: Ctx) {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route, event, error: msg }))
}
