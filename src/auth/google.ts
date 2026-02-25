const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export interface GoogleUser {
  sub: string
  name: string | null
  picture: string | null
  email: string | null
}

export function getGoogleAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL || 'https://crashdsa.com'}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    access_type: 'online',
  })
  return `${GOOGLE_AUTH_URL}?${params}`
}

export async function exchangeGoogleCodeForToken(code: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL || 'https://crashdsa.com'}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const data = (await response.json()) as { access_token?: string; error?: string }
  if (data.error || !data.access_token) {
    throw new Error(data.error || 'Failed to exchange code for token')
  }
  return data.access_token
}

export async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(GOOGLE_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`)
  }

  return response.json() as Promise<GoogleUser>
}
