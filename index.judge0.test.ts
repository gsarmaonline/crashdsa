// Integration tests for POST /api/judge/execute — full HTTP flow.
// Authentication is bypassed by mocking the session store to always return a
// valid test user (same pattern used in index.test.ts).

process.env.SESSION_SECRET = 'test-secret'
process.env.JUDGE0_URL = 'http://localhost:2358'

import { describe, it, expect, mock, beforeEach } from 'bun:test'

// ============================================================
// Mocks — must be declared before any import that loads these modules
// ============================================================

const mockSubmitBatch = mock(async () => [] as any[])

mock.module('./src/judge0/client.js', () => ({
  submitBatch: mockSubmitBatch,
  isAvailable: mock(async () => true),
}))

mock.module('./src/data/db.js', () => ({
  prisma: {
    problem: {
      findMany: mock(() => Promise.resolve([])),
      findUnique: mock(() => Promise.resolve(null)),
      count: mock(() => Promise.resolve(0)),
    },
    pattern: {
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
    },
    testCaseSet: {
      findUnique: mock(() => Promise.resolve(null)),
      count: mock(() => Promise.resolve(0)),
    },
    $connect: mock(() => Promise.resolve()),
  },
}))

mock.module('./src/db/sessions.js', () => ({
  findSessionWithUser: mock(() =>
    Promise.resolve({
      session: {
        id: 'test-session',
        user_id: 1,
        expires_at: new Date(Date.now() + 86400000),
        created_at: new Date(),
      },
      user: {
        id: 1,
        github_id: 12345,
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        email: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  ),
  createSession: mock(() => Promise.resolve({ id: 'test' })),
  deleteSession: mock(() => Promise.resolve()),
}))

mock.module('./src/db/connection.js', () => ({ default: null }))

// ============================================================
// Import app after mocks are in place
// ============================================================

import { prisma } from './src/data/db.js'
import { createSignedCookie } from './src/auth/middleware.js'

const { default: server } = await import('./index.js')

const SESSION_COOKIE = createSignedCookie('test-session')

// ============================================================
// Fixtures
// ============================================================

// Full Prisma row shape returned by problem.findUnique (with testCaseSet included)
const MOCK_PROBLEM_ROW = {
  id: 'p-two-sum',
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy' as const,
  link: 'https://leetcode.com/problems/two-sum',
  acceptance: 49.5,
  frequency: null,
  description: 'Given an array of integers, return indices of two numbers that add up to target.',
  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: null }],
  constraints: ['2 <= nums.length <= 10^4'],
  createdAt: new Date(),
  updatedAt: new Date(),
  testCaseSet: {
    id: 'tcs-two-sum',
    slug: 'two-sum',
    functionName: 'twoSum',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' },
    ],
    returnType: 'int[]',
    notes: null,
    outputOrderMatters: true,
    isDesignProblem: false,
    designMethods: null,
    status: 'complete',
    starterCode: { javascript: 'function twoSum(nums, target) {}' },
    functionNameMap: {
      javascript: 'twoSum',
      typescript: 'twoSum',
      python: 'two_sum',
      cpp: 'twoSum',
      go: 'twoSum',
    },
    problemId: 'p-two-sum',
    testCases: [
      {
        id: 'tc-1',
        inputs: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
        explanation: null,
        tags: [],
      },
      {
        id: 'tc-2',
        inputs: { nums: [3, 2, 4], target: 6 },
        expected: [1, 2],
        explanation: null,
        tags: [],
      },
    ],
  },
}

// ============================================================
// Helpers
// ============================================================

function makeAccepted(stdout: string, time = '0.05') {
  return {
    stdout,
    stderr: null,
    compile_output: null,
    status: { id: 3, description: 'Accepted' },
    time,
    memory: 1024,
  }
}

function makeCompileError(message: string) {
  return {
    stdout: null,
    stderr: null,
    compile_output: message,
    status: { id: 6, description: 'Compilation Error' },
    time: null,
    memory: null,
  }
}

function makeRuntimeError(message: string) {
  return {
    stdout: null,
    stderr: message,
    compile_output: null,
    status: { id: 11, description: 'Runtime Error (NZEC)' },
    time: null,
    memory: null,
  }
}

/** Authenticated POST to /api/judge/execute */
function executeRequest(body: object, authenticated = true) {
  return server.fetch(
    new Request('http://localhost/api/judge/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { Cookie: `crashdsa_session=${SESSION_COOKIE}` } : {}),
      },
      body: JSON.stringify(body),
    })
  )
}

// ============================================================
// Tests
// ============================================================

