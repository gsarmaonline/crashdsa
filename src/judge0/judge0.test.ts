process.env.JUDGE0_URL = 'http://localhost:2358'

import { describe, it, expect, mock, beforeEach } from 'bun:test'

// --- Mock setup (must precede any import that transitively loads these modules) ---

const mockSubmitBatch = mock(async () => [] as any[])

mock.module('./client.js', () => ({
  submitBatch: mockSubmitBatch,
  isAvailable: mock(async () => true),
}))

mock.module('../data/problem-repository.js', () => ({
  getJudgeDefinition: mockGetJudgeDefinition,
}))

// Declare here so the mock factory closure can reference it; defined below.
function mockGetJudgeDefinition() {
  return Promise.resolve(null as any)
}
// Replace with a real mock so we can control return values per test.
const mockGetJudgeDef = mock(mockGetJudgeDefinition)
mock.module('../data/problem-repository.js', () => ({
  getJudgeDefinition: mockGetJudgeDef,
}))

import {
  buildWrappedCode,
  wrapJavaScript,
  wrapPython,
  wrapCpp,
  wrapGo,
} from './wrappers.js'
import { executeViaJudge0 } from './executor.js'
import { LANGUAGE_IDS } from './types.js'

// ============================================================
// Fixtures
// ============================================================

const TWO_SUM_FN = {
  name: 'twoSum',
  params: [
    { name: 'nums', type: 'int[]' },
    { name: 'target', type: 'int' },
  ],
  returnType: 'int[]',
}

const TWO_SUM_NAME_MAP = {
  javascript: 'twoSum',
  typescript: 'twoSum',
  python: 'two_sum',
  cpp: 'twoSum',
  go: 'twoSum',
}

const TWO_SUM_DEF = {
  slug: 'two-sum',
  title: 'Two Sum',
  description: 'Return indices of two numbers that add up to target.',
  examples: [],
  constraints: [],
  function: TWO_SUM_FN,
  testCases: [
    { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
  ],
  starterCode: {},
  functionNameMap: TWO_SUM_NAME_MAP,
}

const USER_CODE = `function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    if (map[target - nums[i]] !== undefined) return [map[target - nums[i]], i];
    map[nums[i]] = i;
  }
}`

function makeAccepted(stdout: string) {
  return {
    stdout,
    stderr: null,
    compile_output: null,
    status: { id: 3, description: 'Accepted' },
    time: '0.05',
    memory: 1024,
  }
}

function makeError(description: string, compile_output?: string, stderr?: string) {
  return {
    stdout: null,
    stderr: stderr ?? null,
    compile_output: compile_output ?? null,
    status: { id: 6, description },
    time: null,
    memory: null,
  }
}

// ============================================================
// Wrappers
// ============================================================

describe('wrapJavaScript', () => {
  it('includes user code verbatim', () => {
    expect(wrapJavaScript(USER_CODE, TWO_SUM_FN, 'twoSum')).toContain(USER_CODE)
  })

  it('reads stdin and parses as JSON', () => {
    const out = wrapJavaScript(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain("readFileSync('/dev/stdin','utf8')")
    expect(out).toContain('JSON.parse(')
  })

  it('calls function with each param name from stdin object', () => {
    const out = wrapJavaScript(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('_i["nums"]')
    expect(out).toContain('_i["target"]')
  })

  it('uses the provided function name in the generated call', () => {
    const out = wrapJavaScript(USER_CODE, TWO_SUM_FN, 'myFunc')
    // The wrapper call line should use myFunc, not twoSum
    expect(out).toContain('const _r = myFunc(')
  })

  it('writes result to stdout as JSON', () => {
    const out = wrapJavaScript(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('process.stdout.write(JSON.stringify(_r))')
  })
})

describe('wrapPython', () => {
  it('starts with sys and json imports', () => {
    const out = wrapPython(USER_CODE, TWO_SUM_FN, 'two_sum')
    expect(out.startsWith('import sys,json')).toBe(true)
  })

  it('includes user code', () => {
    expect(wrapPython(USER_CODE, TWO_SUM_FN, 'two_sum')).toContain(USER_CODE)
  })

  it('reads stdin via sys.stdin.read() and json.loads', () => {
    const out = wrapPython(USER_CODE, TWO_SUM_FN, 'two_sum')
    expect(out).toContain('sys.stdin.read()')
    expect(out).toContain('json.loads(')
  })

  it('calls function with each param from stdin dict', () => {
    const out = wrapPython(USER_CODE, TWO_SUM_FN, 'two_sum')
    expect(out).toContain('_i["nums"]')
    expect(out).toContain('_i["target"]')
  })

  it('prints result as JSON via json.dumps', () => {
    const out = wrapPython(USER_CODE, TWO_SUM_FN, 'two_sum')
    expect(out).toContain('print(json.dumps(two_sum(')
  })
})

describe('wrapCpp', () => {
  it('includes required C++ headers', () => {
    const out = wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('#include <iostream>')
    expect(out).toContain('#include <vector>')
    expect(out).toContain('#include <nlohmann/json.hpp>')
  })

  it('includes user code', () => {
    expect(wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')).toContain(USER_CODE)
  })

  it('deserializes int[] param from JSON', () => {
    const out = wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('vector<int> nums = _j["nums"].get<vector<int>>()')
  })

  it('deserializes int param from JSON', () => {
    const out = wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('int target = _j["target"].get<int>()')
  })

  it('calls function with deserialized params', () => {
    const out = wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('twoSum(nums, target)')
  })

  it('outputs array result via nlohmann json dump', () => {
    const out = wrapCpp(USER_CODE, TWO_SUM_FN, 'twoSum')
    // int[] return type → json(__result).dump()
    expect(out).toContain('json(__result).dump()')
  })
})

describe('wrapGo', () => {
  it('starts with package main', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out.startsWith('package main')).toBe(true)
  })

  it('imports encoding/json, fmt, os', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('"encoding/json"')
    expect(out).toContain('"fmt"')
    expect(out).toContain('"os"')
  })

  it('includes user code', () => {
    expect(wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')).toContain(USER_CODE)
  })

  it('decodes stdin as JSON', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('json.NewDecoder(os.Stdin).Decode(&_i)')
  })

  it('casts int[] param from JSON', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    // int[] deserialization
    expect(out).toContain('_p_nums := make([]int')
    expect(out).toContain('int(_v.(float64))')
  })

  it('casts int param from JSON', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('_p_target := int(_i["target"].(float64))')
  })

  it('calls function and marshals result', () => {
    const out = wrapGo(USER_CODE, TWO_SUM_FN, 'twoSum')
    expect(out).toContain('twoSum(_p_nums, _p_target)')
    expect(out).toContain('json.Marshal(_result)')
    expect(out).toContain('fmt.Println(string(_out))')
  })
})

