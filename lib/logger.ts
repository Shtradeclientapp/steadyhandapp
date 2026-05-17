import * as Sentry from '@sentry/nextjs'

type Ctx = Record<string, unknown>

export function log(route: string, event: string, ctx?: Ctx) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', route, event, ...ctx }))
}

export function warn(route: string, event: string, ctx?: Ctx) {
  console.warn(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', route, event, ...ctx }))
}

export function error(route: string, event: string, err: unknown, ctx?: Ctx) {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', route, event, error: msg, ...ctx }))
  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope(scope => {
      scope.setTag('route', route)
      scope.setTag('event', event)
      if (ctx) scope.setExtras(ctx)
      Sentry.captureException(err instanceof Error ? err : new Error(msg))
    })
  }
}
