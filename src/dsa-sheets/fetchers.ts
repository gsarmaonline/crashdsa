/**
 * Fetch utilities with retry logic for downloading DSA sheets
 */

import type { SheetSource, FetchMetadata } from './types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response;
      }

      // If rate limited, wait longer
      if (response.status === 429) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt + 1);
        console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
        await sleep(delay);
        continue;
      }

      // If not found or other client error, don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Server error, retry
      if (attempt < retries - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.log(`⚠️  Error: ${error}, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed to fetch after ${retries} attempts`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if cache is fresh
 */
export function isCacheFresh(lastFetched: string): boolean {
  const lastFetchTime = new Date(lastFetched).getTime();
  const now = Date.now();
  return (now - lastFetchTime) < CACHE_TTL_MS;
}

/**
 * Fetch from GitHub raw content
 */
export async function fetchFromGitHub(
  owner: string,
  repo: string,
  path: string
): Promise<any> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
  console.log(`📥 Fetching from GitHub: ${url}`);

  const response = await fetchWithRetry(url);
  return await response.json();
}

/**
 * Fetch from LeetCode API
 */
export async function fetchFromLeetCodeAPI(): Promise<any> {
  const url = 'https://leetcode.com/api/problems/all/';
  console.log(`📥 Fetching from LeetCode API: ${url}`);

  const response = await fetchWithRetry(url);
  return await response.json();
}

/**
 * Save raw data to file
 */
export async function saveRawData(
  filePath: string,
  data: any
): Promise<void> {
  const file = Bun.file(filePath);
  await Bun.write(file, JSON.stringify(data, null, 2));
  console.log(`💾 Saved to ${filePath}`);
}

/**
 * Load raw data from file
 */
export async function loadRawData(filePath: string): Promise<any> {
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return await file.json();
  }
  return null;
}

/**
 * Create fetch metadata
 */
export function createFetchMetadata(
  sheetName: string,
  problemCount: number,
  success: boolean,
  error?: string
): FetchMetadata {
  return {
    sheet: sheetName as any,
    lastFetched: new Date().toISOString(),
    problemCount,
    success,
    error
  };
}

/**
 * Sheet source definitions
 */
export const SHEET_SOURCES: SheetSource[] = [
  {
    name: 'neetcode150',
    displayName: 'NeetCode 150',
    url: 'https://github.com/envico801/Neetcode-150-and-Blind-75',
    fetchMethod: 'github',
    rawFilePath: 'dsa-sheets/raw/neetcode150.json'
  },
  {
    name: 'blind75',
    displayName: 'Blind 75',
    url: 'https://github.com/envico801/Neetcode-150-and-Blind-75',
    fetchMethod: 'github',
    rawFilePath: 'dsa-sheets/raw/blind75.json'
  },
  {
    name: 'leetcode-top-150',
    displayName: 'LeetCode Top Interview 150',
    url: 'https://leetcode.com/api/problems/all/',
    fetchMethod: 'leetcode-api',
    rawFilePath: 'dsa-sheets/raw/leetcode-top-150.json'
  },
  {
    name: 'grind75',
    displayName: 'Grind 75',
    url: 'https://www.techinterviewhandbook.org/grind75',
    fetchMethod: 'github',
    rawFilePath: 'dsa-sheets/raw/grind75.json'
  },
  {
    name: 'striver-a2z',
    displayName: "Striver's A2Z DSA Sheet",
    url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2',
    fetchMethod: 'github',
    rawFilePath: 'dsa-sheets/raw/striver-a2z.json'
  }
];
