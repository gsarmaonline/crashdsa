/**
 * Screenshot capture script for CrashDSA
 * Captures screenshots of all pages in different viewport sizes
 */

import puppeteer from 'puppeteer'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const routes = [
  { path: '/', name: 'home' },
  { path: '/problems', name: 'problems' },
  { path: '/patterns', name: 'patterns' },
  { path: '/api-docs', name: 'api-docs' },
]

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
]

const BASE_URL = 'http://localhost:3000'
const SCREENSHOTS_DIR = join(process.cwd(), 'screenshots')

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        console.log('✓ Server is ready')
        return true
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return false
}

async function takeScreenshots() {
  console.log('🚀 Starting screenshot capture for CrashDSA\n')

  // Ensure screenshots directory exists
  await mkdir(SCREENSHOTS_DIR, { recursive: true })

  // Start dev server
  console.log('Starting dev server...')
  const serverProcess = exec('bun run dev')

  // Wait for server to be ready
  const serverReady = await waitForServer(BASE_URL)
  if (!serverReady) {
    console.error('❌ Server failed to start')
    serverProcess.kill()
    process.exit(1)
  }

  console.log('\n📸 Capturing screenshots...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  let successCount = 0
  let failureCount = 0

  try {
    for (const route of routes) {
      for (const viewport of viewports) {
        try {
          const page = await browser.newPage()
          await page.setViewport({
            width: viewport.width,
            height: viewport.height,
          })

          const url = `${BASE_URL}${route.path}`
          console.log(`  Navigating to ${url} (${viewport.name})...`)

          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          })

          // Wait a bit for any animations
          await new Promise(resolve => setTimeout(resolve, 500))

          const filename = `${route.name}-${viewport.name}.png`
          const filepath = join(SCREENSHOTS_DIR, filename)

          await page.screenshot({
            path: filepath,
            fullPage: true,
          })

          console.log(`  ✓ Saved ${filename}`)
          successCount++

          await page.close()
        } catch (error) {
          console.error(`  ❌ Failed to capture ${route.name}-${viewport.name}:`, error)
          failureCount++
        }
      }
    }
  } finally {
    await browser.close()
    serverProcess.kill()
  }

  // Create README for screenshots
  const readme = `# Screenshots

Auto-generated screenshots of the CrashDSA application.

**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Total Screenshots:** ${successCount}

## Viewports

- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

## Pages

${routes.map(r => `- \`${r.path}\` - ${r.name}`).join('\n')}

## Files

${routes.map(r =>
  viewports.map(v => `- ${r.name}-${v.name}.png`).join('\n')
).join('\n')}
`

  await writeFile(join(SCREENSHOTS_DIR, 'README.md'), readme)

  console.log('\n' + '='.repeat(50))
  console.log('✅ Screenshot capture complete!')
  console.log('='.repeat(50))
  console.log(`📊 Summary:`)
  console.log(`  ✓ Successful: ${successCount}`)
  console.log(`  ✗ Failed: ${failureCount}`)
  console.log(`  📁 Saved to: screenshots/`)
  console.log('\n💡 View screenshots:')
  console.log(`  open screenshots/`)
}

// Run the script
takeScreenshots().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
