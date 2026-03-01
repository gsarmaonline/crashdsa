import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from './src/data/db.js'
import {
  getAllProblems,
  getProblemBySlug,
  getProblemsByPattern,
  getPatterns,
  getStats,
  getTestCasesForProblem,
  getTestCaseStats,
  getJudgeDefinition,
  getJudgeReadySlugs,
} from './src/data/problem-repository.js'
import { homePageDynamic } from './src/views/home-dynamic.js'
import { problemsPage } from './src/views/problems.js'
import { problemDetailPage } from './src/views/problem-detail.js'
import { patternsPage } from './src/views/patterns.js'
import { patternDetailPage } from './src/views/pattern-detail.js'
import { progressPage } from './src/views/progress.js'
import { groupsPage } from './src/views/groups.js'
import { groupDetailPage } from './src/views/group-detail.js'
import { authMiddleware, requireAuthUI, requireAuthAPI, type AuthVariables } from './src/auth/middleware.js'
import authRoutes from './src/auth/routes.js'
import groupRoutes from './src/groups/routes.js'
import notificationRoutes from './src/notifications/routes.js'
import { runMigrations } from './src/db/migrate.js'
import { markProblemSolved, getUserSolvedProblems, getUserSolvedSlugs } from './src/db/solved-problems.js'
import { executeViaJudge0 } from './src/judge0/executor.js'
import type { ExecuteRequest } from './src/judge0/types.js'

const app = new Hono<{ Variables: AuthVariables }>()

// Eagerly connect to database
console.log('Initializing CrashDSA...')
prisma.$connect().then(() => console.log('Database connected'))
await runMigrations()

// Auth middleware - loads user from session on every request
app.use('*', authMiddleware)

// Auth routes
app.route('/', authRoutes)

// Protected UI routes - require GitHub login
app.use('/problems', requireAuthUI)
app.use('/problems/*', requireAuthUI)
app.use('/patterns', requireAuthUI)
app.use('/patterns/*', requireAuthUI)
app.use('/progress', requireAuthUI)
app.use('/groups', requireAuthUI)
app.use('/groups/*', requireAuthUI)

// Protected API routes - require GitHub login
app.use('/api/problems', requireAuthAPI)
app.use('/api/problems/*', requireAuthAPI)
app.use('/api/patterns', requireAuthAPI)
app.use('/api/patterns/*', requireAuthAPI)
app.use('/api/stats', requireAuthAPI)
app.use('/api/judge/*', requireAuthAPI)
app.use('/api/test-cases/*', requireAuthAPI)
app.use('/api/user/*', requireAuthAPI)
app.use('/api/groups', requireAuthAPI)
app.use('/api/groups/*', requireAuthAPI)

// Study group API routes (must be after auth middleware)
app.route('/', groupRoutes)

// Notification API routes (must be after auth middleware)
app.route('/', notificationRoutes)

// UI Routes
app.get('/', async (c) => {
  return c.html(await homePageDynamic(c.get('user')))
})

app.get('/problems', (c) => {
  return c.html(problemsPage(c.get('user')))
})

app.get('/patterns', async (c) => {
  return c.html(await patternsPage(c.get('user')))
})

app.get('/progress', (c) => {
  return c.html(progressPage(c.get('user')))
})

app.get('/groups', (c) => {
  return c.html(groupsPage(c.get('user')))
})

app.get('/groups/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.text('Invalid group ID', 400)
  return c.html(groupDetailPage(id, c.get('user')))
})

app.get('/patterns/:name', async (c) => {
  const name = c.req.param('name')
  const page = await patternDetailPage(name, c.get('user'))
  if (!page) return c.text('Pattern not found', 404)
  return c.html(page)
})

// Problem detail page (judge)
app.get('/problems/:slug', async (c) => {
  const slug = c.req.param('slug')
  const problem = await getProblemBySlug(slug)

  if (!problem) {
    return c.html('<h1>Problem not found</h1>', 404)
  }

  return c.html(problemDetailPage(problem, c.get('user')))
})

// Serve judge static files (JS, CSS)
app.get('/judge/*', (c) => {
  const filePath = c.req.path
  const fullPath = join(process.cwd(), 'src', filePath)

  try {
    const content = readFileSync(fullPath, 'utf-8')
    const ext = filePath.split('.').pop() || ''
    const contentTypes: Record<string, string> = {
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'wasm': 'application/wasm'
    }
    return c.body(content, 200, {
      'Content-Type': contentTypes[ext] || 'text/plain'
    })
  } catch {
    return c.notFound()
  }
})

// Serve CSS
app.get('/styles.css', (c) => {
  try {
    const css = readFileSync(join(process.cwd(), 'src', 'styles', 'styles.css'), 'utf-8')
    return c.body(css, 200, { 'Content-Type': 'text/css' })
  } catch {
    return c.text('Not found', 404)
  }
})

// Serve favicon
app.get('/favicon.svg', (c) => {
  try {
    const svg = readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf-8')
    return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' })
  } catch {
    return c.text('Not found', 404)
  }
})

app.get('/favicon.ico', (c) => {
  try {
    const svg = readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf-8')
    return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' })
  } catch {
    return c.text('Not found', 404)
  }
})

