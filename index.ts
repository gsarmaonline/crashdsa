import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homePageDynamic } from './src/views/home-dynamic.js'
import { problemsPage } from './src/views/problems.js'
import { loadProblemsCache, getProblemsCache, refreshCache } from './src/data/csv-loader.js'

const app = new Hono()

// Load problems cache at startup
console.log('Initializing CrashDSA...')
loadProblemsCache()

// UI Routes
app.get('/', (c) => {
  return c.html(homePageDynamic())
})

app.get('/problems', (c) => {
  return c.html(problemsPage)
})

// Serve CSS
app.get('/styles.css', (c) => {
  const css = readFileSync(join(process.cwd(), 'src', 'styles', 'styles.css'), 'utf-8')
  return c.body(css, 200, { 'Content-Type': 'text/css' })
})

// API Routes
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono API!' })
})

// Get all problems or filter by difficulty
app.get('/api/problems', (c) => {
  const cache = getProblemsCache()
  const difficulty = c.req.query('difficulty')

  let problems = cache.all

  if (difficulty) {
    problems = problems.filter(p =>
      p.difficulty.toLowerCase() === difficulty.toLowerCase()
    )
  }

  return c.json({
    problems,
    count: problems.length
  })
})

// Get problems by pattern
app.get('/api/problems/pattern/:pattern', (c) => {
  const pattern = c.req.param('pattern')
  const cache = getProblemsCache()

  if (!cache.byPattern[pattern]) {
    return c.json({ error: 'Pattern not found' }, 404)
  }

  return c.json({
    pattern,
    problems: cache.byPattern[pattern],
    count: cache.byPattern[pattern].length
  })
})

// Get all available patterns
app.get('/api/patterns', (c) => {
  const cache = getProblemsCache()

  const patternsWithCounts = cache.patterns.map(pattern => ({
    name: pattern,
    displayName: pattern.split('-').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' '),
    count: cache.byPattern[pattern]?.length || 0
  }))

  return c.json({
    patterns: patternsWithCounts,
    total: cache.patterns.length
  })
})

// Get statistics
app.get('/api/stats', (c) => {
  const cache = getProblemsCache()
  return c.json(cache.stats)
})

// Refresh cache (useful for updates)
app.post('/api/refresh', (c) => {
  try {
    refreshCache()
    return c.json({ message: 'Cache refreshed successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to refresh cache' }, 500)
  }
})

// Swagger UI Documentation
app.get('/api-docs', swaggerUI({
  url: '/openapi.json'
}))

// Serve OpenAPI spec
app.get('/openapi.json', (c) => {
  const spec = readFileSync(join(process.cwd(), 'docs', 'openapi.json'), 'utf-8')
  return c.json(JSON.parse(spec))
})

export default {
  port: 3000,
  fetch: app.fetch,
}
