import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { PATTERNS } from '../src/dsa-sheets/patterns.js'
import type { Problem as RawProblem, ProblemTestCases } from '../src/dsa-sheets/types.js'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SHEET_DISPLAY_NAMES: Record<string, string> = {
  neetcode150: 'NeetCode 150',
  blind75: 'Blind 75',
  'leetcode-top-150': 'LeetCode Top 150',
  grind75: 'Grind 75',
  'striver-a2z': "Striver's A2Z",
}

const KNOWN_PATTERNS = new Set(PATTERNS.map((p) => p.name))

async function main() {
  console.log('Seeding database...')

  // 1. Seed patterns
  console.log('Seeding patterns...')
  for (const pattern of PATTERNS) {
    await prisma.pattern.upsert({
      where: { name: pattern.name },
      update: {
        displayName: pattern.displayName,
        description: pattern.description,
        strategy: pattern.strategy,
        keywords: pattern.keywords,
        tagMappings: pattern.tagMappings,
      },
      create: {
        name: pattern.name,
        displayName: pattern.displayName,
        description: pattern.description,
        strategy: pattern.strategy,
        keywords: pattern.keywords,
        tagMappings: pattern.tagMappings,
      },
    })
  }
  console.log(`  Seeded ${PATTERNS.length} patterns`)

  // 2. Seed source sheets
  console.log('Seeding source sheets...')
  for (const [name, displayName] of Object.entries(SHEET_DISPLAY_NAMES)) {
    await prisma.sourceSheet.upsert({
      where: { name },
      update: { displayName },
      create: { name, displayName },
    })
  }
  console.log(`  Seeded ${Object.keys(SHEET_DISPLAY_NAMES).length} source sheets`)

  // 3. Load and seed problems
  console.log('Seeding problems...')
  const problemsPath = join(process.cwd(), 'dsa-sheets', 'processed', 'problems-deduplicated.json')
  const problems: RawProblem[] = JSON.parse(readFileSync(problemsPath, 'utf-8'))

  // Collect all unique tags
  const allTags = new Set<string>()
  for (const p of problems) {
    for (const tag of p.tags) allTags.add(tag)
  }

  // Seed tags
  for (const tag of allTags) {
    await prisma.tag.upsert({
      where: { name: tag },
      update: {},
      create: { name: tag },
    })
  }
  console.log(`  Seeded ${allTags.size} tags`)

  // Seed problems with relationships
  let seeded = 0
  for (const problem of problems) {
    const validPatterns = problem.patterns.filter((p) => KNOWN_PATTERNS.has(p))
    if (validPatterns.length !== problem.patterns.length) {
      const unknown = problem.patterns.filter((p) => !KNOWN_PATTERNS.has(p))
      console.warn(`  Warning: ${problem.slug} has unknown patterns: ${unknown.join(', ')}`)
    }

    await prisma.problem.upsert({
      where: { id: problem.id },
      update: {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        link: problem.link,
        acceptance: problem.acceptance ?? null,
        frequency: problem.frequency ?? null,
      },
      create: {
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        link: problem.link,
        acceptance: problem.acceptance ?? null,
        frequency: problem.frequency ?? null,
      },
    })

    // Sync join tables (delete + recreate for idempotency)
    await prisma.problemPattern.deleteMany({ where: { problemId: problem.id } })
    if (validPatterns.length > 0) {
      await prisma.problemPattern.createMany({
        data: validPatterns.map((p) => ({ problemId: problem.id, patternName: p })),
      })
    }

    await prisma.problemSheet.deleteMany({ where: { problemId: problem.id } })
    if (problem.sourceSheets.length > 0) {
      await prisma.problemSheet.createMany({
        data: problem.sourceSheets.map((s) => ({ problemId: problem.id, sheetName: s })),
      })
    }

    await prisma.problemTag.deleteMany({ where: { problemId: problem.id } })
    if (problem.tags.length > 0) {
      await prisma.problemTag.createMany({
        data: problem.tags.map((t) => ({ problemId: problem.id, tagName: t })),
      })
    }

    seeded++
  }
  console.log(`  Seeded ${seeded} problems`)

  // 4. Seed test cases, problem definitions, and starter code
  console.log('Seeding test cases and problem definitions...')
  const testCasesDir = join(process.cwd(), 'dsa-sheets', 'test-cases')
  const testFiles = readdirSync(testCasesDir).filter(
    (f) => f.endsWith('.json') && f !== '_index.json',
  )

  let testSetsSeeded = 0
  let defsSeeded = 0
  for (const file of testFiles) {
    const testData: ProblemTestCases = JSON.parse(readFileSync(join(testCasesDir, file), 'utf-8'))

    // Find the problem by slug
    const problem = await prisma.problem.findUnique({ where: { slug: testData.slug } })
    if (!problem) continue

    // Update problem with description, examples, constraints (if present)
    if (testData.description) {
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          description: testData.description,
          examples: testData.examples ?? undefined,
          constraints: testData.constraints ?? undefined,
        },
      })
      defsSeeded++
    }

    // Delete existing test case set and its cases (cascade)
    await prisma.testCaseSet.deleteMany({ where: { problemId: problem.id } })

    // Create test case set
    const testCaseSet = await prisma.testCaseSet.create({
      data: {
        slug: testData.slug,
        functionName: testData.functionName,
        params: testData.params as any,
        returnType: testData.returnType,
        notes: testData.notes ?? null,
        outputOrderMatters: testData.outputOrderMatters ?? true,
        isDesignProblem: testData.isDesignProblem ?? false,
        designMethods: testData.designMethods ? (testData.designMethods as any) : null,
        status: testData._status ?? 'scaffold',
        starterCode: testData.starterCode ? (testData.starterCode as any) : null,
        functionNameMap: testData.functionNameMap ? (testData.functionNameMap as any) : null,
        problemId: problem.id,
      },
    })

    // Create individual test cases
    if (testData.testCases.length > 0) {
      await prisma.testCase.createMany({
        data: testData.testCases.map((tc) => ({
          id: `${testData.slug}-${tc.id}`,
          inputs: tc.inputs as any,
          expected: tc.expected as any,
          explanation: tc.explanation ?? null,
          tags: tc.tags ?? [],
          testCaseSetId: testCaseSet.id,
        })),
      })
    }

    testSetsSeeded++
  }
  console.log(`  Seeded ${testSetsSeeded} test case sets (${defsSeeded} with full definitions)`)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
