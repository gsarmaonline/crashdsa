#!/usr/bin/env bun

/**
 * Export deduplicated problems to CSV
 * Usage: bun run scripts/dsa-sheets/export-csv.ts
 */

import { createObjectCsvWriter } from 'csv-writer';
import type { Problem, PatternName } from '../../src/dsa-sheets/types';
import { PATTERNS } from '../../src/dsa-sheets/patterns';

const INPUT_PATH = 'dsa-sheets/processed/problems-deduplicated.json';
const MASTER_CSV_PATH = 'dsa-sheets/csv/master.csv';
const BY_PATTERN_DIR = 'dsa-sheets/csv/by-pattern';

async function main() {
  console.log('📊 Starting CSV export...\n');

  // Load deduplicated problems
  console.log('📂 Loading deduplicated problems...');
  const file = Bun.file(INPUT_PATH);

  if (!await file.exists()) {
    console.error('❌ Deduplicated problems file not found!');
    console.error('   Run: bun run scripts/dsa-sheets/deduplicate.ts first');
    process.exit(1);
  }

  const problems: Problem[] = await file.json();
  console.log(`   ✅ Loaded ${problems.length} problems\n`);

  // Export master CSV
  console.log('📝 Exporting master CSV...');
  await exportMasterCSV(problems);
  console.log(`   ✅ Saved to ${MASTER_CSV_PATH}\n`);

  // Export by-pattern CSVs
  console.log('📝 Exporting pattern-specific CSVs...');
  const patternCounts = await exportByPatternCSVs(problems);
  console.log(`   ✅ Created ${Object.keys(patternCounts).length} pattern CSVs\n`);

  // Print statistics
  console.log('='.repeat(60));
  console.log('📊 Export Statistics');
  console.log('='.repeat(60));
  console.log(`📝 Total problems: ${problems.length}`);
  console.log(`📄 Master CSV: ${MASTER_CSV_PATH}`);
  console.log(`📁 Pattern CSVs: ${BY_PATTERN_DIR}/`);
  console.log('\n📋 Problems per Pattern:');
  console.log('-'.repeat(60));

  // Sort patterns by count
  const sortedPatterns = Object.entries(patternCounts)
    .sort(([, a], [, b]) => b - a);

  for (const [pattern, count] of sortedPatterns) {
    const patternObj = PATTERNS.find(p => p.name === pattern);
    const displayName = patternObj?.displayName || pattern;
    console.log(`   ${displayName.padEnd(25)} ${String(count).padStart(4)} problems`);
  }

  console.log('='.repeat(60) + '\n');

  console.log('✨ CSV export completed successfully!\n');
}

/**
 * Export master CSV with all problems
 */
async function exportMasterCSV(problems: Problem[]): Promise<void> {
  const csvWriter = createObjectCsvWriter({
    path: MASTER_CSV_PATH,
    header: [
      { id: 'title', title: 'Problem Name' },
      { id: 'difficulty', title: 'Difficulty' },
      { id: 'patterns', title: 'Patterns' },
      { id: 'sourceSheets', title: 'Source Sheets' },
      { id: 'link', title: 'Link' },
      { id: 'acceptance', title: 'Acceptance Rate' },
      { id: 'tags', title: 'Tags' }
    ]
  });

  const records = problems.map(problem => ({
    title: problem.title,
    difficulty: problem.difficulty,
    patterns: problem.patterns.join('; '),
    sourceSheets: problem.sourceSheets.join('; '),
    link: problem.link,
    acceptance: problem.acceptance ? `${problem.acceptance}%` : 'N/A',
    tags: problem.tags.join('; ')
  }));

  await csvWriter.writeRecords(records);
}

/**
 * Export CSV files by pattern
 */
async function exportByPatternCSVs(problems: Problem[]): Promise<Record<string, number>> {
  const patternCounts: Record<string, number> = {};

  for (const pattern of PATTERNS) {
    // Filter problems with this pattern
    const patternProblems = problems.filter(p =>
      p.patterns.includes(pattern.name as PatternName)
    );

    if (patternProblems.length === 0) continue;

    // Sort by difficulty: Easy -> Medium -> Hard
    const sortedProblems = sortByDifficulty(patternProblems);

    // Create CSV writer
    const filePath = `${BY_PATTERN_DIR}/${pattern.name}.csv`;
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'title', title: 'Problem Name' },
        { id: 'difficulty', title: 'Difficulty' },
        { id: 'sourceSheets', title: 'Source Sheets' },
        { id: 'link', title: 'Link' },
        { id: 'acceptance', title: 'Acceptance Rate' }
      ]
    });

    // Write records
    const records = sortedProblems.map(problem => ({
      title: problem.title,
      difficulty: problem.difficulty,
      sourceSheets: problem.sourceSheets.join('; '),
      link: problem.link,
      acceptance: problem.acceptance ? `${problem.acceptance}%` : 'N/A'
    }));

    await csvWriter.writeRecords(records);

    patternCounts[pattern.name] = patternProblems.length;
  }

  return patternCounts;
}

/**
 * Sort problems by difficulty
 */
function sortByDifficulty(problems: Problem[]): Problem[] {
  const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

  return [...problems].sort((a, b) => {
    const orderA = difficultyOrder[a.difficulty];
    const orderB = difficultyOrder[b.difficulty];

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Secondary sort by title
    return a.title.localeCompare(b.title);
  });
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
