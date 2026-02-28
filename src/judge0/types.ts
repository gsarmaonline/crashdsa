export const LANGUAGE_IDS = {
  javascript: 63,  // Node.js 12.14.0
  typescript: 74,  // TypeScript 3.7
  python: 71,      // Python 3.8.1
  cpp: 54,         // GCC 9.2.0
  go: 60,          // Go 1.13.5
} as const

export type SupportedLanguage = keyof typeof LANGUAGE_IDS

export interface Judge0Submission {
  source_code: string
  language_id: number
  stdin: string
}

export interface Judge0Result {
  token?: string
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: { id: number; description: string }
  time: string | null
  memory: number | null
}

export interface ExecuteRequest {
  slug: string
  code: string
  language: SupportedLanguage
}

export interface TestResult {
  testIndex: number
  passed: boolean
  input: Record<string, unknown>
  expected: unknown
  actual: unknown
  error: string | null
  executionTimeMs: number
}
