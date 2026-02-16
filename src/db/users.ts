import sql from './connection.js'

export interface User {
  id: number
  github_id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
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
    INSERT INTO users (github_id, username, display_name, avatar_url, email)
    VALUES (${githubUser.id}, ${githubUser.login}, ${githubUser.name}, ${githubUser.avatar_url}, ${githubUser.email})
    ON CONFLICT (github_id)
    DO UPDATE SET
      username = ${githubUser.login},
      display_name = ${githubUser.name},
      avatar_url = ${githubUser.avatar_url},
      email = ${githubUser.email},
      updated_at = NOW()
    RETURNING *
  `
  return user!
}
