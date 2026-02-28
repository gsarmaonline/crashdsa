import type { Judge0Submission, Judge0Result } from './types.js'

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358'

export async function submitBatch(submissions: Judge0Submission[]): Promise<Judge0Result[]> {
  const response = await fetch(`${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissions }),
  })

  if (!response.ok) {
    throw new Error(`Judge0 batch submission failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { submissions: Judge0Result[] }
  return data.submissions
}

export async function isAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${JUDGE0_URL}/system_info`, { signal: AbortSignal.timeout(3000) })
    return response.ok
  } catch {
    return false
  }
}
