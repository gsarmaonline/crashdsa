/**
 * Pure solution pattern definitions for senior engineers
 * Focus on algorithmic strategies, not data structures
 */

import type { Pattern, PatternName } from './types';

export const PATTERNS: Pattern[] = [
  {
    name: 'two-pointers',
    displayName: 'Two Pointers',
    description: 'Move pointers from opposite ends or same direction to solve array/string problems',
    keywords: ['two pointer', 'left right', 'start end', 'opposite direction'],
    tagMappings: ['Two Pointers']
  },
  {
    name: 'fast-slow-pointers',
    displayName: 'Fast & Slow Pointers',
    description: 'Use two pointers moving at different speeds for cycle detection and middle finding',
    keywords: ['fast slow', 'cycle detection', 'middle', 'tortoise hare', 'floyd'],
    tagMappings: ['Linked List', 'Two Pointers']
  },
  {
    name: 'sliding-window',
    displayName: 'Sliding Window',
    description: 'Dynamic window over array/string for subarray/substring optimization',
    keywords: ['sliding window', 'subarray', 'substring', 'consecutive', 'contiguous', 'window'],
    tagMappings: ['Sliding Window']
  },
  {
    name: 'binary-search',
    displayName: 'Binary Search',
    description: 'Search in sorted space with O(log n) complexity and variations',
    keywords: ['binary search', 'sorted', 'search', 'logarithmic', 'divide'],
    tagMappings: ['Binary Search', 'Binary Search Tree']
  },
  {
    name: 'cyclic-sort',
    displayName: 'Cyclic Sort',
    description: 'Sort array where numbers are in range [1, n] to find missing/duplicate',
    keywords: ['cyclic', 'missing number', 'duplicate', 'range'],
    tagMappings: ['Array', 'Sorting']
  },
  {
    name: 'linked-list-reversal',
    displayName: 'In-place Linked List Reversal',
    description: 'Reverse linked list or parts of it in-place without extra space',
    keywords: ['reverse linked list', 'reverse', 'in place', 'reorder'],
    tagMappings: ['Linked List']
  },
  {
    name: 'tree-dfs',
    displayName: 'Tree DFS',
    description: 'Depth-first traversal strategies (preorder, inorder, postorder)',
    keywords: ['tree', 'dfs', 'depth first', 'preorder', 'inorder', 'postorder', 'recursion'],
    tagMappings: ['Tree', 'Binary Tree', 'Depth-First Search', 'DFS', 'Recursion']
  },
  {
    name: 'tree-bfs',
    displayName: 'Tree BFS',
    description: 'Level-order traversal using queue for breadth-first exploration',
    keywords: ['tree', 'bfs', 'breadth first', 'level order', 'level', 'queue'],
    tagMappings: ['Tree', 'Binary Tree', 'Breadth-First Search', 'BFS', 'Queue']
  },
  {
    name: 'graph-dfs',
    displayName: 'Graph DFS',
    description: 'Explore all paths in graph using depth-first search',
    keywords: ['graph', 'dfs', 'depth first', 'explore', 'path', 'island', 'connected'],
    tagMappings: ['Graph', 'Depth-First Search', 'DFS']
  },
  {
    name: 'graph-bfs',
    displayName: 'Graph BFS',
    description: 'Find shortest path or explore level-wise using breadth-first search',
    keywords: ['graph', 'bfs', 'breadth first', 'shortest path', 'level'],
    tagMappings: ['Graph', 'Breadth-First Search', 'BFS']
  },
  {
    name: 'union-find',
    displayName: 'Union Find',
    description: 'Disjoint set data structure for connectivity and grouping problems',
    keywords: ['union find', 'disjoint set', 'connected component', 'connectivity'],
    tagMappings: ['Union Find', 'Disjoint Set']
  },
  {
    name: 'topological-sort',
    displayName: 'Topological Sort',
    description: 'Order tasks with dependencies using DFS or Kahn\'s algorithm',
    keywords: ['topological', 'dependency', 'order', 'course', 'prerequisite'],
    tagMappings: ['Topological Sort', 'Graph']
  },
  {
    name: 'backtracking',
    displayName: 'Backtracking',
    description: 'Generate all combinations, permutations, or subsets by exploring and backtracking',
    keywords: ['backtrack', 'permutation', 'combination', 'subset', 'generate', 'all'],
    tagMappings: ['Backtracking', 'Recursion']
  },
  {
    name: 'dynamic-programming-1d',
    displayName: 'Dynamic Programming - 1D',
    description: 'Optimize using single array DP (Fibonacci, climbing stairs, house robber)',
    keywords: ['dp', 'dynamic programming', 'memoization', 'tabulation', '1d', 'fibonacci', 'climb'],
    tagMappings: ['Dynamic Programming', 'DP', 'Memoization']
  },
  {
    name: 'dynamic-programming-2d',
    displayName: 'Dynamic Programming - 2D',
    description: 'Optimize using 2D DP (LCS, edit distance, matrix problems)',
    keywords: ['dp', 'dynamic programming', '2d', 'matrix', 'grid', 'lcs', 'subsequence'],
    tagMappings: ['Dynamic Programming', 'DP', 'Matrix']
  },
  {
    name: 'greedy',
    displayName: 'Greedy',
    description: 'Make locally optimal choice at each step to find global optimum',
    keywords: ['greedy', 'optimal', 'local', 'choice'],
    tagMappings: ['Greedy', 'Greedy Algorithm']
  },
  {
    name: 'merge-intervals',
    displayName: 'Merge Intervals',
    description: 'Merge, insert, or find overlapping intervals',
    keywords: ['interval', 'merge', 'overlap', 'meeting', 'range'],
    tagMappings: ['Interval', 'Merge Intervals', 'Line Sweep']
  },
  {
    name: 'top-k-elements',
    displayName: 'Top K Elements',
    description: 'Find K largest/smallest elements using heap or quickselect',
    keywords: ['heap', 'priority queue', 'top k', 'kth', 'largest', 'smallest', 'k closest'],
    tagMappings: ['Heap', 'Priority Queue', 'Heap (Priority Queue)', 'Quickselect']
  },
  {
    name: 'monotonic-stack',
    displayName: 'Monotonic Stack',
    description: 'Use stack to find next greater/smaller element efficiently',
    keywords: ['stack', 'monotonic', 'next greater', 'next smaller', 'temperature', 'histogram'],
    tagMappings: ['Stack', 'Monotonic Stack']
  },
  {
    name: 'bit-manipulation',
    displayName: 'Bit Manipulation',
    description: 'Use bitwise operations (XOR, AND, OR, shifts) to solve problems efficiently',
    keywords: ['bit', 'binary', 'xor', 'and', 'or', 'shift', 'bitwise', 'mask'],
    tagMappings: ['Bit Manipulation', 'Bitwise', 'Binary']
  }
];

/**
 * Get pattern by name
 */
export function getPattern(name: PatternName): Pattern | undefined {
  return PATTERNS.find(p => p.name === name);
}

/**
 * Get all pattern names
 */
export function getPatternNames(): PatternName[] {
  return PATTERNS.map(p => p.name);
}

/**
 * Map LeetCode tag to pattern names
 */
export function mapTagToPatterns(tag: string): PatternName[] {
  const patterns: PatternName[] = [];

  for (const pattern of PATTERNS) {
    // Check if tag matches any of the pattern's tag mappings (case-insensitive)
    if (pattern.tagMappings.some(mapping =>
      mapping.toLowerCase() === tag.toLowerCase()
    )) {
      patterns.push(pattern.name);
    }
  }

  return patterns;
}

/**
 * Find patterns by keyword matching in problem title
 */
export function findPatternsByKeywords(title: string): PatternName[] {
  const titleLower = title.toLowerCase();
  const patterns: PatternName[] = [];

  for (const pattern of PATTERNS) {
    // Check if any keyword appears in the title
    if (pattern.keywords.some(keyword => titleLower.includes(keyword))) {
      patterns.push(pattern.name);
    }
  }

  return patterns;
}
