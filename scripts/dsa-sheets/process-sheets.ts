#!/usr/bin/env bun

/**
 * Process and normalize raw DSA sheet data
 * Usage: bun run scripts/dsa-sheets/process-sheets.ts
 */

import type { Problem, Difficulty, RawNeetCodeProblem, RawLeetCodeProblem, SheetName } from '../../src/dsa-sheets/types';
import { loadRawData } from '../../src/dsa-sheets/fetchers';

const PROCESSED_OUTPUT_PATH = 'dsa-sheets/processed/problems.json';

async function main() {
  console.log('🔄 Starting data processing...\n');

  const allProblems: Problem[] = [];

  // Process NeetCode 150
  console.log('📋 Processing NeetCode 150...');
  const neetcode150 = await processNeetCode150();
  allProblems.push(...neetcode150);
  console.log(`   ✅ Processed ${neetcode150.length} problems\n`);

  // Process Blind 75
  console.log('📋 Processing Blind 75...');
  const blind75 = await processBlind75();
  allProblems.push(...blind75);
  console.log(`   ✅ Processed ${blind75.length} problems\n`);

  // Process LeetCode Top 150
  console.log('📋 Processing LeetCode Top Interview 150...');
  const leetcodeTop150 = await processLeetCodeTop150();
  allProblems.push(...leetcodeTop150);
  console.log(`   ✅ Processed ${leetcodeTop150.length} problems\n`);

  // Process Grind 75
  console.log('📋 Processing Grind 75...');
  const grind75 = await processGrind75();
  allProblems.push(...grind75);
  console.log(`   ✅ Processed ${grind75.length} problems\n`);

  // Process Striver's A2Z
  console.log('📋 Processing Striver\'s A2Z...');
  const striverA2Z = await processStriverA2Z();
  allProblems.push(...striverA2Z);
  console.log(`   ✅ Processed ${striverA2Z.length} problems\n`);

  // Save processed data
  console.log('💾 Saving processed data...');
  const file = Bun.file(PROCESSED_OUTPUT_PATH);
  await Bun.write(file, JSON.stringify(allProblems, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Processing Summary');
  console.log('='.repeat(60));
  console.log(`📝 Total problems: ${allProblems.length}`);
  console.log(`📁 Output: ${PROCESSED_OUTPUT_PATH}`);
  console.log('='.repeat(60) + '\n');

  console.log('✨ Processing completed successfully!\n');
}

/**
 * Process NeetCode 150
 */
async function processNeetCode150(): Promise<Problem[]> {
  const rawData = await loadRawData('dsa-sheets/raw/neetcode150.json');
  if (!rawData) return [];

  const problems: Problem[] = [];

  // NeetCode 150 is organized by categories
  for (const category of Object.keys(rawData)) {
    const categoryProblems = rawData[category];

    for (const problem of categoryProblems) {
      const normalized = normalizeNeetCodeProblem(problem, 'neetcode150');
      if (normalized) {
        problems.push(normalized);
      }
    }
  }

  return problems;
}

/**
 * Process Blind 75
 */
async function processBlind75(): Promise<Problem[]> {
  const rawData = await loadRawData('dsa-sheets/raw/blind75.json');
  if (!rawData) return [];

  const problems: Problem[] = [];

  for (const category of Object.keys(rawData)) {
    const categoryProblems = rawData[category];

    for (const problem of categoryProblems) {
      const normalized = normalizeNeetCodeProblem(problem, 'blind75');
      if (normalized) {
        problems.push(normalized);
      }
    }
  }

  return problems;
}

/**
 * Process LeetCode Top 150
 */
async function processLeetCodeTop150(): Promise<Problem[]> {
  const rawData = await loadRawData('dsa-sheets/raw/leetcode-top-150.json');
  if (!rawData || !Array.isArray(rawData)) return [];

  return rawData
    .map((problem: RawLeetCodeProblem) => normalizeLeetCodeProblem(problem, 'leetcode-top-150'))
    .filter((p): p is Problem => p !== null);
}

/**
 * Process Grind 75
 */
async function processGrind75(): Promise<Problem[]> {
  const rawData = await loadRawData('dsa-sheets/raw/grind75.json');
  if (!rawData) return [];

  const problems: Problem[] = [];

  for (const category of Object.keys(rawData)) {
    const categoryProblems = rawData[category];

    for (const problem of categoryProblems) {
      const normalized = normalizeNeetCodeProblem(problem, 'grind75');
      if (normalized) {
        problems.push(normalized);
      }
    }
  }

  return problems;
}

/**
 * Process Striver's A2Z
 */
async function processStriverA2Z(): Promise<Problem[]> {
  const rawData = await loadRawData('dsa-sheets/raw/striver-a2z.json');
  if (!rawData) return [];

  const problems: Problem[] = [];

  for (const category of Object.keys(rawData)) {
    const categoryProblems = rawData[category];

    for (const problem of categoryProblems) {
      const normalized = normalizeNeetCodeProblem(problem, 'striver-a2z');
      if (normalized) {
        problems.push(normalized);
      }
    }
  }

  return problems;
}

/**
 * Normalize NeetCode/Blind 75 format problem
 */
function normalizeNeetCodeProblem(
  raw: RawNeetCodeProblem,
  source: SheetName
): Problem | null {
  if (!raw.name || !raw.leetCodeLink) return null;

  // Extract slug from LeetCode link
  const slug = extractSlugFromUrl(raw.leetCodeLink);
  if (!slug) return null;

  // Map difficulty
  const difficulty = mapDifficulty(raw.difficulty);

  return {
    id: `p-${source}-${slug}`,
    title: raw.name,
    slug,
    difficulty,
    link: raw.leetCodeLink,
    sourceSheets: [source],
    tags: [],
    patterns: []
  };
}

/**
 * Normalize LeetCode API format problem
 */
function normalizeLeetCodeProblem(
  raw: RawLeetCodeProblem,
  source: SheetName
): Problem | null {
  if (!raw.stat || !raw.stat.question__title_slug) return null;

  const slug = raw.stat.question__title_slug;
  const difficulty = mapLeetCodeDifficulty(raw.difficulty.level);
  const acceptance = raw.stat.total_submitted > 0
    ? (raw.stat.total_acs / raw.stat.total_submitted) * 100
    : undefined;

  return {
    id: `p-${source}-${slug}`,
    title: raw.stat.question__title,
    slug,
    difficulty,
    link: `https://leetcode.com/problems/${slug}/`,
    sourceSheets: [source],
    tags: [],
    patterns: [],
    acceptance: acceptance ? Math.round(acceptance * 10) / 10 : undefined,
    frequency: raw.frequency
  };
}

/**
 * Extract slug from LeetCode URL
 */
function extractSlugFromUrl(url: string): string | null {
  // Match patterns like:
  // https://leetcode.com/problems/two-sum/
  // https://leetcode.com/problems/two-sum
  const match = url.match(/leetcode\.com\/problems\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Map difficulty string to standard format
 */
function mapDifficulty(difficulty: string): Difficulty {
  const lower = difficulty.toLowerCase();
  if (lower.includes('easy')) return 'Easy';
  if (lower.includes('medium')) return 'Medium';
  if (lower.includes('hard')) return 'Hard';
  return 'Medium'; // Default
}

/**
 * Map LeetCode API difficulty level to standard format
 */
function mapLeetCodeDifficulty(level: number): Difficulty {
  switch (level) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    default: return 'Medium';
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
