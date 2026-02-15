/**
 * Categorization logic for assigning patterns to problems
 */

import type { Problem, PatternName, ManualPatternMapping } from './types';
import { mapTagToPatterns, findPatternsByKeywords } from './patterns';
import manualMappings from './mappings/manual-patterns.json';

/**
 * Categorize a problem using hybrid approach
 * Priority: Manual overrides > Tag mapping > Keyword matching
 */
export function categorizeProblem(problem: Problem): PatternName[] {
  const patterns = new Set<PatternName>();

  // 1. Check manual overrides first (highest priority)
  const manualPattern = getManualPattern(problem.slug);
  if (manualPattern) {
    manualPattern.forEach(p => patterns.add(p));
    return Array.from(patterns);
  }

  // 2. Map from LeetCode tags (medium priority)
  if (problem.tags && problem.tags.length > 0) {
    problem.tags.forEach(tag => {
      const mappedPatterns = mapTagToPatterns(tag);
      mappedPatterns.forEach(p => patterns.add(p));
    });
  }

  // 3. Keyword matching from title (fallback)
  if (patterns.size === 0) {
    const keywordPatterns = findPatternsByKeywords(problem.title);
    keywordPatterns.forEach(p => patterns.add(p));
  }

  // 4. If still no patterns, assign a default based on difficulty
  if (patterns.size === 0) {
    patterns.add('array-hashing'); // Default fallback
  }

  return Array.from(patterns);
}

/**
 * Get manual pattern override for a problem slug
 */
function getManualPattern(slug: string): PatternName[] | null {
  const mapping = manualMappings[slug as keyof typeof manualMappings];
  if (mapping && mapping.patterns) {
    return mapping.patterns as PatternName[];
  }
  return null;
}

/**
 * Batch categorize problems
 */
export function categorizeProblems(problems: Problem[]): Problem[] {
  return problems.map(problem => ({
    ...problem,
    patterns: categorizeProblem(problem)
  }));
}

/**
 * Get categorization statistics
 */
export function getCategorizationStats(problems: Problem[]): {
  totalProblems: number;
  withPatterns: number;
  withoutPatterns: number;
  byPattern: Record<string, number>;
} {
  const stats = {
    totalProblems: problems.length,
    withPatterns: 0,
    withoutPatterns: 0,
    byPattern: {} as Record<string, number>
  };

  problems.forEach(problem => {
    if (problem.patterns && problem.patterns.length > 0) {
      stats.withPatterns++;
      problem.patterns.forEach(pattern => {
        stats.byPattern[pattern] = (stats.byPattern[pattern] || 0) + 1;
      });
    } else {
      stats.withoutPatterns++;
    }
  });

  return stats;
}
