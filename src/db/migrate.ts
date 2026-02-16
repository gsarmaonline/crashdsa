import sql from './connection.js'

export async function runMigrations() {
  if (!sql) {
    console.log('DATABASE_URL not set, skipping migrations')
    return
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      github_id     INTEGER UNIQUE NOT NULL,
      username      VARCHAR(255) NOT NULL,
      display_name  VARCHAR(255),
      avatar_url    TEXT,
      email         VARCHAR(255),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id          UUID PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`
  await sql`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`

  console.log('Database migrations complete')
}
