import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { ProblemTestCases } from '../dsa-sheets/types'

interface TestCaseIndex {
  generatedAt: string
  total: number
  withTestCases: number
  scaffoldsOnly: number
  problems: Record<string, { hasTests: boolean; caseCount: number; status: string }>
}

const TEST_CASES_DIR = join(process.cwd(), 'dsa-sheets', 'test-cases')
const INDEX_PATH = join(TEST_CASES_DIR, '_index.json')

let indexCache: TestCaseIndex | null = null

function loadIndex(): TestCaseIndex | null {
  if (indexCache) return indexCache

  if (!existsSync(INDEX_PATH)) return null

  try {
    indexCache = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'))
    return indexCache
  } catch {
    return null
  }
}

export function getTestCasesForProblem(slug: string): ProblemTestCases | null {
  const filePath = join(TEST_CASES_DIR, `${slug}.json`)

  if (!existsSync(filePath)) return null

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

export function getTestCaseStats() {
  const index = loadIndex()
  if (!index) {
    return { total: 0, withTestCases: 0, scaffoldsOnly: 0, generatedAt: null }
  }

  return {
    total: index.total,
    withTestCases: index.withTestCases,
    scaffoldsOnly: index.scaffoldsOnly,
    generatedAt: index.generatedAt,
  }
}

export function refreshTestCasesCache() {
  indexCache = null
}
