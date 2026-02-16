import { createMiddleware } from 'hono/factory'
import { getCookie, deleteCookie } from 'hono/cookie'
import { findSessionWithUser } from '../db/sessions.js'
import type { User } from '../db/users.js'

export type AuthVariables = {
  user: User | null
}

function signSessionId(sessionId: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) return sessionId
  const hasher = new Bun.CryptoHasher('sha256', secret)
  hasher.update(sessionId)
  const signature = hasher.digest('hex')
  return `${sessionId}.${signature}`
}

export function createSignedCookie(sessionId: string): string {
  return signSessionId(sessionId)
}

export function verifySessionCookie(cookie: string): string | null {
  const dotIndex = cookie.lastIndexOf('.')
  if (dotIndex === -1) return null

  const sessionId = cookie.substring(0, dotIndex)
  const signature = cookie.substring(dotIndex + 1)

  if (!sessionId || !signature) return null

  const expected = signSessionId(sessionId)
  const expectedSig = expected.substring(expected.lastIndexOf('.') + 1)

  if (signature.length !== expectedSig.length) return null

  // Constant-time comparison
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }

  return mismatch === 0 ? sessionId : null
}

// Requires authentication for UI routes - redirects to /login with redirect param
export const requireAuthUI = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    const url = new URL(c.req.url)
    const redirectTarget = url.pathname + url.search
    return c.redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`)
  }
  await next()
})

// Requires authentication for API routes - returns 401 JSON
export const requireAuthAPI = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  await next()
})

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const sessionCookie = getCookie(c, 'crashdsa_session')

  if (sessionCookie) {
    const sessionId = verifySessionCookie(sessionCookie)
    if (sessionId) {
      const result = await findSessionWithUser(sessionId)
      if (result) {
        c.set('user', result.user)
        await next()
        return
      }
    }
    // Invalid or expired session - clear cookie
    deleteCookie(c, 'crashdsa_session')
  }

  c.set('user', null)
  await next()
})
