#!/usr/bin/env bun

/**
 * Generate test case scaffold files for all DSA problems.
 * Skips problems that already have hand-written test case files.
 * Usage: bun run scripts/dsa-sheets/generate-test-cases.ts
 */

import { existsSync, mkdirSync } from 'fs'
import type { Problem, ProblemTestCases, TestParam, InputType, OutputType } from '../../src/dsa-sheets/types'

const INPUT_PATH = 'dsa-sheets/processed/problems-deduplicated.json'
const OUTPUT_DIR = 'dsa-sheets/test-cases'
const INDEX_PATH = `${OUTPUT_DIR}/_index.json`

/** Convert slug to camelCase function name */
function slugToFunctionName(slug: string): string {
  return slug
    .split('-')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/** Pattern-based default params and return types */
const PATTERN_DEFAULTS: Record<string, { params: TestParam[]; returnType: OutputType }> = {
  'two-pointers': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int[]',
  },
  'fast-slow-pointers': {
    params: [{ name: 'head', type: 'ListNode' }],
    returnType: 'boolean',
  },
  'sliding-window': {
    params: [{ name: 's', type: 'string' }],
    returnType: 'int',
  },
  'binary-search': {
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    returnType: 'int',
  },
  'cyclic-sort': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int',
  },
  'linked-list-reversal': {
    params: [{ name: 'head', type: 'ListNode' }],
    returnType: 'ListNode',
  },
  'tree-dfs': {
    params: [{ name: 'root', type: 'TreeNode' }],
    returnType: 'int',
  },
  'tree-bfs': {
    params: [{ name: 'root', type: 'TreeNode' }],
    returnType: 'int[][]',
  },
  'graph-dfs': {
    params: [{ name: 'grid', type: 'char[][]' }],
    returnType: 'int',
  },
  'graph-bfs': {
    params: [{ name: 'grid', type: 'char[][]' }],
    returnType: 'int',
  },
  'union-find': {
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'int[][]' }],
    returnType: 'int',
  },
  'topological-sort': {
    params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'int[][]' }],
    returnType: 'boolean',
  },
  'backtracking': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int[][]',
  },
  'dynamic-programming-1d': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int',
  },
  'dynamic-programming-2d': {
    params: [{ name: 'grid', type: 'int[][]' }],
    returnType: 'int',
  },
  'greedy': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int',
  },
  'merge-intervals': {
    params: [{ name: 'intervals', type: 'Interval[]' }],
    returnType: 'Interval[]',
  },
  'top-k-elements': {
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    returnType: 'int[]',
  },
  'monotonic-stack': {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int[]',
  },
  'bit-manipulation': {
    params: [{ name: 'n', type: 'int' }],
    returnType: 'int',
  },
}

function getDefaultsForProblem(problem: Problem): { params: TestParam[]; returnType: OutputType } {
  const pattern = problem.patterns[0]
  if (pattern && PATTERN_DEFAULTS[pattern]) {
    return PATTERN_DEFAULTS[pattern]
  }
  return {
    params: [{ name: 'nums', type: 'int[]' }],
    returnType: 'int',
  }
}

async function main() {
  console.log('🧪 Generating test case scaffolds...\n')

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const file = Bun.file(INPUT_PATH)
  if (!await file.exists()) {
    console.error('❌ Deduplicated problems file not found!')
    console.error('   Run: bun run dsa-sheets:deduplicate first')
    process.exit(1)
  }

  const problems: Problem[] = await file.json()
  console.log(`📂 Loaded ${problems.length} problems\n`)

  let created = 0
  let skipped = 0
  const index: Record<string, { hasTests: boolean; caseCount: number; status: string }> = {}

  for (const problem of problems) {
    const filePath = `${OUTPUT_DIR}/${problem.slug}.json`

    // Skip if file already exists (hand-written test cases)
    if (existsSync(filePath)) {
      const existing: ProblemTestCases = await Bun.file(filePath).json()
      index[problem.slug] = {
        hasTests: existing.testCases.length > 0,
        caseCount: existing.testCases.length,
        status: existing._status || 'complete',
      }
      skipped++
      continue
    }

    const defaults = getDefaultsForProblem(problem)

    const scaffold: ProblemTestCases = {
      slug: problem.slug,
      functionName: slugToFunctionName(problem.slug),
      params: defaults.params,
      returnType: defaults.returnType,
      testCases: [],
      _status: 'scaffold',
    }

    await Bun.write(filePath, JSON.stringify(scaffold, null, 2) + '\n')

    index[problem.slug] = {
      hasTests: false,
      caseCount: 0,
      status: 'scaffold',
    }
    created++
  }

  // Write index
  const indexData = {
    generatedAt: new Date().toISOString(),
    total: problems.length,
    withTestCases: Object.values(index).filter(v => v.hasTests).length,
    scaffoldsOnly: Object.values(index).filter(v => v.status === 'scaffold').length,
    problems: index,
  }

  await Bun.write(INDEX_PATH, JSON.stringify(indexData, null, 2) + '\n')

  console.log('='.repeat(60))
  console.log('🧪 Test Case Generation Results')
  console.log('='.repeat(60))
  console.log(`   Created scaffolds: ${created}`)
  console.log(`   Skipped (existing): ${skipped}`)
  console.log(`   With test cases: ${indexData.withTestCases}`)
  console.log(`   Total: ${problems.length}`)
  console.log(`   Index: ${INDEX_PATH}`)
  console.log('='.repeat(60) + '\n')
}

if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}
