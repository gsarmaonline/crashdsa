import sql from './connection.js'

export interface User {
  id: number
  github_id: number | null
  google_id: string | null
  username: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

export async function findOrCreateUser(githubUser: {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
}): Promise<User> {
  if (!sql) throw new Error('Database not configured')

  const [user] = await sql<User[]>`
    INSERT INTO users (github_id, username, display_name, avatar_url, email, last_login_at)
    VALUES (${githubUser.id}, ${githubUser.login}, ${githubUser.name}, ${githubUser.avatar_url}, ${githubUser.email}, NOW())
    ON CONFLICT (github_id)
    DO UPDATE SET
      username = ${githubUser.login},
      display_name = ${githubUser.name},
      avatar_url = ${githubUser.avatar_url},
      email = ${githubUser.email},
      last_login_at = NOW(),
      updated_at = NOW()
    RETURNING *
  `
  return user!
}

export async function findOrCreateGoogleUser(googleUser: {
  sub: string
  name: string | null
  picture: string | null
  email: string | null
}): Promise<User> {
  if (!sql) throw new Error('Database not configured')

  const username = googleUser.email
    ? googleUser.email.split('@')[0]!
    : `google_${googleUser.sub.slice(0, 8)}`

  const [user] = await sql<User[]>`
    INSERT INTO users (google_id, username, display_name, avatar_url, email, last_login_at)
    VALUES (${googleUser.sub}, ${username}, ${googleUser.name}, ${googleUser.picture}, ${googleUser.email}, NOW())
    ON CONFLICT (google_id) WHERE google_id IS NOT NULL
    DO UPDATE SET
      display_name = ${googleUser.name},
      avatar_url = ${googleUser.picture},
      email = ${googleUser.email},
      last_login_at = NOW(),
      updated_at = NOW()
    RETURNING *
  `
  return user!
}
