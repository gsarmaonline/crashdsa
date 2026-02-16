import postgres from 'postgres'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set, skipping migrations')
  process.exit(0)
}

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

async function migrate() {
  // Create Prisma's migration tracking table (compatible format)
  await sql`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `

  // Get already-applied migrations
  const applied = await sql`SELECT "migration_name" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL`
  const appliedNames = new Set(applied.map(r => r.migration_name))

  // Read migration directories
  const migrationsDir = join(import.meta.dir, '..', 'prisma', 'migrations')
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'migration_lock.toml')
    .map(d => d.name)
    .sort()

  let count = 0
  for (const dir of dirs) {
    if (appliedNames.has(dir)) continue

    const sqlFile = join(migrationsDir, dir, 'migration.sql')
    let migrationSql: string
    try {
      migrationSql = readFileSync(sqlFile, 'utf-8')
    } catch {
      console.log(`Skipping ${dir}: no migration.sql found`)
      continue
    }

    console.log(`Applying migration: ${dir}`)
    const id = crypto.randomUUID()
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(migrationSql)
        await tx`
          INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
          VALUES (${id}, ${checksum(migrationSql)}, ${dir}, NOW(), 1)
        `
      })
      count++
      console.log(`Applied: ${dir}`)
    } catch (err) {
      console.error(`Failed to apply migration ${dir}:`, err)
      process.exit(1)
    }
  }

  console.log(count > 0 ? `Applied ${count} migration(s)` : 'No pending migrations')
  await sql.end()
}

function checksum(content: string): string {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(content)
  return hasher.digest('hex')
}

await migrate()