describe('POST /api/judge/execute', () => {
  beforeEach(() => {
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockReset()
    ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockReset()
  })

  // ----------------------------------------------------------
  // Authentication
  // ----------------------------------------------------------

  describe('authentication', () => {
    it('returns 401 when request has no session cookie', async () => {
      const res = await executeRequest(
        { slug: 'two-sum', code: 'function twoSum() {}', language: 'javascript' },
        false
      )
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Authentication required')
    })

    it('does not call Judge0 when unauthenticated', async () => {
      await executeRequest(
        { slug: 'two-sum', code: 'function twoSum() {}', language: 'javascript' },
        false
      )
      expect(mockSubmitBatch).not.toHaveBeenCalled()
    })
  })

  // ----------------------------------------------------------
  // Problem resolution
  // ----------------------------------------------------------

  describe('problem resolution', () => {
    it('returns 500 when slug has no judge definition', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(null)

      const res = await executeRequest({
        slug: 'nonexistent-problem',
        code: 'function f() {}',
        language: 'javascript',
      })
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toContain('Problem definition not found')
    })

    it('returns 500 when problem exists but has no description', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue({
        ...MOCK_PROBLEM_ROW,
        description: null,
      })

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum(nums, target) {}',
        language: 'javascript',
      })
      expect(res.status).toBe(500)
    })
  })

  // ----------------------------------------------------------
  // JavaScript end-to-end flow
  // ----------------------------------------------------------

  describe('JavaScript — correct solution', () => {
    it('returns 200 with all tests passing', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const code = `function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    if (map[target - nums[i]] !== undefined) return [map[target - nums[i]], i];
    map[nums[i]] = i;
  }
}`
      const res = await executeRequest({ slug: 'two-sum', code, language: 'javascript' })
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.results).toHaveLength(2)
      expect(data.results[0].passed).toBe(true)
      expect(data.results[0].actual).toEqual([0, 1])
      expect(data.results[0].expected).toEqual([0, 1])
      expect(data.results[0].error).toBeNull()
      expect(data.results[1].passed).toBe(true)
    })

    it('submits one batch call with two submissions', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      await executeRequest({ slug: 'two-sum', code: 'function twoSum() {}', language: 'javascript' })

      expect(mockSubmitBatch).toHaveBeenCalledTimes(1)
      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions).toHaveLength(2)
    })

    it('sends correct stdin JSON per test case', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      await executeRequest({ slug: 'two-sum', code: 'function twoSum() {}', language: 'javascript' })

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(JSON.parse(submissions[0]!.stdin)).toEqual({ nums: [2, 7, 11, 15], target: 9 })
      expect(JSON.parse(submissions[1]!.stdin)).toEqual({ nums: [3, 2, 4], target: 6 })
    })

    it('sends language_id 63 (Node.js) for javascript', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      await executeRequest({ slug: 'two-sum', code: 'function twoSum() {}', language: 'javascript' })

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.language_id).toBe(63)
    })
  })

  describe('JavaScript — incorrect solution', () => {
    it('returns 200 with failing results when output does not match expected', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,2]'), // wrong answer for test case 1
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum(nums, target) { return [0, 2]; }',
        language: 'javascript',
      })
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.results[0].passed).toBe(false)
      expect(data.results[0].actual).toEqual([0, 2])
      expect(data.results[0].expected).toEqual([0, 1])
      expect(data.results[0].error).toBeNull()
      expect(data.results[1].passed).toBe(true)
    })
  })

  describe('JavaScript — compile error', () => {
    it('returns 200 with error set on each test result', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeCompileError('/solution.js:1\nfunction twoSum(nums, target {\n                              ^\nSyntaxError: Unexpected token'),
        makeCompileError('/solution.js:1\nfunction twoSum(nums, target {\n                              ^\nSyntaxError: Unexpected token'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum(nums, target {', // syntax error
        language: 'javascript',
      })
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.results[0].passed).toBe(false)
      expect(data.results[0].error).toContain('SyntaxError')
      expect(data.results[0].actual).toBeNull()
    })
  })

  describe('JavaScript — runtime error', () => {
    it('returns 200 with error set on the failing test case', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeRuntimeError('TypeError: Cannot read property "length" of undefined'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum(nums, target) { return nums.badProp.length; }',
        language: 'javascript',
      })
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.results[0].passed).toBe(false)
      expect(data.results[0].error).toContain('TypeError')
      expect(data.results[1].passed).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // Python end-to-end flow
  // ----------------------------------------------------------

  describe('Python end-to-end flow', () => {
    it('returns passing results for a correct Python solution', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0, 1]'),
        makeAccepted('[1, 2]'),
      ])

      const code = `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`

      const res = await executeRequest({ slug: 'two-sum', code, language: 'python' })
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.results).toHaveLength(2)
      expect(data.results[0].passed).toBe(true)
    })

    it('sends language_id 71 (Python 3) for python', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0, 1]'),
        makeAccepted('[1, 2]'),
      ])

      await executeRequest({ slug: 'two-sum', code: 'def two_sum(n, t): pass', language: 'python' })

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.language_id).toBe(71)
    })

    it('uses python function name (two_sum) from functionNameMap in generated source', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0, 1]'),
        makeAccepted('[1, 2]'),
      ])

      await executeRequest({ slug: 'two-sum', code: 'def two_sum(n, t): pass', language: 'python' })

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.source_code).toContain('two_sum(')
      // Should NOT use the JS name
      expect(submissions[0]!.source_code).not.toContain('twoSum(')
    })
  })

  // ----------------------------------------------------------
  // TypeScript end-to-end flow
  // ----------------------------------------------------------

  describe('TypeScript end-to-end flow', () => {
    it('returns passing results and uses language_id 74', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum(nums: number[], target: number): number[] { return []; }',
        language: 'typescript',
      })
      expect(res.status).toBe(200)

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.language_id).toBe(74)
      const data = await res.json()
      expect(data.results[0].passed).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // Go end-to-end flow
  // ----------------------------------------------------------

  describe('Go end-to-end flow', () => {
    it('returns passing results and uses language_id 60', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'func twoSum(nums []int, target int) []int { return nil }',
        language: 'go',
      })
      expect(res.status).toBe(200)

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.language_id).toBe(60)
      // Go wrapper adds package main
      expect(submissions[0]!.source_code).toContain('package main')
      const data = await res.json()
      expect(data.results[0].passed).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // C++ end-to-end flow
  // ----------------------------------------------------------

  describe('C++ end-to-end flow', () => {
    it('returns passing results and uses language_id 54', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'vector<int> twoSum(vector<int>& nums, int target) { return {}; }',
        language: 'cpp',
      })
      expect(res.status).toBe(200)

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
      expect(submissions[0]!.language_id).toBe(54)
      expect(submissions[0]!.source_code).toContain('#include <nlohmann/json.hpp>')
      const data = await res.json()
      expect(data.results[0].passed).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // Response shape
  // ----------------------------------------------------------

  describe('response shape', () => {
    it('each TestResult has all required fields', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]', '0.042'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum() {}',
        language: 'javascript',
      })
      expect(res.status).toBe(200)

      const data = await res.json()
      const r = data.results[0]
      expect(typeof r.testIndex).toBe('number')
      expect(typeof r.passed).toBe('boolean')
      expect('input' in r).toBe(true)
      expect('expected' in r).toBe(true)
      expect('actual' in r).toBe(true)
      expect('error' in r).toBe(true)
      expect(typeof r.executionTimeMs).toBe('number')
    })

    it('executionTimeMs is derived from Judge0 time field in ms', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]', '0.123'),
        makeAccepted('[1,2]', '0.042'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum() {}',
        language: 'javascript',
      })
      const data = await res.json()
      expect(data.results[0].executionTimeMs).toBe(123)
      expect(data.results[1].executionTimeMs).toBe(42)
    })

    it('executionTimeMs is 0 when Judge0 time is null', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        { ...makeCompileError('err'), time: null },
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'bad code',
        language: 'javascript',
      })
      const data = await res.json()
      expect(data.results[0].executionTimeMs).toBe(0)
    })

    it('input field reflects the original test case inputs', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum() {}',
        language: 'javascript',
      })
      const data = await res.json()
      expect(data.results[0].input).toEqual({ nums: [2, 7, 11, 15], target: 9 })
      expect(data.results[1].input).toEqual({ nums: [3, 2, 4], target: 6 })
    })

    it('testIndex matches position in test case array', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum() {}',
        language: 'javascript',
      })
      const data = await res.json()
      expect(data.results[0].testIndex).toBe(0)
      expect(data.results[1].testIndex).toBe(1)
    })
  })

  // ----------------------------------------------------------
  // Judge0 client error propagation
  // ----------------------------------------------------------

  describe('Judge0 client errors', () => {
    it('returns 500 when submitBatch throws', async () => {
      ;(prisma.problem.findUnique as ReturnType<typeof mock>).mockResolvedValue(MOCK_PROBLEM_ROW)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockRejectedValue(
        new Error('Judge0 batch submission failed: 503 Service Unavailable')
      )

      const res = await executeRequest({
        slug: 'two-sum',
        code: 'function twoSum() {}',
        language: 'javascript',
      })
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toContain('Judge0 batch submission failed')
    })
  })
})