// Serve pattern animation SVGs
app.get('/animations/:name', (c) => {
  const name = c.req.param('name')
  if (!/^[a-z0-9-]+\.svg$/.test(name)) {
    return c.text('Not found', 404)
  }
  try {
    const svg = readFileSync(join(process.cwd(), 'public', 'animations', name), 'utf-8')
    return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' })
  } catch {
    return c.text('Not found', 404)
  }
})

// API Routes
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono API!' })
})

// Get all problems or filter by difficulty
app.get('/api/problems', async (c) => {
  const difficulty = c.req.query('difficulty')
  const result = await getAllProblems(difficulty)
  return c.json(result)
})

// Get problems by pattern
app.get('/api/problems/pattern/:pattern', async (c) => {
  const pattern = c.req.param('pattern')
  const result = await getProblemsByPattern(pattern)

  if (!result) {
    return c.json({ error: 'Pattern not found' }, 404)
  }

  return c.json(result)
})

// Get all available patterns
app.get('/api/patterns', async (c) => {
  const result = await getPatterns()
  return c.json(result)
})

// Get statistics
app.get('/api/stats', async (c) => {
  const stats = await getStats()
  return c.json(stats)
})

// Get single problem by slug
app.get('/api/problems/:slug', async (c) => {
  const slug = c.req.param('slug')
  const problem = await getProblemBySlug(slug)

  if (!problem) {
    return c.json({ error: 'Problem not found' }, 404)
  }

  return c.json({ problem })
})

// Get problem judge definition (test cases + function signatures)
app.get('/api/problems/:slug/judge', async (c) => {
  const slug = c.req.param('slug')
  const judgeDef = await getJudgeDefinition(slug)

  if (!judgeDef) {
    return c.json({ error: 'Problem definition not found' }, 404)
  }

  return c.json(judgeDef)
})

// Get test cases for a specific problem
app.get('/api/problems/:slug/test-cases', async (c) => {
  const slug = c.req.param('slug')
  const testCases = await getTestCasesForProblem(slug)

  if (!testCases) {
    return c.json({ error: 'Test cases not found for this problem' }, 404)
  }

  return c.json(testCases)
})

// List problems with judge support
app.get('/api/judge/problems', async (c) => {
  const slugs = await getJudgeReadySlugs()
  return c.json({ slugs })
})

// Execute code via Judge0 (server-side)
app.post('/api/judge/execute', async (c) => {
  const { slug, code, language } = await c.req.json<ExecuteRequest>()
  try {
    const results = await executeViaJudge0(slug, code, language)
    return c.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed'
    return c.json({ error: message }, 500)
  }
})

// Get test case coverage statistics
app.get('/api/test-cases/stats', async (c) => {
  return c.json(await getTestCaseStats())
})

// Mark problem as solved
app.post('/api/problems/:slug/solve', async (c) => {
  const user = c.get('user')!
  const slug = c.req.param('slug')

  const problem = await getProblemBySlug(slug)
  if (!problem) {
    return c.json({ error: 'Problem not found' }, 404)
  }

  const result = await markProblemSolved(user.id, slug)
  return c.json({ solved: true, firstSolve: result.firstSolve })
})

// Get user's solved slugs (lightweight, for problem list checkmarks)
app.get('/api/user/solved-slugs', async (c) => {
  const user = c.get('user')!
  const slugs = await getUserSolvedSlugs(user.id)
  return c.json({ slugs })
})

// Get user's full progress data
app.get('/api/user/progress', async (c) => {
  const user = c.get('user')!
  const [solvedProblems, allProblemsData, patternsData] = await Promise.all([
    getUserSolvedProblems(user.id),
    getAllProblems(),
    getPatterns(),
  ])

  const solvedSlugs = new Set(solvedProblems.map(s => s.problem_slug))
  const allProblems = allProblemsData.problems

  const byDifficulty = { Easy: { solved: 0, total: 0 }, Medium: { solved: 0, total: 0 }, Hard: { solved: 0, total: 0 } }
  for (const p of allProblems) {
    byDifficulty[p.difficulty].total++
    if (solvedSlugs.has(p.slug)) byDifficulty[p.difficulty].solved++
  }

  const byPattern: Record<string, { solved: number; total: number }> = {}
  for (const p of allProblems) {
    for (const pat of p.patterns) {
      if (!byPattern[pat]) byPattern[pat] = { solved: 0, total: 0 }
      byPattern[pat].total++
      if (solvedSlugs.has(p.slug)) byPattern[pat].solved++
    }
  }

  return c.json({
    total: allProblems.length,
    solved: solvedSlugs.size,
    byDifficulty,
    byPattern,
    recentSolves: solvedProblems.slice(0, 10),
    patterns: patternsData.patterns,
  })
})

// Swagger UI Documentation
app.get('/api-docs', swaggerUI({
  url: '/openapi.json'
}))

// Serve OpenAPI spec
app.get('/openapi.json', (c) => {
  try {
    const spec = readFileSync(join(process.cwd(), 'docs', 'openapi.json'), 'utf-8')
    return c.json(JSON.parse(spec))
  } catch {
    return c.json({ error: 'OpenAPI spec not found' }, 404)
  }
})

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
}
