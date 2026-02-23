import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { readFile } from 'fs/promises'
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

  // === PHASE 1: Load all data into memory (parallel I/O) ===
  console.log('Loading data...')
  const problemsPath = join(process.cwd(), 'dsa-sheets', 'processed', 'problems-deduplicated.json')
  const testCasesDir = join(process.cwd(), 'dsa-sheets', 'test-cases')

  const testFiles = readdirSync(testCasesDir).filter(
    (f) => f.endsWith('.json') && f !== '_index.json',
  )

  const problems: RawProblem[] = JSON.parse(readFileSync(problemsPath, 'utf-8'))

  // Read all 326 test case files concurrently instead of sequentially
  const allTestData: ProblemTestCases[] = await Promise.all(
    testFiles.map(async (file) => {
      const content = await readFile(join(testCasesDir, file), 'utf-8')
      return JSON.parse(content) as ProblemTestCases
    }),
  )

  console.log(`  Loaded ${problems.length} problems, ${allTestData.length} test case files`)

  // === PHASE 2: Compute all derived data in memory (zero DB calls) ===
  // Build slug→id map to avoid per-file findUnique queries later
  const slugToId = new Map(problems.map((p) => [p.slug, p.id]))

  const allTags = new Set<string>()
  const allProblemPatterns: { problemId: string; patternName: string }[] = []
  const allProblemSheets: { problemId: string; sheetName: string }[] = []
  const allProblemTags: { problemId: string; tagName: string }[] = []

  for (const problem of problems) {
    for (const tag of problem.tags) allTags.add(tag)

    const validPatterns = problem.patterns.filter((p) => {
      if (!KNOWN_PATTERNS.has(p)) {
        console.warn(`  Warning: ${problem.slug} has unknown pattern: ${p}`)
        return false
      }
      return true
    })

    for (const p of validPatterns) allProblemPatterns.push({ problemId: problem.id, patternName: p })
    for (const s of problem.sourceSheets) allProblemSheets.push({ problemId: problem.id, sheetName: s })
    for (const t of problem.tags) allProblemTags.push({ problemId: problem.id, tagName: t })
  }

  const testCaseSetData: {
    id: string
    slug: string
    functionName: string
    params: any
    returnType: string
    notes: string | null
    outputOrderMatters: boolean
    isDesignProblem: boolean
    designMethods: any
    status: string
    starterCode: any
    functionNameMap: any
    problemId: string
  }[] = []
  const testCaseData: {
    id: string
    inputs: any
    expected: any
    explanation: string | null
    tags: string[]
    testCaseSetId: string
  }[] = []
  const descriptionUpdates: {
    id: string
    description: string
    examples: any
    constraints: any
  }[] = []

  for (const testData of allTestData) {
    const problemId = slugToId.get(testData.slug)
    if (!problemId) continue

    // Use deterministic ID (slug-based) so we can bulk-insert TestCaseSets
    // and reference them in TestCases without a roundtrip to get auto-generated IDs
    const testCaseSetId = `tcs-${testData.slug}`

    testCaseSetData.push({
      id: testCaseSetId,
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
      problemId,
    })

    for (const tc of testData.testCases) {
      testCaseData.push({
        id: `${testData.slug}-${tc.id}`,
        inputs: tc.inputs as any,
        expected: tc.expected as any,
        explanation: tc.explanation ?? null,
        tags: tc.tags ?? [],
        testCaseSetId,
      })
    }

    if (testData.description) {
      descriptionUpdates.push({
        id: problemId,
        description: testData.description,
        examples: testData.examples ?? null,
        constraints: testData.constraints ?? null,
      })
    }
  }

  // === PHASE 3: Seed reference data in parallel ===
  // Patterns and sheets use $transaction (batches N upserts into 1 connection/txn)
  // Tags use createMany with skipDuplicates (1 call instead of ~150 sequential upserts)
  console.log('Seeding patterns, sheets, and tags...')
  await Promise.all([
    prisma.$transaction(
      PATTERNS.map((pattern) =>
        prisma.pattern.upsert({
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
        }),
      ),
    ),
    prisma.$transaction(
      Object.entries(SHEET_DISPLAY_NAMES).map(([name, displayName]) =>
        prisma.sourceSheet.upsert({ where: { name }, update: { displayName }, create: { name, displayName } }),
      ),
    ),
    prisma.tag.createMany({
      data: Array.from(allTags).map((name) => ({ name })),
      skipDuplicates: true,
    }),
  ])
  console.log(
    `  Seeded ${PATTERNS.length} patterns, ${Object.keys(SHEET_DISPLAY_NAMES).length} sheets, ${allTags.size} tags`,
  )

  // === PHASE 4: Upsert all problems in a single batched transaction ===
  // $transaction([...N]) executes all N statements on one connection with one BEGIN/COMMIT
  // vs. N separate sequential awaits each with their own connection checkout
  console.log('Seeding problems...')
  await prisma.$transaction(
    problems.map((problem) =>
      prisma.problem.upsert({
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
      }),
    ),
    { timeout: 30_000 },
  )
  console.log(`  Seeded ${problems.length} problems`)

  // === PHASE 5+6+7: Run join tables, test cases, and descriptions in parallel ===
  // All three phases only depend on Phase 4 (problems existing), not on each other
  console.log('Seeding relationships, test cases, and descriptions...')
  await Promise.all([
    // Phase 5: Sync join tables
    // Global truncate + bulk insert: 6 calls instead of 326×6 = 1,956 calls
    (async () => {
      await Promise.all([
        prisma.problemPattern.deleteMany(),
        prisma.problemSheet.deleteMany(),
        prisma.problemTag.deleteMany(),
      ])
      await Promise.all([
        prisma.problemPattern.createMany({ data: allProblemPatterns }),
        prisma.problemSheet.createMany({ data: allProblemSheets }),
        prisma.problemTag.createMany({ data: allProblemTags }),
      ])
      console.log(
        `  Seeded ${allProblemPatterns.length} pattern links, ${allProblemSheets.length} sheet links, ${allProblemTags.length} tag links`,
      )
    })(),

    // Phase 6: Bulk seed test case sets + test cases
    // Deterministic IDs eliminate the per-set findUnique → createMany chain
    // 3 calls instead of 326×4 = 1,304 calls
    (async () => {
      await prisma.testCaseSet.deleteMany() // cascades to TestCase
      await prisma.testCaseSet.createMany({ data: testCaseSetData })
      await prisma.testCase.createMany({ data: testCaseData })
      console.log(
        `  Seeded ${testCaseSetData.length} test case sets, ${testCaseData.length} test cases`,
      )
    })(),

    // Phase 7: Batch update problem descriptions
    descriptionUpdates.length > 0
      ? prisma
          .$transaction(
            descriptionUpdates.map(({ id, description, examples, constraints }) =>
              prisma.problem.update({
                where: { id },
                data: {
                  description,
                  examples: examples ?? undefined,
                  constraints: constraints ?? undefined,
                },
              }),
            ),
            { timeout: 30_000 },
          )
          .then(() => console.log(`  Seeded ${descriptionUpdates.length} problem descriptions`))
      : Promise.resolve(),
  ])

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
