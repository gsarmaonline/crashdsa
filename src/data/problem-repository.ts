import { prisma } from './db.js'
import { createTTLCache, createTTLCacheWithParam, __registerCachedFunction } from './cache.js'
import { Difficulty } from '../generated/prisma/client.js'

// Cache TTL: 5 minutes (300,000 ms)
// Since the problem dataset only changes during seeding, this is safe.
const CACHE_TTL_MS = 5 * 60 * 1000

export interface Problem {
  name: string
  slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  patterns: string[]
  sourceSheets: string[]
  link: string
  acceptanceRate: string
  tags: string[]
}

function mapProblem(p: {
  title: string
  slug: string
  difficulty: Difficulty
  link: string
  acceptance: number | null
  patterns: { patternName: string }[]
  sourceSheets: { sheetName: string }[]
  tags: { tagName: string }[]}): Problem {
  return {
    name: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    patterns: p.patterns.map((pp) => pp.patternName),
    sourceSheets: p.sourceSheets.map((ps) => ps.sheetName),
    link: `/problems/${p.slug}`,
    acceptanceRate: p.acceptance ? `${p.acceptance}%` : 'N/A',
    tags: p.tags.map((pt) => pt.tagName),
  }
}

const problemInclude = {
  patterns: { select: { patternName: true } },
  sourceSheets: { select: { sheetName: true } },
  tags: { select: { tagName: true } },
} as const

// ============================================
// Cached Query Functions
// ============================================

const _getAllProblems = async (difficulty?: string) => {
  const where = difficulty
    ? { difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase() as Difficulty }
    : {}

  const problems = await prisma.problem.findMany({
    where,
    include: problemInclude,
    orderBy: { title: 'asc' },
  })

  return {
    problems: problems.map(mapProblem),
    count: problems.length,
  }
}

const cachedGetAllProblems = createTTLCacheWithParam(_getAllProblems, CACHE_TTL_MS)
__registerCachedFunction(cachedGetAllProblems)

export async function getAllProblems(difficulty?: string) {
  return cachedGetAllProblems(difficulty)
}

const _getProblemsByPattern = async (patternName: string) => {
  const pattern = await prisma.pattern.findUnique({ where: { name: patternName } })
  if (!pattern) return null

  const problems = await prisma.problem.findMany({
    where: { patterns: { some: { patternName } } },
    include: problemInclude,
    orderBy: { title: 'asc' },
  })

  return {
    name: patternName,
    pattern: patternName,
    displayName: pattern.displayName,
    description: pattern.description,
    strategy: pattern.strategy,
    keywords: pattern.keywords,
    problems: problems.map(mapProblem),
    count: problems.length,
  }
}

const cachedGetProblemsByPattern = createTTLCacheWithParam(_getProblemsByPattern, CACHE_TTL_MS)
__registerCachedFunction(cachedGetProblemsByPattern)

export async function getProblemsByPattern(patternName: string) {
  return cachedGetProblemsByPattern(patternName)
}

const _getPatterns = async () => {
  const patterns = await prisma.pattern.findMany({
    include: { problems: { select: { problemId: true } } },
    orderBy: { name: 'asc' },
  })

  return {
    patterns: patterns.map((p) => ({
      name: p.name,
      displayName: p.displayName,
      count: p.problems.length,
    })),
    total: patterns.length,
  }
}

const cachedGetPatterns = createTTLCache(_getPatterns, CACHE_TTL_MS)
__registerCachedFunction(cachedGetPatterns)

export async function getPatterns() {
  return cachedGetPatterns()
}

const _getStats = async () => {
  const [total, easy, medium, hard] = await Promise.all([
    prisma.problem.count(),
    prisma.problem.count({ where: { difficulty: 'Easy' } }),
    prisma.problem.count({ where: { difficulty: 'Medium' } }),
    prisma.problem.count({ where: { difficulty: 'Hard' } }),
  ])

  return { total, easy, medium, hard, lastUpdated: new Date() }
}

const cachedGetStats = createTTLCache(_getStats, CACHE_TTL_MS)
__registerCachedFunction(cachedGetStats)

export async function getStats() {
  return cachedGetStats()
}

export interface PatternWithProblems {
  name: string
  displayName: string
  description: string
  strategy: string
  keywords: string[]
  problems: Problem[]
}

