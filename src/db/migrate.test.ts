import { describe, it, expect, spyOn } from 'bun:test'
import { runMigrations } from './migrate.js'

function createMockSql() {
  const calls: string[] = []
  const fn = function sql(strings: TemplateStringsArray, ...values: any[]) {
    calls.push(strings.join('').trim())
    return Promise.resolve([])
  }
  return { fn, calls }
}

describe('runMigrations', () => {
  it('creates users table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const match = calls.find(s => s.includes('CREATE TABLE IF NOT EXISTS users'))
    expect(match).toBeDefined()
    expect(match).toContain('github_id')
    expect(match).toContain('username')
  })

  it('creates sessions table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const match = calls.find(s => s.includes('CREATE TABLE IF NOT EXISTS sessions'))
    expect(match).toBeDefined()
    expect(match).toContain('user_id')
    expect(match).toContain('expires_at')
  })

  it('creates user_solved_problems table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const match = calls.find(s => s.includes('CREATE TABLE IF NOT EXISTS user_solved_problems'))
    expect(match).toBeDefined()
    expect(match).toContain('problem_slug')
  })

  it('creates indexes for sessions and users', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    expect(calls.some(s => s.includes('idx_sessions_user_id'))).toBe(true)
    expect(calls.some(s => s.includes('idx_sessions_expires_at'))).toBe(true)
    expect(calls.some(s => s.includes('idx_users_github_id'))).toBe(true)
  })

  it('creates indexes for solved problems', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    expect(calls.some(s => s.includes('idx_solved_user'))).toBe(true)
    expect(calls.some(s => s.includes('idx_solved_slug'))).toBe(true)
  })

  it('adds missing Prisma columns to Problem table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    expect(calls.some(s => s.includes('"Problem"') && s.includes('"description"'))).toBe(true)
    expect(calls.some(s => s.includes('"Problem"') && s.includes('"examples"'))).toBe(true)
    expect(calls.some(s => s.includes('"Problem"') && s.includes('"constraints"'))).toBe(true)
  })

  it('adds missing Prisma columns to TestCaseSet table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    expect(calls.some(s => s.includes('"TestCaseSet"') && s.includes('"starterCode"'))).toBe(true)
    expect(calls.some(s => s.includes('"TestCaseSet"') && s.includes('"functionNameMap"'))).toBe(true)
  })

  it('adds strategy column to Pattern table with NOT NULL default', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const match = calls.find(s => s.includes('"Pattern"') && s.includes('"strategy"'))
    expect(match).toBeDefined()
    expect(match).toContain('NOT NULL')
    expect(match).toContain("DEFAULT ''")
  })

  it('adds last_login_at column to users table', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const match = calls.find(s => s.includes('users') && s.includes('last_login_at'))
    expect(match).toBeDefined()
    expect(match).toContain('TIMESTAMPTZ')
  })

  it('uses IF NOT EXISTS for all ALTER TABLE statements', async () => {
    const { fn, calls } = createMockSql()
    await runMigrations(fn as any)
    const alterCalls = calls.filter(s => s.includes('ALTER TABLE'))
    expect(alterCalls.length).toBe(7)
    for (const call of alterCalls) {
      expect(call).toContain('IF NOT EXISTS')
    }
  })

  it('skips migrations when sql connection is null', async () => {
    const consoleSpy = spyOn(console, 'log')
    await runMigrations(null as any)
    expect(consoleSpy).toHaveBeenCalledWith('DATABASE_URL not set, skipping migrations')
    consoleSpy.mockRestore()
  })
})
