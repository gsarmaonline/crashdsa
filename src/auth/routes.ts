import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { getGitHubAuthURL, exchangeCodeForToken, fetchGitHubUser } from './github.js'
import { createSignedCookie, verifySessionCookie, type AuthVariables } from './middleware.js'
import { findOrCreateUser } from '../db/users.js'
import { createSession, deleteSession } from '../db/sessions.js'
import { loginPage } from '../views/login.js'

const auth = new Hono<{ Variables: AuthVariables }>()

const isSecure = () => (process.env.APP_URL || '').startsWith('https')

// Initiate GitHub OAuth
auth.get('/auth/github', (c) => {
  const state = crypto.randomUUID()

  setCookie(c, 'crashdsa_oauth_state', state, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'Lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  return c.redirect(getGitHubAuthURL(state))
})

// GitHub OAuth callback
auth.get('/auth/github/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, 'crashdsa_oauth_state')

  // Clean up OAuth state cookie
  deleteCookie(c, 'crashdsa_oauth_state')

  if (!code || !state || state !== storedState) {
    return c.redirect('/login?error=invalid_state')
  }

  try {
    const accessToken = await exchangeCodeForToken(code)
    const githubUser = await fetchGitHubUser(accessToken)
    const user = await findOrCreateUser(githubUser)
    const session = await createSession(user.id)

    setCookie(c, 'crashdsa_session', createSignedCookie(session.id), {
      httpOnly: true,
      secure: isSecure(),
      sameSite: 'Lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return c.redirect('/')
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return c.redirect('/login?error=auth_failed')
  }
})

// Logout
auth.get('/auth/logout', async (c) => {
  const sessionCookie = getCookie(c, 'crashdsa_session')

  if (sessionCookie) {
    const sessionId = verifySessionCookie(sessionCookie)
    if (sessionId) {
      await deleteSession(sessionId)
    }
  }

  deleteCookie(c, 'crashdsa_session')
  return c.redirect('/')
})

// Login page
auth.get('/login', (c) => {
  const user = c.get('user')
  if (user) return c.redirect('/')

  const error = c.req.query('error')
  return c.html(loginPage(error))
})

export default auth
