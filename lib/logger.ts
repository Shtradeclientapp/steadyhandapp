type Ctx = Record<string, unknown>

function emit(level: 'info' | 'warn' | 'error', route: string, event: string, ctx?: Ctx) {
  const fn = level === 'info' ? console.log : level === 'warn' ? console.warn : console.error
  fn(JSON.stringify({ ts: new Date().toISOString(), level, route, event, ...ctx }))
}

export const log   = (route: string, event: string, ctx?: Ctx) => emit('info',  route, event, ctx)
export const warn  = (route: string, event: string, ctx?: Ctx) => emit('warn',  route, event, ctx)
export const error = (route: string, event: string, err: unknown, ctx?: Ctx) =>
  emit('error', route, event, { error: err instanceof Error ? err.message : String(err), ...ctx })
