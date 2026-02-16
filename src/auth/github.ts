const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USER_URL = 'https://api.github.com/user'

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
}

export function getGitHubAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL || 'https://crashdsa.com'}/auth/github/callback`,
    scope: 'read:user user:email',
    state,
  })
  return `${GITHUB_AUTH_URL}?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string }
  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to exchange code for token')
  }
  return data.access_token
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json() as Promise<GitHubUser>
}
