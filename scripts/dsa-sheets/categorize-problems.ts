#!/usr/bin/env bun

/**
 * Categorize problems by assigning solution patterns
 * Usage: bun run scripts/dsa-sheets/categorize-problems.ts
 */

import type { Problem } from '../../src/dsa-sheets/types';
import { categorizeProblems, getCategorizationStats } from '../../src/dsa-sheets/categorizers';

const INPUT_PATH = 'dsa-sheets/processed/problems.json';
const OUTPUT_PATH = 'dsa-sheets/processed/problems-categorized.json';

async function main() {
  console.log('🏷️  Starting problem categorization...\n');

  // Load processed problems
  console.log('📂 Loading processed problems...');
  const file = Bun.file(INPUT_PATH);

  if (!await file.exists()) {
    console.error('❌ Processed problems file not found!');
    console.error('   Run: bun run scripts/dsa-sheets/process-sheets.ts first');
    process.exit(1);
  }

  const problems: Problem[] = await file.json();
  console.log(`   ✅ Loaded ${problems.length} problems\n`);

  // Categorize all problems
  console.log('🔍 Categorizing problems by patterns...');
  const categorized = categorizeProblems(problems);
  console.log(`   ✅ Categorized ${categorized.length} problems\n`);

  // Get statistics
  const stats = getCategorizationStats(categorized);

  // Save categorized data
  console.log('💾 Saving categorized data...');
  const outFile = Bun.file(OUTPUT_PATH);
  await Bun.write(outFile, JSON.stringify(categorized, null, 2));
  console.log(`   ✅ Saved to ${OUTPUT_PATH}\n`);

  // Print statistics
  console.log('='.repeat(60));
  console.log('📊 Categorization Statistics');
  console.log('='.repeat(60));
  console.log(`📝 Total problems: ${stats.totalProblems}`);
  console.log(`✅ With patterns: ${stats.withPatterns}`);
  console.log(`❌ Without patterns: ${stats.withoutPatterns}`);
  console.log('\n📋 Problems by Pattern:');
  console.log('-'.repeat(60));

  // Sort patterns by count
  const sortedPatterns = Object.entries(stats.byPattern)
    .sort(([, a], [, b]) => b - a);

  for (const [pattern, count] of sortedPatterns) {
    const percentage = ((count / stats.totalProblems) * 100).toFixed(1);
    console.log(`   ${pattern.padEnd(25)} ${String(count).padStart(4)} (${percentage}%)`);
  }

  console.log('='.repeat(60) + '\n');

  // Spot check some well-known problems
  console.log('🔎 Spot Check (Well-known Problems):');
  console.log('-'.repeat(60));

  const spotCheckSlugs = [
    'two-sum',
    'reverse-linked-list',
    'maximum-subarray',
    'merge-intervals',
    'valid-parentheses'
  ];

  for (const slug of spotCheckSlugs) {
    const problem = categorized.find(p => p.slug === slug);
    if (problem) {
      console.log(`   ${problem.title.padEnd(30)} → ${problem.patterns.join(', ')}`);
    }
  }

  console.log('='.repeat(60) + '\n');

  console.log('✨ Categorization completed successfully!\n');
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
