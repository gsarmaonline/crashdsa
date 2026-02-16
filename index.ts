import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from './src/data/db.js'
import {
  getAllProblems,
  getProblemsByPattern,
  getPatterns,
  getStats,
  getTestCasesForProblem,
  getTestCaseStats,
} from './src/data/problem-repository.js'
import { homePageDynamic } from './src/views/home-dynamic.js'
import { problemsPage } from './src/views/problems.js'
import { patternsPage } from './src/views/patterns.js'
import { patternDetailPage } from './src/views/pattern-detail.js'
import { authMiddleware, type AuthVariables } from './src/auth/middleware.js'
import authRoutes from './src/auth/routes.js'
import { runMigrations } from './src/db/migrate.js'

const app = new Hono<{ Variables: AuthVariables }>()

// Eagerly connect to database
console.log('Initializing CrashDSA...')
prisma.$connect().then(() => console.log('Database connected'))
await runMigrations()

// Auth middleware - loads user from session on every request
app.use('*', authMiddleware)

// Auth routes
app.route('/', authRoutes)

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

app.get('/patterns/:name', async (c) => {
  const name = c.req.param('name')
  const page = await patternDetailPage(name, c.get('user'))
  if (!page) return c.text('Pattern not found', 404)
  return c.html(page)
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

// Get test cases for a specific problem
app.get('/api/problems/:slug/test-cases', async (c) => {
  const slug = c.req.param('slug')
  const testCases = await getTestCasesForProblem(slug)

  if (!testCases) {
    return c.json({ error: 'Test cases not found for this problem' }, 404)
  }

  return c.json(testCases)
})

// Get test case coverage statistics
app.get('/api/test-cases/stats', async (c) => {
  return c.json(await getTestCaseStats())
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
