#!/usr/bin/env bun

/**
 * Deduplicate problems across sheets
 * Usage: bun run scripts/dsa-sheets/deduplicate.ts
 */

import type { Problem, DuplicateGroup, SheetName } from '../../src/dsa-sheets/types';

const INPUT_PATH = 'dsa-sheets/processed/problems-categorized.json';
const OUTPUT_PATH = 'dsa-sheets/processed/problems-deduplicated.json';
const DUPLICATES_PATH = 'dsa-sheets/processed/duplicates.json';

async function main() {
  console.log('🔍 Starting deduplication...\n');

  // Load categorized problems
  console.log('📂 Loading categorized problems...');
  const file = Bun.file(INPUT_PATH);

  if (!await file.exists()) {
    console.error('❌ Categorized problems file not found!');
    console.error('   Run: bun run scripts/dsa-sheets/categorize-problems.ts first');
    process.exit(1);
  }

  const problems: Problem[] = await file.json();
  console.log(`   ✅ Loaded ${problems.length} problems\n`);

  // Find duplicates
  console.log('🔎 Finding duplicates...');
  const { unique, duplicates } = deduplicateProblems(problems);
  console.log(`   ✅ Found ${duplicates.length} duplicate groups\n`);

  // Save deduplicated data
  console.log('💾 Saving deduplicated data...');
  const outFile = Bun.file(OUTPUT_PATH);
  await Bun.write(outFile, JSON.stringify(unique, null, 2));
  console.log(`   ✅ Saved to ${OUTPUT_PATH}\n`);

  // Save duplicates report
  console.log('💾 Saving duplicates report...');
  const dupFile = Bun.file(DUPLICATES_PATH);
  await Bun.write(dupFile, JSON.stringify(duplicates, null, 2));
  console.log(`   ✅ Saved to ${DUPLICATES_PATH}\n`);

  // Print statistics
  console.log('='.repeat(60));
  console.log('📊 Deduplication Statistics');
  console.log('='.repeat(60));
  console.log(`📝 Original problems: ${problems.length}`);
  console.log(`✨ Unique problems: ${unique.length}`);
  console.log(`🔄 Duplicates removed: ${problems.length - unique.length}`);
  console.log(`📦 Duplicate groups: ${duplicates.length}`);
  console.log('='.repeat(60) + '\n');

  // Show some example duplicates
  if (duplicates.length > 0) {
    console.log('🔍 Top Duplicate Examples:');
    console.log('-'.repeat(60));

    const topDuplicates = duplicates.slice(0, 5);
    for (const group of topDuplicates) {
      const problem = unique.find(p => p.id === group.canonicalId);
      if (problem) {
        const sheets = problem.sourceSheets.join(', ');
        console.log(`   ${problem.title}`);
        console.log(`   → Found in: ${sheets}`);
        console.log(`   → Match type: ${group.matchType}`);
        console.log('');
      }
    }

    console.log('='.repeat(60) + '\n');
  }

  console.log('✨ Deduplication completed successfully!\n');
}

/**
 * Deduplicate problems using multi-level matching
 */
function deduplicateProblems(problems: Problem[]): {
  unique: Problem[];
  duplicates: DuplicateGroup[];
} {
  const uniqueProblems: Problem[] = [];
  const duplicateGroups: DuplicateGroup[] = [];
  const seenSlugs = new Map<string, Problem>();
  const seenTitles = new Map<string, Problem>();
  const seenLinks = new Map<string, Problem>();

  for (const problem of problems) {
    let isDuplicate = false;
    let matchType: 'slug' | 'title' | 'link' = 'slug';
    let existingProblem: Problem | undefined;

    // Level 1: Exact slug match
    if (seenSlugs.has(problem.slug)) {
      isDuplicate = true;
      matchType = 'slug';
      existingProblem = seenSlugs.get(problem.slug)!;
    }
    // Level 2: Normalized title match
    else {
      const normalizedTitle = normalizeTitle(problem.title);
      if (seenTitles.has(normalizedTitle)) {
        isDuplicate = true;
        matchType = 'title';
        existingProblem = seenTitles.get(normalizedTitle)!;
      }
      // Level 3: Link comparison
      else if (seenLinks.has(problem.link)) {
        isDuplicate = true;
        matchType = 'link';
        existingProblem = seenLinks.get(problem.link)!;
      }
    }

    if (isDuplicate && existingProblem) {
      // Merge with existing problem
      mergeProblem(existingProblem, problem);

      // Add to duplicates report if not already there
      let dupGroup = duplicateGroups.find(g => g.canonicalId === existingProblem!.id);
      if (!dupGroup) {
        dupGroup = {
          canonicalId: existingProblem.id,
          problems: [existingProblem],
          matchType
        };
        duplicateGroups.push(dupGroup);
      }
      dupGroup.problems.push(problem);
    } else {
      // New unique problem
      uniqueProblems.push(problem);
      seenSlugs.set(problem.slug, problem);
      seenTitles.set(normalizeTitle(problem.title), problem);
      seenLinks.set(problem.link, problem);
    }
  }

  return { unique: uniqueProblems, duplicates: duplicateGroups };
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Merge duplicate problem into existing problem
 */
function mergeProblem(existing: Problem, duplicate: Problem): void {
  // Merge source sheets
  for (const sheet of duplicate.sourceSheets) {
    if (!existing.sourceSheets.includes(sheet)) {
      existing.sourceSheets.push(sheet);
    }
  }

  // Merge tags
  for (const tag of duplicate.tags) {
    if (!existing.tags.includes(tag)) {
      existing.tags.push(tag);
    }
  }

  // Merge patterns
  for (const pattern of duplicate.patterns) {
    if (!existing.patterns.includes(pattern)) {
      existing.patterns.push(pattern);
    }
  }

  // Update acceptance rate if available and higher
  if (duplicate.acceptance !== undefined) {
    if (existing.acceptance === undefined || duplicate.acceptance > existing.acceptance) {
      existing.acceptance = duplicate.acceptance;
    }
  }

  // Update frequency if available and higher
  if (duplicate.frequency !== undefined) {
    if (existing.frequency === undefined || duplicate.frequency > existing.frequency) {
      existing.frequency = duplicate.frequency;
    }
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
