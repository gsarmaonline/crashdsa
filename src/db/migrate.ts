import defaultSql from './connection.js'

export async function runMigrations(sql = defaultSql) {
  if (!sql) {
    console.log('DATABASE_URL not set, skipping migrations')
    return
  }

  // Acquire advisory lock to prevent conflicts with scripts/migrate.ts (release command)
  const LOCK_ID = 728374
  await sql`SELECT pg_advisory_lock(${LOCK_ID})`

  try {
    await runMigrationsInner(sql)
  } finally {
    await sql`SELECT pg_advisory_unlock(${LOCK_ID})`
  }
}

async function runMigrationsInner(sql: NonNullable<typeof defaultSql>) {
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
  await sql`CREATE INDEX IF NOT EXISTS idx_solved_at ON user_solved_problems(solved_at DESC)`

  // Prisma schema column additions — only run if Prisma has already created these tables
  // (in production Prisma migrations run first; locally they may not exist yet)
  await sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Problem') THEN
        ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "description" TEXT;
        ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "examples" JSONB;
        ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "constraints" JSONB;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TestCaseSet') THEN
        ALTER TABLE "TestCaseSet" ADD COLUMN IF NOT EXISTS "starterCode" JSONB;
        ALTER TABLE "TestCaseSet" ADD COLUMN IF NOT EXISTS "functionNameMap" JSONB;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Pattern') THEN
        ALTER TABLE "Pattern" ADD COLUMN IF NOT EXISTS "strategy" TEXT NOT NULL DEFAULT '';
      END IF;
    END $$
  `

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`

  // Google OAuth support: make github_id nullable, add google_id
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'github_id' AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
      END IF;
    END $$
  `
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL`

  // Study groups
  await sql`
    CREATE TABLE IF NOT EXISTS study_groups (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      description   TEXT,
      invite_code   VARCHAR(32) UNIQUE NOT NULL,
      created_by    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by)`
  await sql`CREATE INDEX IF NOT EXISTS idx_study_groups_invite_code ON study_groups(invite_code)`

  await sql`
    CREATE TABLE IF NOT EXISTS study_group_members (
      id          SERIAL PRIMARY KEY,
      group_id    INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        VARCHAR(20) NOT NULL DEFAULT 'member',
      joined_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_sgm_group_id ON study_group_members(group_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sgm_user_id ON study_group_members(user_id)`

  console.log('Database migrations complete')
}
