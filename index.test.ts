process.env.SESSION_SECRET = 'test-secret'

import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Mock all external dependencies before importing the app

mock.module('./src/data/db.js', () => ({
  prisma: {
    problem: {
      findMany: mock(() => Promise.resolve([])),
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
  findSessionWithUser: mock(() => Promise.resolve({
    session: { id: 'test-session', user_id: 1, expires_at: new Date(Date.now() + 86400000), created_at: new Date() },
    user: { id: 1, github_id: 12345, username: 'testuser', display_name: 'Test User', avatar_url: null, email: null, created_at: new Date(), updated_at: new Date() },
  })),
  createSession: mock(() => Promise.resolve({ id: 'test' })),
  deleteSession: mock(() => Promise.resolve()),
}))

mock.module('./src/db/connection.js', () => ({
  default: null,
}))

import { prisma } from './src/data/db.js'
import { createSignedCookie } from './src/auth/middleware.js'

// Import the app after mocks are set up
const { default: server } = await import('./index.js')

const testSessionCookie = createSignedCookie('test-session')

// Helper to make requests to the Hono app (with auth cookie)
async function request(path: string) {
  const req = new Request(`http://localhost${path}`, {
    headers: {
      Cookie: `crashdsa_session=${testSessionCookie}`,
    },
  })
  return server.fetch(req)
}

const mockProblemRow = {
  id: 'p-test-two-sum',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'Easy' as const,
  link: 'https://leetcode.com/problems/two-sum',
  acceptance: 49.5,
  frequency: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patterns: [{ patternName: 'two-pointers' }],
  sourceSheets: [{ sheetName: 'neetcode150' }],
  tags: [{ tagName: 'Array' }],
}

describe('CrashDSA API', () => {
  beforeEach(() => {
    ;(prisma.problem.findMany as ReturnType<typeof mock>).mockReset()
    ;(prisma.problem.count as ReturnType<typeof mock>).mockReset()
    ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockReset()
    ;(prisma.pattern.findMany as ReturnType<typeof mock>).mockReset()
    ;(prisma.testCaseSet.findUnique as ReturnType<typeof mock>).mockReset()
    ;(prisma.testCaseSet.count as ReturnType<typeof mock>).mockReset()
  })

  describe('GET /api/hello', () => {
    it('returns hello message', async () => {
      const res = await request('/api/hello')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.message).toBe('Hello from Hono API!')
    })
  })

  describe('GET /api/problems', () => {
    it('returns problems from database', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([mockProblemRow])

      const res = await request('/api/problems')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.count).toBe(1)
      expect(data.problems[0].name).toBe('Two Sum')
      expect(data.problems[0].difficulty).toBe('Easy')
      expect(data.problems[0].patterns).toEqual(['two-pointers'])
    })

    it('filters by difficulty query param', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([mockProblemRow])

      const res = await request('/api/problems?difficulty=easy')
      expect(res.status).toBe(200)

      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { difficulty: 'Easy' },
        })
      )
    })

    it('returns empty array when no problems', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([])

      const res = await request('/api/problems')
      const data = await res.json()

      expect(data.count).toBe(0)
      expect(data.problems).toEqual([])
    })
  })

  describe('GET /api/problems/pattern/:pattern', () => {
    it('returns problems for existing pattern', async () => {
      ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockResolvedValue({
        name: 'two-pointers',
        displayName: 'Two Pointers',
      })
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([mockProblemRow])

      const res = await request('/api/problems/pattern/two-pointers')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.pattern).toBe('two-pointers')
      expect(data.count).toBe(1)
    })

    it('returns 404 for unknown pattern', async () => {
      ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockResolvedValue(null)

      const res = await request('/api/problems/pattern/nonexistent')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error).toBe('Pattern not found')
    })
  })

  describe('GET /api/patterns', () => {
    it('returns patterns with counts from database', async () => {
      ;(prisma.pattern.findMany as ReturnType<typeof mock>).mockResolvedValue([
        {
          name: 'two-pointers',
          displayName: 'Two Pointers',
          problems: [{ problemId: 'p1' }, { problemId: 'p2' }],
        },
      ])

      const res = await request('/api/patterns')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.total).toBe(1)
      expect(data.patterns[0].name).toBe('two-pointers')
      expect(data.patterns[0].count).toBe(2)
    })
  })

  describe('GET /api/stats', () => {
    it('returns statistics from database', async () => {
      const countMock = prisma.problem.count as ReturnType<typeof mock>
      countMock
        .mockResolvedValueOnce(326)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(170)
        .mockResolvedValueOnce(76)

      const res = await request('/api/stats')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.total).toBe(326)
      expect(data.easy).toBe(80)
      expect(data.medium).toBe(170)
      expect(data.hard).toBe(76)
      expect(data.lastUpdated).toBeDefined()
    })
  })

  describe('GET /api/problems/:slug/test-cases', () => {
    it('returns test cases for existing problem', async () => {
      ;(prisma.testCaseSet.findUnique as ReturnType<typeof mock>).mockResolvedValue({
        slug: 'two-sum',
        functionName: 'twoSum',
        params: [{ name: 'nums', type: 'number[]' }],
        returnType: 'number[]',
        notes: null,
        outputOrderMatters: true,
        isDesignProblem: false,
        designMethods: null,
        status: 'complete',
        testCases: [
          {
            id: 1,
            inputs: { nums: [2, 7], target: 9 },
            expected: [0, 1],
            explanation: 'Example',
            tags: [],
          },
        ],
      })

      const res = await request('/api/problems/two-sum/test-cases')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.slug).toBe('two-sum')
      expect(data.functionName).toBe('twoSum')
      expect(data.testCases).toHaveLength(1)
    })

    it('returns 404 for missing problem', async () => {
      ;(prisma.testCaseSet.findUnique as ReturnType<typeof mock>).mockResolvedValue(null)

      const res = await request('/api/problems/nonexistent/test-cases')
      expect(res.status).toBe(404)

      const data = await res.json()
      expect(data.error).toBe('Test cases not found for this problem')
    })
  })

  describe('GET /api/test-cases/stats', () => {
    it('returns test case stats from database', async () => {
      const countMock = prisma.testCaseSet.count as ReturnType<typeof mock>
      countMock
        .mockResolvedValueOnce(326)
        .mockResolvedValueOnce(171)
        .mockResolvedValueOnce(155)

      const res = await request('/api/test-cases/stats')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.total).toBe(326)
      expect(data.withTestCases).toBe(171)
      expect(data.scaffoldsOnly).toBe(155)
    })
  })
})
