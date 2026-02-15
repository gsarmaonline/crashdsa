import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'

const app = new Hono()

// API Routes
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

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

export default app
