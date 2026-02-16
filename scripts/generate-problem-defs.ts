/**
 * Generates src/problems/{slug}/problem.json files from existing test case data.
 * Only generates for problems that have real test cases but no problem.json yet.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const TEST_CASES_DIR = join(ROOT, 'dsa-sheets', 'test-cases')
const PROBLEMS_DIR = join(ROOT, 'src', 'problems')
const DEDUP_PATH = join(ROOT, 'dsa-sheets', 'processed', 'problems-deduplicated.json')

interface TestCaseFile {
  slug: string
  functionName: string
  params: { name: string; type: string }[]
  returnType: string
  outputOrderMatters?: boolean
  notes?: string
  testCases: {
    id: string
    inputs: Record<string, any>
    expected: any
    explanation?: string
    tags?: string[]
  }[]
  _status?: string
}

interface DedupProblem {
  id: string
  title: string
  slug: string
  difficulty: string
  link: string
  sourceSheets: string[]
  tags: string[]
  patterns: string[]
}

interface IndexFile {
  total: number
  withTestCases: number
  scaffoldsOnly: number
  problems: Record<string, { hasTests: boolean; caseCount: number; status: string }>
}

// Type mappings for starter code generation
const TYPE_MAP = {
  javascript: {
    int: 'number',
    'int[]': 'number[]',
    'int[][]': 'number[][]',
    string: 'string',
    'string[]': 'string[]',
    'string[][]': 'string[][]',
    bool: 'boolean',
    boolean: 'boolean',
    'char[][]': 'string[][]',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    GraphNode: 'GraphNode',
    float: 'number',
    double: 'number',
  },
  typescript: {
    int: 'number',
    'int[]': 'number[]',
    'int[][]': 'number[][]',
    string: 'string',
    'string[]': 'string[]',
    'string[][]': 'string[][]',
    bool: 'boolean',
    boolean: 'boolean',
    'char[][]': 'string[][]',
    ListNode: 'ListNode | null',
    TreeNode: 'TreeNode | null',
    GraphNode: 'GraphNode | null',
    float: 'number',
    double: 'number',
  },
  python: {
    int: 'int',
    'int[]': 'list[int]',
    'int[][]': 'list[list[int]]',
    string: 'str',
    'string[]': 'list[str]',
    'string[][]': 'list[list[str]]',
    bool: 'bool',
    boolean: 'bool',
    'char[][]': 'list[list[str]]',
    ListNode: 'Optional[ListNode]',
    TreeNode: 'Optional[TreeNode]',
    GraphNode: 'Optional[GraphNode]',
    float: 'float',
    double: 'float',
  },
  cpp: {
    int: 'int',
    'int[]': 'vector<int>',
    'int[][]': 'vector<vector<int>>',
    string: 'string',
    'string[]': 'vector<string>',
    'string[][]': 'vector<vector<string>>',
    bool: 'bool',
    boolean: 'bool',
    'char[][]': 'vector<vector<char>>',
    ListNode: 'ListNode*',
    TreeNode: 'TreeNode*',
    GraphNode: 'GraphNode*',
    float: 'float',
    double: 'double',
  },
  go: {
    int: 'int',
    'int[]': '[]int',
    'int[][]': '[][]int',
    string: 'string',
    'string[]': '[]string',
    'string[][]': '[][]string',
    bool: 'bool',
    boolean: 'bool',
    'char[][]': '[][]byte',
    ListNode: '*ListNode',
    TreeNode: '*TreeNode',
    GraphNode: '*GraphNode',
    float: 'float64',
    double: 'float64',
  },
} as const

function getType(type: string, lang: keyof typeof TYPE_MAP): string {
  return (TYPE_MAP[lang] as Record<string, string>)[type] ?? type
}

function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function toSnakeCase(name: string): string {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}

function generateJSDoc(params: { name: string; type: string }[], returnType: string): string {
  const paramDocs = params.map((p) => ` * @param {${getType(p.type, 'javascript')}} ${p.name}`).join('\n')
  return `/**\n${paramDocs}\n * @return {${getType(returnType, 'javascript')}}\n */`
}

function needsCppIncludes(params: { name: string; type: string }[], returnType: string): string[] {
  const includes: Set<string> = new Set()
  const allTypes = [...params.map((p) => p.type), returnType]
  for (const t of allTypes) {
    if (t.includes('[]')) includes.add('vector')
    if (t === 'string' || t.includes('string')) includes.add('string')
  }
  const lines: string[] = []
  if (includes.has('vector')) lines.push('#include <vector>')
  if (includes.has('string')) lines.push('#include <string>')
  if (lines.length > 0) lines.push('using namespace std;', '')
  return lines
}

function generateStarterCode(
  funcName: string,
  params: { name: string; type: string }[],
  returnType: string,
): Record<string, string> {
  const snakeName = toSnakeCase(funcName)
  const pascalName = toPascalCase(funcName)

  // JavaScript
  const jsDoc = generateJSDoc(params, returnType)
  const jsParams = params.map((p) => p.name).join(', ')
  const js = `${jsDoc}\nfunction ${funcName}(${jsParams}) {\n  // Write your solution here\n}`

  // TypeScript
  const tsParams = params.map((p) => `${p.name}: ${getType(p.type, 'typescript')}`).join(', ')
  const tsReturn = getType(returnType, 'typescript')
  const ts = `function ${funcName}(${tsParams}): ${tsReturn} {\n  // Write your solution here\n}`

  // Python
  const pyParams = params.map((p) => `${p.name}: ${getType(p.type, 'python')}`).join(', ')
  const pyReturn = getType(returnType, 'python')
  const py = `def ${snakeName}(${pyParams}) -> ${pyReturn}:\n    # Write your solution here\n    pass`

  // C++
  const cppIncludes = needsCppIncludes(params, returnType)
  const cppParams = params.map((p) => {
    const t = getType(p.type, 'cpp')
    // Pass vectors and strings by reference
    if (t.startsWith('vector') || t === 'string') return `${t}& ${p.name}`
    return `${t} ${p.name}`
  }).join(', ')
  const cppReturn = getType(returnType, 'cpp')
  const cpp = `${cppIncludes.join('\n')}${cppReturn} ${funcName}(${cppParams}) {\n    // Write your solution here\n}`

  // Go
  const goParams = params.map((p) => `${p.name} ${getType(p.type, 'go')}`).join(', ')
  const goReturn = getType(returnType, 'go')
  const go = `func ${funcName}(${goParams}) ${goReturn} {\n    // Write your solution here\n}`

  return { javascript: js, typescript: ts, python: py, cpp, go }
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'boolean') return String(val)
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') return `"${val}"`
  if (Array.isArray(val)) return JSON.stringify(val)
  return JSON.stringify(val)
}

