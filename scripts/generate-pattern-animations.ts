#!/usr/bin/env bun

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { PATTERNS } from '../src/dsa-sheets/patterns.js'
import { ANIMATION_GENERATORS } from '../src/animations/index.js'

function main() {
  console.log('🎨 Generating pattern animations...\n')

  const outputDir = join(process.cwd(), 'public', 'animations')

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  let successCount = 0
  let failCount = 0

  for (const pattern of PATTERNS) {
    try {
      const generator = ANIMATION_GENERATORS[pattern.name]
      const svg = generator()
      const filePath = join(outputDir, `${pattern.name}.svg`)
      writeFileSync(filePath, svg, 'utf-8')
      const sizeKB = (Buffer.byteLength(svg) / 1024).toFixed(1)
      console.log(`  ✓ ${pattern.displayName} (${pattern.name}.svg, ${sizeKB} KB)`)
      successCount++
    } catch (error) {
      console.error(`  ✗ ${pattern.displayName} - ${error}`)
      failCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Generated ${successCount}/${PATTERNS.length} animations`)
  if (failCount > 0) console.log(`Failed: ${failCount}`)
  console.log(`Output: public/animations/`)
  console.log('='.repeat(50))
}

main()
