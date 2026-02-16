import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { prisma } from './db.js'

// Mock the Prisma client
mock.module('./db.js', () => ({
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

import {
  getAllProblems,
  getProblemsByPattern,
  getPatterns,
  getStats,
  getPatternProblems,
  getTestCasesForProblem,
  getTestCaseStats,
} from './problem-repository.js'

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

const mockProblemRowHard = {
  ...mockProblemRow,
  id: 'p-test-median',
  title: 'Median of Two Sorted Arrays',
  slug: 'median-of-two-sorted-arrays',
  difficulty: 'Hard' as const,
  link: 'https://leetcode.com/problems/median-of-two-sorted-arrays',
  acceptance: 38.2,
  patterns: [{ patternName: 'binary-search' }],
  sourceSheets: [{ sheetName: 'blind75' }],
  tags: [],
}

describe('problem-repository', () => {
  beforeEach(() => {
    ;(prisma.problem.findMany as ReturnType<typeof mock>).mockReset()
    ;(prisma.problem.count as ReturnType<typeof mock>).mockReset()
    ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockReset()
    ;(prisma.pattern.findMany as ReturnType<typeof mock>).mockReset()
    ;(prisma.testCaseSet.findUnique as ReturnType<typeof mock>).mockReset()
    ;(prisma.testCaseSet.count as ReturnType<typeof mock>).mockReset()
  })

  describe('getAllProblems', () => {
    it('returns all problems from the database', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([
        mockProblemRow,
        mockProblemRowHard,
      ])

      const result = await getAllProblems()

      expect(result.count).toBe(2)
      expect(result.problems[0].name).toBe('Two Sum')
      expect(result.problems[0].difficulty).toBe('Easy')
      expect(result.problems[0].patterns).toEqual(['two-pointers'])
      expect(result.problems[0].sourceSheets).toEqual(['neetcode150'])
      expect(result.problems[0].tags).toEqual(['Array'])
      expect(result.problems[0].link).toBe('/problems/two-sum')
      expect(result.problems[0].acceptanceRate).toBe('49.5%')
    })

    it('filters problems by difficulty', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([mockProblemRow])

      const result = await getAllProblems('easy')

      expect(result.count).toBe(1)
      expect(prisma.problem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { difficulty: 'Easy' },
        })
      )
    })

    it('returns empty array when no problems exist', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([])

      const result = await getAllProblems()

      expect(result.count).toBe(0)
      expect(result.problems).toEqual([])
    })

    it('formats acceptance rate as N/A when null', async () => {
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([
        { ...mockProblemRow, acceptance: null },
      ])

      const result = await getAllProblems()
      expect(result.problems[0].acceptanceRate).toBe('N/A')
    })
  })

  describe('getProblemsByPattern', () => {
    it('returns problems for an existing pattern', async () => {
      ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockResolvedValue({
        name: 'two-pointers',
        displayName: 'Two Pointers',
      })
      ;(prisma.problem.findMany as ReturnType<typeof mock>).mockResolvedValue([mockProblemRow])

      const result = await getProblemsByPattern('two-pointers')

      expect(result).not.toBeNull()
      expect(result!.pattern).toBe('two-pointers')
      expect(result!.count).toBe(1)
      expect(result!.problems[0].name).toBe('Two Sum')
    })

    it('returns null for unknown pattern', async () => {
      ;(prisma.pattern.findUnique as ReturnType<typeof mock>).mockResolvedValue(null)

      const result = await getProblemsByPattern('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getPatterns', () => {
    it('returns patterns with problem counts', async () => {
      ;(prisma.pattern.findMany as ReturnType<typeof mock>).mockResolvedValue([
        {
          name: 'two-pointers',
          displayName: 'Two Pointers',
          problems: [{ problemId: 'p1' }, { problemId: 'p2' }],
        },
        {
          name: 'binary-search',
          displayName: 'Binary Search',
          problems: [{ problemId: 'p3' }],
        },
      ])

      const result = await getPatterns()

      expect(result.total).toBe(2)
      expect(result.patterns[0]).toEqual({
        name: 'two-pointers',
        displayName: 'Two Pointers',
        count: 2,
      })
      expect(result.patterns[1].count).toBe(1)
    })
  })

  describe('getStats', () => {
    it('returns problem counts by difficulty from database', async () => {
      const countMock = prisma.problem.count as ReturnType<typeof mock>
      countMock
        .mockResolvedValueOnce(326) // total
        .mockResolvedValueOnce(80)  // easy
        .mockResolvedValueOnce(170) // medium
        .mockResolvedValueOnce(76)  // hard

      const result = await getStats()

      expect(result.total).toBe(326)
      expect(result.easy).toBe(80)
      expect(result.medium).toBe(170)
      expect(result.hard).toBe(76)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('getPatternProblems', () => {
    it('returns problems grouped by pattern name', async () => {
      ;(prisma.pattern.findMany as ReturnType<typeof mock>).mockResolvedValue([
        {
          name: 'two-pointers',
          problems: [{ problem: mockProblemRow }],
        },
        {
          name: 'binary-search',
          problems: [{ problem: mockProblemRowHard }],
        },
      ])

      const result = await getPatternProblems()

      expect(result).toHaveLength(2)
      expect(result.map(p => p.name)).toEqual(['two-pointers', 'binary-search'])
      expect(result[0].problems).toHaveLength(1)
      expect(result[0].problems[0].name).toBe('Two Sum')
      expect(result[1].problems[0].name).toBe('Median of Two Sorted Arrays')
    })
  })

  describe('getTestCasesForProblem', () => {
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
            inputs: { nums: [2, 7, 11, 15], target: 9 },
            expected: [0, 1],
            explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
            tags: [],
          },
        ],
      })

      const result = await getTestCasesForProblem('two-sum')

      expect(result).not.toBeNull()
      expect(result!.slug).toBe('two-sum')
      expect(result!.functionName).toBe('twoSum')
      expect(result!.testCases).toHaveLength(1)
      expect(result!.testCases[0].expected).toEqual([0, 1])
      expect(result!._status).toBe('complete')
    })

    it('returns null for non-existent problem slug', async () => {
      ;(prisma.testCaseSet.findUnique as ReturnType<typeof mock>).mockResolvedValue(null)

      const result = await getTestCasesForProblem('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getTestCaseStats', () => {
    it('returns test case counts from database', async () => {
      const countMock = prisma.testCaseSet.count as ReturnType<typeof mock>
      countMock
        .mockResolvedValueOnce(326) // total
        .mockResolvedValueOnce(171) // complete
        .mockResolvedValueOnce(155) // scaffold

      const result = await getTestCaseStats()

      expect(result.total).toBe(326)
      expect(result.withTestCases).toBe(171)
      expect(result.scaffoldsOnly).toBe(155)
      expect(result.generatedAt).toBeDefined()
    })
  })
})
