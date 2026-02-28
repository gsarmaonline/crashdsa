import type { Judge0Submission, Judge0Result } from './types.js'

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358'

// Status IDs 1 and 2 mean the submission hasn't finished yet.
const PENDING_STATUSES = new Set([1, 2])

export async function submitBatch(submissions: Judge0Submission[]): Promise<Judge0Result[]> {
  // Step 1: POST to create submissions — returns [{token}, ...] immediately
  const postRes = await fetch(`${JUDGE0_URL}/submissions/batch?base64_encoded=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissions }),
  })

  if (!postRes.ok) {
    throw new Error(`Judge0 batch submission failed: ${postRes.status} ${postRes.statusText}`)
  }

  const tokens = await postRes.json() as { token: string }[]
  const tokenList = tokens.map(t => t.token).join(',')

  // Step 2: Poll until all submissions reach a terminal status (>= 3).
  // wait=true on the GET is not reliably implemented for batch — poll manually.
  const maxAttempts = 30
  const pollIntervalMs = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const getRes = await fetch(
      `${JUDGE0_URL}/submissions/batch?tokens=${tokenList}&base64_encoded=false`
    )

    if (!getRes.ok) {
      throw new Error(`Judge0 batch fetch failed: ${getRes.status} ${getRes.statusText}`)
    }

    const data = await getRes.json() as { submissions: Judge0Result[] }
    const subs = data.submissions

    if (subs.every(s => !PENDING_STATUSES.has(s.status.id))) {
      return subs
    }

    if (attempt < maxAttempts - 1) {
      await new Promise<void>(r => setTimeout(r, pollIntervalMs))
    }
  }

  throw new Error('Judge0: submissions did not complete within timeout')
}

export async function isAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${JUDGE0_URL}/system_info`, { signal: AbortSignal.timeout(3000) })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check whether Judge0 workers are actually executing code.
 * Submits a trivial script and verifies it reaches Accepted (status 3).
 * Used by E2E tests to skip when running on Mac ARM where isolate can't
 * create cgroups.
 */
export async function isWorkerHealthy(): Promise<boolean> {
  try {
    const results = await submitBatch([{
      source_code: 'process.stdout.write("ok")',
      language_id: 63, // Node.js
      stdin: '',
    }])
    return results[0]?.status.id === 3
  } catch {
    return false
  }
}
