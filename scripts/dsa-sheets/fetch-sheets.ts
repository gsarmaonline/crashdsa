#!/usr/bin/env bun

/**
 * Fetch DSA problems from all sheet sources
 * Usage: bun run scripts/dsa-sheets/fetch-sheets.ts [--force]
 */

import type { FetchHistory, FetchMetadata } from '../../src/dsa-sheets/types';
import {
  SHEET_SOURCES,
  fetchFromLeetCodeAPI,
  saveRawData,
  loadRawData,
  isCacheFresh,
  createFetchMetadata
} from '../../src/dsa-sheets/fetchers';
import {
  NEETCODE_150,
  BLIND_75,
  GRIND_75,
  LEETCODE_TOP_150_SLUGS,
  STRIVER_A2Z_SLUGS
} from '../../src/dsa-sheets/curated-lists';

const FETCH_HISTORY_PATH = 'dsa-sheets/metadata/fetch-history.json';

async function main() {
  const forceRefetch = process.argv.includes('--force');

  console.log('🚀 Starting DSA sheet fetching...\n');

  if (forceRefetch) {
    console.log('🔄 Force refetch enabled, ignoring cache\n');
  }

  // Load existing fetch history
  const history = await loadFetchHistory();

  // Fetch LeetCode API data once (used by all sheets)
  console.log('📥 Fetching LeetCode problem database...');
  const leetcodeData = await fetchFromLeetCodeAPI();
  console.log(`✅ Loaded ${leetcodeData.stat_status_pairs.length} problems from LeetCode\n`);

  // Create lookup map for quick access
  const leetcodeMap = new Map();
  for (const problem of leetcodeData.stat_status_pairs) {
    leetcodeMap.set(problem.stat.question__title_slug, problem);
  }

  // Track results
  const results: FetchMetadata[] = [];
  let successCount = 0;
  let failCount = 0;

  // Fetch each sheet
  for (const source of SHEET_SOURCES) {
    console.log(`\n📋 Processing: ${source.displayName}`);
    console.log(`   Source: ${source.url}`);

    try {
      // Check cache
      const existingMetadata = history.sheets[source.name];
      if (!forceRefetch && existingMetadata && isCacheFresh(existingMetadata.lastFetched)) {
        console.log(`✅ Cache fresh, skipping fetch (last updated: ${new Date(existingMetadata.lastFetched).toLocaleString()})`);
        results.push(existingMetadata);
        successCount++;
        continue;
      }

      // Generate data based on source
      let data: any;
      let problemCount = 0;

      if (source.name === 'neetcode150') {
        // Convert NeetCode 150 structure to flat list
        data = {};
        for (const [category, slugs] of Object.entries(NEETCODE_150)) {
          data[category] = (slugs as string[]).map(slug => {
            const leetcodeProblem = leetcodeMap.get(slug);
            return createProblemFromSlug(slug, leetcodeProblem);
          }).filter(p => p !== null);
          problemCount += data[category].length;
        }
      } else if (source.name === 'blind75') {
        // Blind 75 as categorized list
        data = { "Blind 75": BLIND_75.map(slug => {
          const leetcodeProblem = leetcodeMap.get(slug);
          return createProblemFromSlug(slug, leetcodeProblem);
        }).filter(p => p !== null) };
        problemCount = data["Blind 75"].length;
      } else if (source.name === 'leetcode-top-150') {
        // Use LeetCode API top 150 problems
        data = leetcodeData.stat_status_pairs
          .filter((p: any) => !p.paid_only)
          .slice(0, 150);
        problemCount = data.length;
      } else if (source.name === 'grind75') {
        // Grind 75 problems
        data = { "Grind 75": GRIND_75.map(slug => {
          const leetcodeProblem = leetcodeMap.get(slug);
          return createProblemFromSlug(slug, leetcodeProblem);
        }).filter(p => p !== null) };
        problemCount = data["Grind 75"].length;
      } else if (source.name === 'striver-a2z') {
        // Striver's A2Z Sheet
        data = { "Striver A2Z": STRIVER_A2Z_SLUGS.map(slug => {
          const leetcodeProblem = leetcodeMap.get(slug);
          return createProblemFromSlug(slug, leetcodeProblem);
        }).filter(p => p !== null) };
        problemCount = data["Striver A2Z"].length;
      }

      // Save raw data
      await saveRawData(source.rawFilePath, data);

      // Create metadata
      const metadata = createFetchMetadata(source.name, problemCount, true);
      results.push(metadata);
      successCount++;

      console.log(`✅ Successfully fetched ${problemCount} problems`);

    } catch (error) {
      console.error(`❌ Failed to fetch ${source.displayName}:`, error);

      const metadata = createFetchMetadata(
        source.name,
        0,
        false,
        error instanceof Error ? error.message : String(error)
      );
      results.push(metadata);
      failCount++;
    }
  }

  // Update fetch history
  const newHistory: FetchHistory = {
    lastUpdate: new Date().toISOString(),
    sheets: results.reduce((acc, metadata) => {
      acc[metadata.sheet] = metadata;
      return acc;
    }, {} as Record<string, FetchMetadata>)
  };

  await saveFetchHistory(newHistory);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Fetch Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${SHEET_SOURCES.length}`);
  console.log(`❌ Failed: ${failCount}/${SHEET_SOURCES.length}`);
  console.log(`📁 Output: dsa-sheets/raw/`);
  console.log('='.repeat(60) + '\n');

  if (failCount > 0) {
    console.log('⚠️  Some sheets failed to fetch. Run with --force to retry.\n');
    process.exit(1);
  }

  console.log('✨ Fetch completed successfully!\n');
}

/**
 * Create problem object from slug and optional LeetCode data
 */
function createProblemFromSlug(slug: string, leetcodeProblem?: any): any {
  const titleCase = slug.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const problem: any = {
    name: leetcodeProblem?.stat?.question__title || titleCase,
    difficulty: leetcodeProblem ? mapDifficulty(leetcodeProblem.difficulty.level) : 'Medium',
    leetCodeLink: `https://leetcode.com/problems/${slug}/`
  };

  return problem;
}

/**
 * Map LeetCode difficulty level to string
 */
function mapDifficulty(level: number): string {
  switch (level) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    default: return 'Medium';
  }
}

/**
 * Load fetch history from file
 */
async function loadFetchHistory(): Promise<FetchHistory> {
  const file = Bun.file(FETCH_HISTORY_PATH);

  if (await file.exists()) {
    return await file.json();
  }

  return {
    lastUpdate: new Date().toISOString(),
    sheets: {} as any
  };
}

/**
 * Save fetch history to file
 */
async function saveFetchHistory(history: FetchHistory): Promise<void> {
  const file = Bun.file(FETCH_HISTORY_PATH);
  await Bun.write(file, JSON.stringify(history, null, 2));
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
