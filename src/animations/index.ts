/**
 * Barrel export mapping PatternName → generator function.
 */

import type { PatternName } from '../dsa-sheets/types.js'
import {
  generateTwoPointers,
  generateFastSlowPointers,
  generateSlidingWindow,
  generateBinarySearch,
  generateCyclicSort,
  generateLinkedListReversal,
  generateTreeDFS,
  generateTreeBFS,
  generateGraphDFS,
  generateGraphBFS,
  generateUnionFind,
  generateTopologicalSort,
  generateBacktracking,
  generateDP1D,
  generateDP2D,
  generateGreedy,
  generateMergeIntervals,
  generateTopKElements,
  generateMonotonicStack,
  generateBitManipulation,
} from './generators.js'

export const ANIMATION_GENERATORS: Record<PatternName, () => string> = {
  'two-pointers': generateTwoPointers,
  'fast-slow-pointers': generateFastSlowPointers,
  'sliding-window': generateSlidingWindow,
  'binary-search': generateBinarySearch,
  'cyclic-sort': generateCyclicSort,
  'linked-list-reversal': generateLinkedListReversal,
  'tree-dfs': generateTreeDFS,
  'tree-bfs': generateTreeBFS,
  'graph-dfs': generateGraphDFS,
  'graph-bfs': generateGraphBFS,
  'union-find': generateUnionFind,
  'topological-sort': generateTopologicalSort,
  'backtracking': generateBacktracking,
  'dynamic-programming-1d': generateDP1D,
  'dynamic-programming-2d': generateDP2D,
  'greedy': generateGreedy,
  'merge-intervals': generateMergeIntervals,
  'top-k-elements': generateTopKElements,
  'monotonic-stack': generateMonotonicStack,
  'bit-manipulation': generateBitManipulation,
}

export function generateAnimation(pattern: PatternName): string {
  const generator = ANIMATION_GENERATORS[pattern]
  if (!generator) throw new Error(`No animation generator for pattern: ${pattern}`)
  return generator()
}
