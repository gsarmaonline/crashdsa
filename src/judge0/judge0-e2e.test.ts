// E2E tests for Judge0 — real HTTP calls, no mocks at all.
// Auto-skipped when Judge0 is not reachable.

import { describe, it, expect } from 'bun:test'
import { isAvailable, isWorkerHealthy, submitBatch } from './client.js'
import { buildWrappedCode } from './wrappers.js'
import { LANGUAGE_IDS, type SupportedLanguage } from './types.js'

// ============================================================
// Two-sum fixture: return indices of two numbers that sum to target
// ============================================================

const FN_DEF = {
  name: 'twoSum',
  params: [
    { name: 'nums', type: 'int[]' },
    { name: 'target', type: 'int' },
  ],
  returnType: 'int[]',
}

const FN_NAME_MAP: Record<SupportedLanguage, string> = {
  javascript: 'twoSum',
  typescript: 'twoSum',
  python: 'twoSum',
  cpp: 'twoSum',
  go: 'twoSum',
}

const TEST_CASES = [
  { input: { nums: [2, 7, 11, 15], target: 9 },  expected: [0, 1] },
  { input: { nums: [3, 2, 4],      target: 6 },  expected: [1, 2] },
  { input: { nums: [3, 3],         target: 6 },  expected: [0, 1] },
]

// Correct two-sum solutions in each language.
// C++ and Go include any extra imports needed on top of what the wrapper provides.
const SOLUTIONS: Record<SupportedLanguage, string> = {
  javascript: `\
function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    if (map[target - nums[i]] !== undefined) return [map[target - nums[i]], i];
    map[nums[i]] = i;
  }
}`,

  typescript: `\
function twoSum(nums: number[], target: number): number[] {
  const map: Record<number, number> = {};
  for (let i = 0; i < nums.length; i++) {
    if (map[target - nums[i]] !== undefined) return [map[target - nums[i]]!, i];
    map[nums[i]] = i;
  }
  return [];
}`,

  python: `\
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`,

  // The wrapper adds iostream/vector/string/nlohmann headers; user adds unordered_map.
  cpp: `\
#include <unordered_map>
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> m;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (m.count(target - nums[i])) return {m[target - nums[i]], i};
        m[nums[i]] = i;
    }
    return {};
}`,

  // The wrapper provides package main + imports; user supplies the function only.
  go: `\
func twoSum(nums []int, target int) []int {
    seen := map[int]int{}
    for i, n := range nums {
        if j, ok := seen[target-n]; ok {
            return []int{j, i}
        }
        seen[n] = i
    }
    return nil
}`,
}

// ============================================================
// Availability check — skip the whole suite if Judge0 is down
// or if workers can't execute code (e.g. Mac ARM missing cgroups)
// ============================================================

const judge0Available = await isAvailable()

if (!judge0Available) {
  console.log(
    `[judge0-e2e] Judge0 not reachable at ${process.env.JUDGE0_URL ?? 'http://localhost:2358'} — skipping all E2E tests`
  )
}

// Only run the full suite when workers are actually executing code.
// On Mac ARM, Judge0 server is reachable but isolate can't create cgroups,
// so every submission ends in Internal Error (status 13).
const workersHealthy = judge0Available && await isWorkerHealthy()

if (judge0Available && !workersHealthy) {
  console.log(
    '[judge0-e2e] Judge0 server is up but workers are not executing code ' +
    '(isolate likely missing cgroup support — expected on Mac ARM). Skipping E2E tests.'
  )
}

// ============================================================
// Helpers
// ============================================================

/** Submit all TEST_CASES for a given language+solution, return raw Judge0 results. */
async function submitAll(language: SupportedLanguage, code: string) {
  const source_code = buildWrappedCode(language, code, FN_DEF, FN_NAME_MAP)
  const submissions = TEST_CASES.map((tc) => ({
    source_code,
    language_id: LANGUAGE_IDS[language],
    stdin: JSON.stringify(tc.input),
  }))
  return submitBatch(submissions)
}

// ============================================================
// Tests — correct solutions (one it-block per language to avoid
// beforeAll-in-loop scoping issues with Bun's test runner)
// ============================================================