const _getPatternProblems = async () => {
  const patterns = await prisma.pattern.findMany({
    include: {
      problems: {
        include: {
          problem: {
            include: problemInclude,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return patterns.map((pattern) => ({
    name: pattern.name,
    displayName: pattern.displayName,
    description: pattern.description,
    strategy: pattern.strategy,
    keywords: pattern.keywords,
    problems: pattern.problems.map((pp) => mapProblem(pp.problem)),
  })) as PatternWithProblems[]
}

const cachedGetPatternProblems = createTTLCache(_getPatternProblems, CACHE_TTL_MS)
__registerCachedFunction(cachedGetPatternProblems)

export async function getPatternProblems() {
  return cachedGetPatternProblems()
}

// ============================================
// Non-Cached Query Functions
// ============================================

export async function getProblemBySlug(slug: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: problemInclude,
  })

  if (!problem) return null

  return {
    ...mapProblem(problem),
    slug: problem.slug,
  }
}

export async function getTestCasesForProblem(slug: string) {
  const testCaseSet = await prisma.testCaseSet.findUnique({
    where: { slug },
    include: { testCases: true },
  })

  if (!testCaseSet) return null

  return {
    slug: testCaseSet.slug,
    functionName: testCaseSet.functionName,
    params: testCaseSet.params,
    returnType: testCaseSet.returnType,
    notes: testCaseSet.notes,
    outputOrderMatters: testCaseSet.outputOrderMatters,
    isDesignProblem: testCaseSet.isDesignProblem,
    designMethods: testCaseSet.designMethods,
    _status: testCaseSet.status,
    testCases: testCaseSet.testCases.map((tc) => ({
      id: tc.id,
      inputs: tc.inputs,
      expected: tc.expected,
      explanation: tc.explanation,
      tags: tc.tags,
    })),
  }
}

export async function getJudgeDefinition(slug: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      testCaseSet: {
        include: { testCases: true },
      },
    },
  })

  if (!problem || !problem.testCaseSet || !problem.description) return null

  const tcs = problem.testCaseSet

  return {
    slug: problem.slug,
    title: problem.title,
    description: problem.description,
    examples: (problem.examples as any[]) ?? [],
    constraints: (problem.constraints as any[]) ?? [],
    function: {
      name: tcs.functionName,
      params: tcs.params,
      returnType: tcs.returnType,
    },
    testCases: tcs.testCases.map((tc) => ({
      input: tc.inputs,
      expected: tc.expected,
      ...(tcs.outputOrderMatters === false ? { orderMatters: false } : {}),
    })),
    starterCode: tcs.starterCode ?? {},
    functionNameMap: tcs.functionNameMap ?? {},
  }
}

export async function getJudgeReadySlugs() {
  const problems = await prisma.problem.findMany({
    where: {
      description: { not: null },
      testCaseSet: {
        starterCode: { not: { equals: null } },
      },
    },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })

  return problems.map((p) => p.slug)
}

export async function getProblemTitlesBySlug(slugs: string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map()
  const problems = await prisma.problem.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, title: true },
  })
  const result = new Map<string, string>()
  for (const p of problems) result.set(p.slug, p.title)
  return result
}

export async function getPatternsBySlug(slugs: string[]): Promise<Map<string, string[]>> {
  if (slugs.length === 0) return new Map()
  const problems = await prisma.problem.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, patterns: { select: { patternName: true } } },
  })
  const result = new Map<string, string[]>()
  for (const p of problems) result.set(p.slug, p.patterns.map(pp => pp.patternName))
  return result
}

export async function getPatternDisplayNames(): Promise<Map<string, string>> {
  const patterns = await prisma.pattern.findMany({ select: { name: true, displayName: true } })
  const result = new Map<string, string>()
  for (const p of patterns) result.set(p.name, p.displayName)
  return result
}

export async function getTestCaseStats() {
  const [total, withTestCases, scaffoldsOnly] = await Promise.all([
    prisma.testCaseSet.count(),
    prisma.testCaseSet.count({ where: { status: 'complete' } }),
    prisma.testCaseSet.count({ where: { status: 'scaffold' } }),
  ])

  return { total, withTestCases, scaffoldsOnly, generatedAt: new Date().toISOString() }
}

// ============================================
// Test Utilities
// ============================================

/**
 * Internal function to clear all caches.
 * Only exported for testing purposes.
 * @internal
 */
export function __clearAllCaches__() {
  if (cachedGetAllProblems.__invalidate) cachedGetAllProblems.__invalidate()
  if (cachedGetProblemsByPattern.__invalidate) cachedGetProblemsByPattern.__invalidate()
  if (cachedGetPatterns.__invalidate) cachedGetPatterns.__invalidate()
  if (cachedGetStats.__invalidate) cachedGetStats.__invalidate()
  if (cachedGetPatternProblems.__invalidate) cachedGetPatternProblems.__invalidate()
}