function generateExamples(
  testCases: TestCaseFile['testCases'],
  params: { name: string; type: string }[],
): { input: string; output: string; explanation?: string }[] {
  // Take up to 3 non-edge-case test cases for examples
  const basicCases = testCases.filter(
    (tc) => !tc.tags?.some((t) => t === 'edge-case' || t === 'empty-input' || t === 'large-input'),
  )
  const selected = (basicCases.length >= 2 ? basicCases : testCases).slice(0, 3)

  return selected.map((tc) => {
    const inputParts = params.map((p) => `${p.name} = ${formatValue(tc.inputs[p.name])}`)
    const example: { input: string; output: string; explanation?: string } = {
      input: inputParts.join(', '),
      output: formatValue(tc.expected),
    }
    if (tc.explanation) example.explanation = tc.explanation
    return example
  })
}

function generateDescription(title: string, link: string, funcName: string, params: { name: string; type: string }[], returnType: string): string {
  return `Solve the **${title}** problem.\n\nSee the full problem description on [LeetCode](${link}).`
}

function main() {
  const index: IndexFile = JSON.parse(readFileSync(join(TEST_CASES_DIR, '_index.json'), 'utf-8'))
  const dedupProblems: DedupProblem[] = JSON.parse(readFileSync(DEDUP_PATH, 'utf-8'))
  const dedupMap = new Map(dedupProblems.map((p) => [p.slug, p]))

  const completeSlugs = Object.entries(index.problems)
    .filter(([, info]) => info.status === 'complete' && info.hasTests)
    .map(([slug]) => slug)

  let generated = 0
  let skipped = 0

  for (const slug of completeSlugs) {
    const problemJsonPath = join(PROBLEMS_DIR, slug, 'problem.json')
    if (existsSync(problemJsonPath)) {
      skipped++
      continue
    }

    const testCaseFile: TestCaseFile = JSON.parse(
      readFileSync(join(TEST_CASES_DIR, `${slug}.json`), 'utf-8'),
    )

    if (!testCaseFile.testCases || testCaseFile.testCases.length === 0) {
      console.log(`  Skipping ${slug}: no test cases`)
      continue
    }

    const meta = dedupMap.get(slug)
    if (!meta) {
      console.log(`  Skipping ${slug}: not in deduplicated problems`)
      continue
    }

    const starterCode = generateStarterCode(
      testCaseFile.functionName,
      testCaseFile.params,
      testCaseFile.returnType,
    )

    const examples = generateExamples(testCaseFile.testCases, testCaseFile.params)

    const testCases = testCaseFile.testCases.map((tc) => {
      const entry: any = {
        input: tc.inputs,
        expected: tc.expected,
      }
      if (testCaseFile.outputOrderMatters === false) {
        entry.orderMatters = false
      }
      return entry
    })

    const problemDef = {
      slug,
      title: meta.title,
      description: generateDescription(meta.title, meta.link, testCaseFile.functionName, testCaseFile.params, testCaseFile.returnType),
      examples,
      constraints: [],
      function: {
        name: testCaseFile.functionName,
        params: testCaseFile.params,
        returnType: testCaseFile.returnType,
      },
      testCases,
      starterCode,
      functionNameMap: {
        javascript: testCaseFile.functionName,
        typescript: testCaseFile.functionName,
        python: toSnakeCase(testCaseFile.functionName),
        cpp: testCaseFile.functionName,
        go: toPascalCase(testCaseFile.functionName),
      },
    }

    const dir = join(PROBLEMS_DIR, slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(problemJsonPath, JSON.stringify(problemDef, null, 2) + '\n')
    generated++
    console.log(`  Generated: ${slug} (${testCaseFile.testCases.length} test cases)`)
  }

  console.log(`\nDone! Generated ${generated} problem definitions, skipped ${skipped} existing.`)
}

main()
