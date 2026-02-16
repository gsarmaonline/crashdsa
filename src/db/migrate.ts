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

  await sql`
    CREATE TABLE IF NOT EXISTS user_solved_problems (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_slug  VARCHAR(255) NOT NULL,
      solved_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, problem_slug)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_solved_user ON user_solved_problems(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_solved_slug ON user_solved_problems(problem_slug)`

  // Prisma schema column additions (idempotent with IF NOT EXISTS)
  await sql`ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "description" TEXT`
  await sql`ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "examples" JSONB`
  await sql`ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "constraints" JSONB`
  await sql`ALTER TABLE "TestCaseSet" ADD COLUMN IF NOT EXISTS "starterCode" JSONB`
  await sql`ALTER TABLE "TestCaseSet" ADD COLUMN IF NOT EXISTS "functionNameMap" JSONB`
  await sql`ALTER TABLE "Pattern" ADD COLUMN IF NOT EXISTS "strategy" TEXT NOT NULL DEFAULT ''`

  console.log('Database migrations complete')
}