describe('buildWrappedCode', () => {
  it('dispatches to the correct wrapper for each language', () => {
    for (const lang of ['javascript', 'typescript', 'python', 'cpp', 'go'] as const) {
      const out = buildWrappedCode(lang, USER_CODE, TWO_SUM_FN, TWO_SUM_NAME_MAP)
      expect(out.length).toBeGreaterThan(0)
      expect(out).toContain(USER_CODE)
    }
  })

  it('uses python function name from functionNameMap in the wrapper call', () => {
    const out = buildWrappedCode('python', USER_CODE, TWO_SUM_FN, TWO_SUM_NAME_MAP)
    // The wrapper's print() call should use two_sum, not twoSum
    expect(out).toContain('print(json.dumps(two_sum(')
  })

  it('uses javascript function name from functionNameMap', () => {
    const out = buildWrappedCode('javascript', USER_CODE, TWO_SUM_FN, TWO_SUM_NAME_MAP)
    expect(out).toContain('twoSum(')
  })

  it('falls back to function def name when language missing from map', () => {
    const emptyMap = {}
    const out = buildWrappedCode('javascript', USER_CODE, TWO_SUM_FN, emptyMap)
    // Falls back to fnDef.name ('twoSum')
    expect(out).toContain('twoSum(')
  })
})

// ============================================================
// Executor
// ============================================================

