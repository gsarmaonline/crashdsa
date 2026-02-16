import sql from './connection.js'
import type { User } from './users.js'

const SESSION_DURATION_DAYS = 30

export interface Session {
  id: string
  user_id: number
  expires_at: Date
  created_at: Date
}

export async function createSession(userId: number): Promise<Session> {
  if (!sql) throw new Error('Database not configured')

  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const [session] = await sql<Session[]>`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${id}, ${userId}, ${expiresAt})
    RETURNING *
  `
  return session!
}

export async function findSessionWithUser(sessionId: string): Promise<{ session: Session; user: User } | null> {
  if (!sql) return null

  const rows = await sql`
    SELECT
      s.id as session_id, s.user_id, s.expires_at, s.created_at as session_created_at,
      u.id, u.github_id, u.username, u.display_name, u.avatar_url, u.email, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    session: {
      id: row.session_id,
      user_id: row.user_id,
      expires_at: row.expires_at,
      created_at: row.session_created_at,
    },
    user: {
      id: row.id,
      github_id: row.github_id,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      email: row.email,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!sql) return
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`
}
