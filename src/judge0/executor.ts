import { getJudgeDefinition } from '../data/problem-repository.js'
import { submitBatch } from './client.js'
import { buildWrappedCode } from './wrappers.js'
import { LANGUAGE_IDS, type SupportedLanguage, type Judge0Submission, type TestResult } from './types.js'

// Status IDs where execution succeeded (1=In Queue, 2=Processing, 3=Accepted)
const ACCEPTED_STATUS = 3

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function deepEqual(actual: unknown, expected: unknown, orderMatters = true): boolean {
  if (actual === expected) return true
  if (actual == null || expected == null) return false

  if (typeof actual === 'boolean' || typeof expected === 'boolean') {
    return actual === expected
  }

  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return true
    return Math.abs(actual - expected) < 1e-6
  }

  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual === expected
  }

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false

    if (!orderMatters) {
      const sortedActual = [...actual].sort(compareValues)
      const sortedExpected = [...expected].sort(compareValues)
      for (let i = 0; i < sortedActual.length; i++) {
        if (!deepEqual(sortedActual[i], sortedExpected[i], true)) return false
      }
      return true
    }

    for (let j = 0; j < actual.length; j++) {
      if (!deepEqual(actual[j], expected[j], true)) return false
    }
    return true
  }

  if (typeof actual === 'object' && typeof expected === 'object') {
    const keysA = Object.keys(actual as object)
    const keysB = Object.keys(expected as object)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!deepEqual((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key], orderMatters)) return false
    }
    return true
  }

  return false
}

export async function executeViaJudge0(
  slug: string,
  code: string,
  language: SupportedLanguage,
): Promise<TestResult[]> {
  const def = await getJudgeDefinition(slug)
  if (!def) {
    throw new Error(`Problem definition not found for slug: ${slug}`)
  }

  const languageId = LANGUAGE_IDS[language]

  const submissions: Judge0Submission[] = def.testCases.map((tc) => ({
    source_code: buildWrappedCode(language, code, def.function as any, def.functionNameMap as Record<string, string>),
    language_id: languageId,
    stdin: JSON.stringify(tc.input),
  }))

  const judgeResults = await submitBatch(submissions)

  return judgeResults.map((result, i) => {
    const tc = def.testCases[i]

    const executionTimeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : 0

    if (result.status.id !== ACCEPTED_STATUS) {
      const errorText = result.compile_output || result.stderr || result.status.description
      return {
        testIndex: i,
        passed: false,
        input: tc.input as Record<string, unknown>,
        expected: tc.expected,
        actual: null,
        error: errorText,
        executionTimeMs,
      } satisfies TestResult
    }

    let actual: unknown = null
    try {
      actual = JSON.parse((result.stdout ?? '').trim())
    } catch {
      return {
        testIndex: i,
        passed: false,
        input: tc.input as Record<string, unknown>,
        expected: tc.expected,
        actual: null,
        error: `Failed to parse output: ${result.stdout}`,
        executionTimeMs,
      } satisfies TestResult
    }

    const orderMatters = (tc as any).orderMatters !== false
    const passed = deepEqual(actual, tc.expected, orderMatters)

    return {
      testIndex: i,
      passed,
      input: tc.input as Record<string, unknown>,
      expected: tc.expected,
      actual,
      error: null,
      executionTimeMs,
    } satisfies TestResult
  })
}