describe('executeViaJudge0', () => {
  beforeEach(() => {
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockReset()
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockReset()
  })

  it('throws when problem definition is not found', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(null)

    await expect(
      executeViaJudge0('nonexistent', USER_CODE, 'javascript')
    ).rejects.toThrow('Problem definition not found')
  })

  it('returns passing results when Judge0 output matches expected', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,1]'),
      makeAccepted('[1,2]'),
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results).toHaveLength(2)
    expect(results[0]!.passed).toBe(true)
    expect(results[0]!.actual).toEqual([0, 1])
    expect(results[0]!.expected).toEqual([0, 1])
    expect(results[0]!.error).toBeNull()
    expect(results[0]!.testIndex).toBe(0)
    expect(results[1]!.passed).toBe(true)
    expect(results[1]!.testIndex).toBe(1)
  })

  it('returns failing result when output does not match expected', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,2]'), // wrong answer
      makeAccepted('[1,2]'),
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(false)
    expect(results[0]!.actual).toEqual([0, 2])
    expect(results[0]!.expected).toEqual([0, 1])
    expect(results[0]!.error).toBeNull()
    expect(results[1]!.passed).toBe(true)
  })

  it('returns error result when Judge0 reports a compile error', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeError('Compilation Error', 'SyntaxError: Unexpected token'),
      makeError('Compilation Error', 'SyntaxError: Unexpected token'),
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(false)
    expect(results[0]!.error).toBe('SyntaxError: Unexpected token')
    expect(results[0]!.actual).toBeNull()
  })

  it('returns error result when Judge0 reports a runtime error', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeError('Runtime Error', undefined, 'TypeError: Cannot read property'),
      makeAccepted('[1,2]'),
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(false)
    expect(results[0]!.error).toBe('TypeError: Cannot read property')
    expect(results[1]!.passed).toBe(true)
  })

  it('returns error result when stdout is not valid JSON', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('not-json-output'),
      makeAccepted('[1,2]'),
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(false)
    expect(results[0]!.error).toContain('Failed to parse output')
    expect(results[1]!.passed).toBe(true)
  })

  it('passes when orderMatters is false and array elements are in different order', async () => {
    const defUnordered = {
      ...TWO_SUM_DEF,
      testCases: [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], orderMatters: false },
      ],
    }
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(defUnordered)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[1,0]'), // reversed but same elements
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(true)
  })

  it('sends the correct language_id for each language', async () => {
    for (const [lang, expectedId] of Object.entries(LANGUAGE_IDS) as [keyof typeof LANGUAGE_IDS, number][]) {
      ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
      ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
        makeAccepted('[0,1]'),
        makeAccepted('[1,2]'),
      ])

      await executeViaJudge0('two-sum', USER_CODE, lang)

      const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls.at(-1)![0] as any[]
      expect(submissions[0]!.language_id).toBe(expectedId)

      ;(mockSubmitBatch as ReturnType<typeof mock>).mockReset()
      ;(mockGetJudgeDef as ReturnType<typeof mock>).mockReset()
    }
  })

  it('serializes each test case input as JSON stdin', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,1]'),
      makeAccepted('[1,2]'),
    ])

    await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
    expect(JSON.parse(submissions[0]!.stdin)).toEqual({ nums: [2, 7, 11, 15], target: 9 })
    expect(JSON.parse(submissions[1]!.stdin)).toEqual({ nums: [3, 2, 4], target: 6 })
  })

  it('submits one entry per test case in a single batch', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,1]'),
      makeAccepted('[1,2]'),
    ])

    await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    // Called exactly once (batch), with 2 submissions (one per test case)
    expect(mockSubmitBatch).toHaveBeenCalledTimes(1)
    const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
    expect(submissions).toHaveLength(2)
  })

  it('includes user code in source_code sent to Judge0', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,1]'),
      makeAccepted('[1,2]'),
    ])

    await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
    expect(submissions[0]!.source_code).toContain(USER_CODE)
  })

  it('uses python function name from functionNameMap in generated source', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('[0,1]'),
      makeAccepted('[1,2]'),
    ])

    await executeViaJudge0('two-sum', USER_CODE, 'python')

    const submissions = (mockSubmitBatch as ReturnType<typeof mock>).mock.calls[0]![0] as any[]
    expect(submissions[0]!.source_code).toContain('two_sum(')
  })

  it('records executionTimeMs from Judge0 time field', async () => {
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(TWO_SUM_DEF)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      { ...makeAccepted('[0,1]'), time: '0.123' },
      { ...makeAccepted('[1,2]'), time: null },
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.executionTimeMs).toBe(123)
    expect(results[1]!.executionTimeMs).toBe(0)
  })

  it('handles float comparison with 1e-6 tolerance', async () => {
    const floatDef = {
      ...TWO_SUM_DEF,
      function: { name: 'median', params: [{ name: 'x', type: 'float' }], returnType: 'float' },
      testCases: [{ input: { x: 1.5 }, expected: 0.3333333333333 }],
      functionNameMap: { javascript: 'median' },
    }
    ;(mockGetJudgeDef as ReturnType<typeof mock>).mockResolvedValue(floatDef)
    ;(mockSubmitBatch as ReturnType<typeof mock>).mockResolvedValue([
      makeAccepted('0.33333333333334'), // within 1e-6 of 0.3333333333333
    ])

    const results = await executeViaJudge0('two-sum', USER_CODE, 'javascript')

    expect(results[0]!.passed).toBe(true)
  })
})
