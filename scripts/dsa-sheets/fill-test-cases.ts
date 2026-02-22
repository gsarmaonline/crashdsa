#!/usr/bin/env bun

/**
 * Fill test cases for all scaffold problems using Claude AI.
 *
 * Reads scaffold JSON files, calls Claude to generate correct test cases,
 * writes them back, and updates _index.json.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... bun run scripts/dsa-sheets/fill-test-cases.ts
 *   ANTHROPIC_API_KEY=sk-... bun run scripts/dsa-sheets/fill-test-cases.ts --slug valid-palindrome
 *   ANTHROPIC_API_KEY=sk-... bun run scripts/dsa-sheets/fill-test-cases.ts --retry-failed
 */

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ProblemTestCases, TestCase, OutputType } from '../../src/dsa-sheets/types'

const TEST_CASES_DIR = 'dsa-sheets/test-cases'
const INDEX_PATH = `${TEST_CASES_DIR}/_index.json`
const CONCURRENCY = 8
const MAX_RETRIES = 2

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---- Prompt ----------------------------------------------------------------

function buildPrompt(scaffold: ProblemTestCases): string {
  const jsCode = scaffold.starterCode?.javascript ?? ''
  const examplesStr = (scaffold.examples ?? [])
    .map((e, i) => `  Example ${i + 1}:\n    Input: ${e.input}\n    Output: ${e.output}${e.explanation ? `\n    Explanation: ${e.explanation}` : ''}`)
    .join('\n')
  const constraintsStr = (scaffold.constraints ?? []).map((c) => `  - ${c}`).join('\n')

  return `You are generating test cases for a coding judge system. Return ONLY valid JSON — no markdown, no prose.

PROBLEM: ${scaffold.slug}
DESCRIPTION:
${scaffold.description ?? '(no description)'}

EXAMPLES:
${examplesStr || '  (none)'}

CONSTRAINTS:
${constraintsStr || '  (none)'}

JAVASCRIPT SIGNATURE:
${jsCode}

CURRENT SCAFFOLD (may have wrong params/returnType — fix them):
  params: ${JSON.stringify(scaffold.params)}
  returnType: "${scaffold.returnType}"

TASK: Return a JSON object with this exact shape:

{
  "params": [{"name": "paramName", "type": "TYPE"}],
  "returnType": "TYPE",
  "outputOrderMatters": true,
  "isDesignProblem": false,
  "testCases": [
    {
      "id": "tc-1",
      "inputs": { "paramName": <value> },
      "expected": <value>,
      "explanation": "brief optional note",
      "tags": ["basic"]
    }
  ]
}

RULES:
1. Fix params and returnType from the actual function signature above.
2. Valid types: "int" "float" "string" "boolean" "int[]" "float[]" "string[]" "boolean[]" "int[][]" "string[][]" "char[][]" "ListNode" "ListNode[]" "TreeNode" "GraphNode" "Interval[]"
3. TreeNode inputs: BFS level-order array with nulls e.g. [3,9,20,null,null,15,7]
4. ListNode inputs: flat array e.g. [1,2,4]
5. Interval[] inputs: array of [start,end] pairs e.g. [[1,3],[2,6]]
6. char[][] inputs: array of string arrays e.g. [["A","B"],["C","D"]]
7. If output order does not matter (e.g. return all triplets, all permutations), set outputOrderMatters: false
8. For design/class problems (LRU Cache, Min Stack, MedianFinder etc.), set isDesignProblem: true and testCases: []
9. Generate exactly 5 test cases covering: basic case, edge cases (empty/single element/no-solution), and the examples above.
10. ALL expected values must be 100% mathematically correct.
11. Tags choices: "basic" "edge-case" "empty-input" "single-element" "no-solution" "duplicates" "all-same" "sorted" "reverse-sorted" "negative-numbers" "cycle" "multiple-solutions"
`
}

// ---- Generation ------------------------------------------------------------

interface Generated {
  params: ProblemTestCases['params']
  returnType: OutputType
  outputOrderMatters?: boolean
  isDesignProblem?: boolean
  testCases: TestCase[]
}