describe.skipIf(!workersHealthy)('Judge0 E2E — correct solutions', () => {
  for (const lang of Object.keys(SOLUTIONS) as SupportedLanguage[]) {
    it(`${lang}: all test cases accepted with correct output`, async () => {
      const results = await submitAll(lang, SOLUTIONS[lang])

      // All submissions must reach Accepted (status 3)
      for (const r of results) {
        expect(r.status.id).toBe(3)
      }

      // stdout must parse to the expected array
      for (let i = 0; i < TEST_CASES.length; i++) {
        const stdout = (results[i]!.stdout ?? '').trim()
        const actual = JSON.parse(stdout)
        expect(actual).toEqual(TEST_CASES[i]!.expected)
      }

      // No compile errors or runtime errors
      for (const r of results) {
        expect(r.compile_output ?? '').toBe('')
        expect(r.stderr ?? '').toBe('')
      }

      // Execution time must be reported
      for (const r of results) {
        expect(r.time).not.toBeNull()
        expect(parseFloat(r.time!)).toBeGreaterThan(0)
      }
    })
  }
})

describe.skipIf(!workersHealthy)('Judge0 E2E — error cases (JavaScript)', () => {
  it('wrong answer: status is Accepted but output differs from expected', async () => {
    // Always returns [0, 0] — runs fine but answer is wrong
    const wrongCode = `function twoSum(nums, target) { return [0, 0]; }`
    const results = await submitAll('javascript', wrongCode)

    // Judge0 accepts the submission (no runtime error)
    expect(results[0]!.status.id).toBe(3)
    // But the output doesn't match what we expect
    const actual = JSON.parse((results[0]!.stdout ?? '').trim())
    expect(actual).not.toEqual(TEST_CASES[0]!.expected)
  })

  it('compile error: status is not Accepted and compile_output is set', async () => {
    const badCode = `function twoSum(nums, target {  // syntax error`
    const results = await submitAll('javascript', badCode)

    expect(results[0]!.status.id).not.toBe(3)
    const errorText = results[0]!.compile_output ?? results[0]!.stderr ?? ''
    expect(errorText.length).toBeGreaterThan(0)
  })

  it('runtime error: status is not Accepted and stderr is set', async () => {
    const runtimeErrorCode = `function twoSum(nums, target) { throw new Error("boom"); }`
    const results = await submitAll('javascript', runtimeErrorCode)

    expect(results[0]!.status.id).not.toBe(3)
    const errorText = results[0]!.stderr ?? results[0]!.compile_output ?? ''
    expect(errorText).toContain('boom')
  })
})

describe.skipIf(!workersHealthy)('Judge0 E2E — language IDs round-trip', () => {
  it('each language ID resolves to the correct runtime', async () => {
    // Submit a trivial "hello" program per language and verify it runs without error.
    // This confirms the language_id in LANGUAGE_IDS maps to a real Judge0 runtime.
    const hellos: Record<SupportedLanguage, { code: string; expectedOutput: string }> = {
      javascript: {
        code: `process.stdout.write(JSON.stringify(42));`,
        expectedOutput: '42',
      },
      typescript: {
        code: `process.stdout.write(JSON.stringify(42));`,
        expectedOutput: '42',
      },
      python: {
        code: `import json\nprint(json.dumps(42))`,
        expectedOutput: '42',
      },
      cpp: {
        code: `int main(){std::cout<<42;return 0;}`,
        expectedOutput: '42',
      },
      go: {
        code: `package main\nimport "fmt"\nfunc main(){fmt.Print(42)}`,
        expectedOutput: '42',
      },
    }

    for (const [lang, { code, expectedOutput }] of Object.entries(hellos) as [SupportedLanguage, { code: string; expectedOutput: string }][]) {
      const results = await submitBatch([{
        source_code: code,
        language_id: LANGUAGE_IDS[lang],
        stdin: '',
      }])
      expect(results[0]!.status.id).toBe(3)
      expect((results[0]!.stdout ?? '').trim()).toBe(expectedOutput)
    }
  })
})
