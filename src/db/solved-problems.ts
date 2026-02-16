import sql from './connection.js'

export interface SolvedProblem {
  problem_slug: string
  solved_at: Date
}

export async function markProblemSolved(userId: number, problemSlug: string): Promise<{ firstSolve: boolean }> {
  if (!sql) throw new Error('Database not configured')

  const result = await sql`
    INSERT INTO user_solved_problems (user_id, problem_slug)
    VALUES (${userId}, ${problemSlug})
    ON CONFLICT (user_id, problem_slug) DO NOTHING
    RETURNING id
  `
  return { firstSolve: result.length > 0 }
}

export async function getUserSolvedProblems(userId: number): Promise<SolvedProblem[]> {
  if (!sql) return []

  return sql<SolvedProblem[]>`
    SELECT problem_slug, solved_at
    FROM user_solved_problems
    WHERE user_id = ${userId}
    ORDER BY solved_at DESC
  `
}

export async function getUserSolvedSlugs(userId: number): Promise<string[]> {
  if (!sql) return []

  const rows = await sql<{ problem_slug: string }[]>`
    SELECT problem_slug
    FROM user_solved_problems
    WHERE user_id = ${userId}
  `
  return rows.map(r => r.problem_slug)
}

export async function getUserSolvedCount(userId: number): Promise<number> {
  if (!sql) return 0

  const [row] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM user_solved_problems
    WHERE user_id = ${userId}
  `
  return parseInt(row.count, 10)
}
