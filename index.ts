import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homePage } from './src/views/home.js'

const app = new Hono()

// UI Routes
app.get('/', (c) => {
  return c.html(homePage)
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
