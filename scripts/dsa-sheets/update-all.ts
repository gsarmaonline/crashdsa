#!/usr/bin/env bun

/**
 * Master orchestrator for DSA sheet aggregation pipeline
 * Runs all stages: fetch → process → categorize → deduplicate → export
 * Usage: bun run scripts/dsa-sheets/update-all.ts [--force]
 */

import { spawnSync } from 'bun';

interface StageResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function main() {
  const startTime = Date.now();
  const forceRefetch = process.argv.includes('--force');

  console.log('🚀 DSA Sheet Aggregation Pipeline');
  console.log('='.repeat(60));
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  if (forceRefetch) {
    console.log('🔄 Force mode: Ignoring cache');
  }
  console.log('='.repeat(60) + '\n');

  const results: StageResult[] = [];

  try {
    // Stage 1: Fetch
    console.log('📥 Stage 1/6: Fetching data from sources...\n');
    const fetchResult = await runStage(
      'Fetch',
      ['scripts/dsa-sheets/fetch-sheets.ts', ...(forceRefetch ? ['--force'] : [])]
    );
    results.push(fetchResult);
    if (!fetchResult.success) {
      throw new Error('Fetch stage failed');
    }

    // Stage 2: Process
    console.log('\n🔄 Stage 2/6: Processing and normalizing data...\n');
    const processResult = await runStage(
      'Process',
      ['scripts/dsa-sheets/process-sheets.ts']
    );
    results.push(processResult);
    if (!processResult.success) {
      throw new Error('Process stage failed');
    }

    // Stage 3: Categorize
    console.log('\n🏷️  Stage 3/6: Categorizing problems by patterns...\n');
    const categorizeResult = await runStage(
      'Categorize',
      ['scripts/dsa-sheets/categorize-problems.ts']
    );
    results.push(categorizeResult);
    if (!categorizeResult.success) {
      throw new Error('Categorize stage failed');
    }

    // Stage 4: Deduplicate
    console.log('\n🔍 Stage 4/6: Deduplicating problems...\n');
    const deduplicateResult = await runStage(
      'Deduplicate',
      ['scripts/dsa-sheets/deduplicate.ts']
    );
    results.push(deduplicateResult);
    if (!deduplicateResult.success) {
      throw new Error('Deduplicate stage failed');
    }

    // Stage 5: Export CSV
    console.log('\n📊 Stage 5/6: Exporting to CSV...\n');
    const exportResult = await runStage(
      'Export',
      ['scripts/dsa-sheets/export-csv.ts']
    );
    results.push(exportResult);
    if (!exportResult.success) {
      throw new Error('Export stage failed');
    }

    // Stage 6: Generate test case scaffolds
    console.log('\n🧪 Stage 6/6: Generating test case scaffolds...\n');
    const testCasesResult = await runStage(
      'Test Cases',
      ['scripts/dsa-sheets/generate-test-cases.ts']
    );
    results.push(testCasesResult);
    if (!testCasesResult.success) {
      throw new Error('Test case generation failed');
    }

    // Success summary
    const totalDuration = Date.now() - startTime;
    printSummary(results, totalDuration, true);

  } catch (error) {
    // Failure summary
    const totalDuration = Date.now() - startTime;
    printSummary(results, totalDuration, false);

    console.error(`\n❌ Pipeline failed: ${error}\n`);
    process.exit(1);
  }
}

/**
 * Run a pipeline stage
 */
async function runStage(name: string, args: string[]): Promise<StageResult> {
  const startTime = Date.now();

  try {
    const result = spawnSync({
      cmd: ['bun', 'run', ...args],
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const duration = Date.now() - startTime;

    if (result.exitCode === 0) {
      return { name, success: true, duration };
    } else {
      return {
        name,
        success: false,
        duration,
        error: `Exit code: ${result.exitCode}`
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Print pipeline summary
 */
function printSummary(
  results: StageResult[],
  totalDuration: number,
  success: boolean
): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Pipeline Summary');
  console.log('='.repeat(60));

  // Stage results
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const duration = formatDuration(result.duration);
    console.log(`${status} ${result.name.padEnd(15)} ${duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('-'.repeat(60));

  // Overall stats
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`📈 Stages completed: ${successCount}/${results.length}`);
  console.log(`⏱️  Total duration: ${formatDuration(totalDuration)}`);

  if (success) {
    console.log('✨ Status: SUCCESS');
    console.log('\n📁 Output files:');
    console.log('   • dsa-sheets/csv/master.csv');
    console.log('   • dsa-sheets/csv/by-pattern/*.csv');
    console.log('   • dsa-sheets/test-cases/*.json');
  } else {
    console.log('❌ Status: FAILED');
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