async function generateForScaffold(scaffold: ProblemTestCases, attempt = 1): Promise<Generated> {
  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrompt(scaffold) }],
  })

  const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''

  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed: Generated
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    if (attempt < MAX_RETRIES) {
      console.warn(`    ⚠  ${scaffold.slug}: JSON parse failed, retrying (attempt ${attempt + 1})`)
      return generateForScaffold(scaffold, attempt + 1)
    }
    throw new Error(`Invalid JSON after ${MAX_RETRIES} attempts: ${jsonStr.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed.testCases)) {
    throw new Error('testCases is not an array')
  }

  return parsed
}

// ---- Index update ----------------------------------------------------------

function rebuildIndex() {
  const files = readdirSync(TEST_CASES_DIR).filter(
    (f) => f.endsWith('.json') && f !== '_index.json',
  )

  const problems: Record<string, { hasTests: boolean; caseCount: number; status: string }> = {}
  for (const file of files) {
    const data: ProblemTestCases = JSON.parse(readFileSync(join(TEST_CASES_DIR, file), 'utf-8'))
    problems[data.slug] = {
      hasTests: data.testCases.length > 0,
      caseCount: data.testCases.length,
      status: data._status ?? 'scaffold',
    }
  }

  const indexData = {
    generatedAt: new Date().toISOString(),
    total: files.length,
    withTestCases: Object.values(problems).filter((v) => v.hasTests).length,
    scaffoldsOnly: Object.values(problems).filter((v) => v.status === 'scaffold').length,
    problems,
  }

  writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2) + '\n')
  return indexData
}

// ---- Main ------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY is not set')
    process.exit(1)
  }

  // Parse CLI args
  const args = process.argv.slice(2)
  const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
  const retryFailed = args.includes('--retry-failed')

  // Load index
  if (!existsSync(INDEX_PATH)) {
    console.error(`❌  Index not found: ${INDEX_PATH}`)
    process.exit(1)
  }
  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'))

  // Determine which slugs to process
  let slugs: string[]
  if (slugArg) {
    slugs = [slugArg]
  } else if (retryFailed) {
    slugs = Object.entries(index.problems)
      .filter(([, v]: [string, any]) => v.status === 'scaffold')
      .map(([slug]) => slug)
  } else {
    slugs = Object.entries(index.problems)
      .filter(([, v]: [string, any]) => v.status === 'scaffold')
      .map(([slug]) => slug)
  }

  // Load scaffold files
  const scaffolds: ProblemTestCases[] = []
  for (const slug of slugs) {
    const path = join(TEST_CASES_DIR, `${slug}.json`)
    if (existsSync(path)) {
      scaffolds.push(JSON.parse(readFileSync(path, 'utf-8')))
    } else {
      console.warn(`  ⚠  No file for slug: ${slug}`)
    }
  }

  console.log(`\n🧠  Generating test cases for ${scaffolds.length} problems (concurrency=${CONCURRENCY})...\n`)

  let completed = 0
  let failed = 0
  const failures: string[] = []

  // Process in concurrent batches
  for (let i = 0; i < scaffolds.length; i += CONCURRENCY) {
    const batch = scaffolds.slice(i, i + CONCURRENCY)
    const batchNum = Math.floor(i / CONCURRENCY) + 1
    const totalBatches = Math.ceil(scaffolds.length / CONCURRENCY)

    const results = await Promise.allSettled(
      batch.map(async (scaffold) => {
        const generated = await generateForScaffold(scaffold)

        const updated: ProblemTestCases = {
          ...scaffold,
          params: generated.params ?? scaffold.params,
          returnType: (generated.returnType as OutputType) ?? scaffold.returnType,
          outputOrderMatters: generated.outputOrderMatters,
          isDesignProblem: generated.isDesignProblem ?? false,
          testCases: generated.testCases ?? [],
          _status: 'complete',
        }

        const filePath = join(TEST_CASES_DIR, `${scaffold.slug}.json`)
        writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n')

        return { slug: scaffold.slug, count: updated.testCases.length, design: updated.isDesignProblem }
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { slug, count, design } = result.value
        completed++
        if (design) {
          console.log(`  ✅  ${slug} (design problem — no test cases)`)
        } else {
          console.log(`  ✅  ${slug} (${count} test cases)`)
        }
      } else {
        failed++
        const err = result.reason
        const slug = err?.slug ?? '(unknown)'
        const msg = err?.message ?? String(err)
        failures.push(slug)
        console.log(`  ❌  ${slug}: ${msg}`)
      }
    }

    console.log(`\n  Batch ${batchNum}/${totalBatches} done — ${completed} OK, ${failed} failed so far\n`)

    // Brief pause between batches to stay within rate limits
    if (i + CONCURRENCY < scaffolds.length) {
      await Bun.sleep(500)
    }
  }

  // Rebuild index
  const newIndex = rebuildIndex()

  console.log('='.repeat(60))
  console.log('🎉  Fill Test Cases Complete')
  console.log('='.repeat(60))
  console.log(`  Completed:      ${completed}`)
  console.log(`  Failed:         ${failed}`)
  console.log(`  With tests now: ${newIndex.withTestCases} / ${newIndex.total}`)
  console.log(`  Still scaffold: ${newIndex.scaffoldsOnly}`)
  if (failures.length > 0) {
    console.log(`\n  Failed slugs (re-run with --slug <slug> or --retry-failed):`)
    for (const s of failures) console.log(`    - ${s}`)
  }
  console.log('='.repeat(60))
  console.log('\nNext step: bun run db:seed to load the new test cases into the database.\n')
}

main().catch((err) => {
  console.error('❌  Fatal:', err)
  process.exit(1)
})
