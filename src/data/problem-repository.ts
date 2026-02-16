import { prisma } from './db.js'
import { Difficulty } from '../generated/prisma/client.js'

export interface Problem {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  patterns: string[]
  sourceSheets: string[]
  link: string
  acceptanceRate: string
  tags: string[]
}

function mapProblem(p: {
  title: string
  difficulty: Difficulty
  link: string
  acceptance: number | null
  patterns: { patternName: string }[]
  sourceSheets: { sheetName: string }[]
  tags: { tagName: string }[]
}): Problem {
  return {
    name: p.title,
    difficulty: p.difficulty,
    patterns: p.patterns.map((pp) => pp.patternName),
    sourceSheets: p.sourceSheets.map((ps) => ps.sheetName),
    link: p.link,
    acceptanceRate: p.acceptance ? `${p.acceptance}%` : 'N/A',
    tags: p.tags.map((pt) => pt.tagName),
  }
}

const problemInclude = {
  patterns: { select: { patternName: true } },
  sourceSheets: { select: { sheetName: true } },
  tags: { select: { tagName: true } },
} as const

export async function getAllProblems(difficulty?: string) {
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

export async function getProblemsByPattern(patternName: string) {
  const pattern = await prisma.pattern.findUnique({ where: { name: patternName } })
  if (!pattern) return null

  const problems = await prisma.problem.findMany({
    where: { patterns: { some: { patternName } } },
    include: problemInclude,
    orderBy: { title: 'asc' },
  })

  return {
    pattern: patternName,
    problems: problems.map(mapProblem),
    count: problems.length,
  }
}

export async function getPatterns() {
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

export async function getStats() {
  const [total, easy, medium, hard] = await Promise.all([
    prisma.problem.count(),
    prisma.problem.count({ where: { difficulty: 'Easy' } }),
    prisma.problem.count({ where: { difficulty: 'Medium' } }),
    prisma.problem.count({ where: { difficulty: 'Hard' } }),
  ])

  return { total, easy, medium, hard, lastUpdated: new Date() }
}

export async function getPatternProblems() {
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

  const byPattern: Record<string, Problem[]> = {}
  for (const pattern of patterns) {
    byPattern[pattern.name] = pattern.problems.map((pp) => mapProblem(pp.problem))
  }

  return byPattern
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

export async function getTestCaseStats() {
  const [total, withTestCases, scaffoldsOnly] = await Promise.all([
    prisma.testCaseSet.count(),
    prisma.testCaseSet.count({ where: { status: 'complete' } }),
    prisma.testCaseSet.count({ where: { status: 'scaffold' } }),
  ])

  return { total, withTestCases, scaffoldsOnly, generatedAt: new Date().toISOString() }
}
