/**
 * Pattern definitions for categorizing DSA problems
 */

import type { Pattern, PatternName } from './types';

export const PATTERNS: Pattern[] = [
  {
    name: 'array-hashing',
    displayName: 'Array & Hashing',
    description: 'Problems involving arrays, hash tables, and hash sets',
    keywords: ['array', 'hash', 'map', 'set', 'hashmap', 'hashset', 'dictionary'],
    tagMappings: ['Array', 'Hash Table', 'Hash Map', 'Hash Set', 'Dictionary']
  },
  {
    name: 'two-pointers',
    displayName: 'Two Pointers',
    description: 'Problems using two-pointer technique, including fast/slow pointers',
    keywords: ['two pointer', 'two-pointer', 'fast slow', 'left right', 'start end'],
    tagMappings: ['Two Pointers', 'Fast and Slow Pointers']
  },
  {
    name: 'sliding-window',
    displayName: 'Sliding Window',
    description: 'Problems using sliding window technique for subarrays/substrings',
    keywords: ['sliding window', 'subarray', 'substring', 'consecutive', 'contiguous'],
    tagMappings: ['Sliding Window']
  },
  {
    name: 'binary-search',
    displayName: 'Binary Search',
    description: 'Problems involving binary search and its variations',
    keywords: ['binary search', 'sorted', 'search', 'logarithmic'],
    tagMappings: ['Binary Search', 'Binary Search Tree']
  },
  {
    name: 'linked-list',
    displayName: 'Linked List',
    description: 'Problems involving singly or doubly linked lists',
    keywords: ['linked list', 'node', 'next', 'prev', 'cycle'],
    tagMappings: ['Linked List', 'Doubly-Linked List']
  },
  {
    name: 'trees',
    displayName: 'Trees',
    description: 'Problems involving binary trees, BST, DFS, BFS',
    keywords: ['tree', 'binary tree', 'bst', 'dfs', 'bfs', 'traversal', 'level order', 'inorder', 'preorder', 'postorder'],
    tagMappings: ['Tree', 'Binary Tree', 'Binary Search Tree', 'Depth-First Search', 'Breadth-First Search', 'DFS', 'BFS']
  },
  {
    name: 'tries',
    displayName: 'Tries',
    description: 'Problems involving trie (prefix tree) data structure',
    keywords: ['trie', 'prefix tree', 'prefix', 'word'],
    tagMappings: ['Trie', 'Prefix Tree']
  },
  {
    name: 'heap-priority-queue',
    displayName: 'Heap / Priority Queue',
    description: 'Problems using heaps or priority queues',
    keywords: ['heap', 'priority queue', 'top k', 'kth', 'largest', 'smallest'],
    tagMappings: ['Heap', 'Priority Queue', 'Heap (Priority Queue)']
  },
  {
    name: 'backtracking',
    displayName: 'Backtracking',
    description: 'Problems requiring backtracking approach',
    keywords: ['backtrack', 'permutation', 'combination', 'subset', 'generate'],
    tagMappings: ['Backtracking', 'Recursion']
  },
  {
    name: 'graphs',
    displayName: 'Graphs',
    description: 'Problems involving graph algorithms (DFS, BFS, union-find, etc.)',
    keywords: ['graph', 'vertex', 'edge', 'connected', 'cycle', 'path', 'island', 'union find', 'disjoint set'],
    tagMappings: ['Graph', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Topological Sort']
  },
  {
    name: 'dynamic-programming',
    displayName: 'Dynamic Programming',
    description: 'Problems requiring dynamic programming techniques',
    keywords: ['dp', 'dynamic programming', 'memoization', 'tabulation', 'optimal substructure'],
    tagMappings: ['Dynamic Programming', 'DP', 'Memoization']
  },
  {
    name: 'greedy',
    displayName: 'Greedy',
    description: 'Problems solvable with greedy algorithms',
    keywords: ['greedy', 'optimal', 'local maximum', 'local minimum'],
    tagMappings: ['Greedy', 'Greedy Algorithm']
  },
  {
    name: 'intervals',
    displayName: 'Intervals',
    description: 'Problems involving interval merging, overlapping, etc.',
    keywords: ['interval', 'merge', 'overlap', 'meeting', 'range'],
    tagMappings: ['Interval', 'Merge Intervals', 'Line Sweep']
  },
  {
    name: 'math-geometry',
    displayName: 'Math & Geometry',
    description: 'Problems involving mathematical or geometric concepts',
    keywords: ['math', 'geometry', 'matrix', 'grid', 'coordinate', 'angle', 'distance'],
    tagMappings: ['Math', 'Geometry', 'Matrix', 'Number Theory', 'Combinatorics']
  },
  {
    name: 'bit-manipulation',
    displayName: 'Bit Manipulation',
    description: 'Problems using bitwise operations',
    keywords: ['bit', 'binary', 'xor', 'and', 'or', 'shift', 'bitwise'],
    tagMappings: ['Bit Manipulation', 'Bitwise', 'Binary']
  },
  {
    name: 'stack',
    displayName: 'Stack',
    description: 'Problems using stack data structure',
    keywords: ['stack', 'monotonic', 'parentheses', 'valid', 'push', 'pop'],
    tagMappings: ['Stack', 'Monotonic Stack', 'Queue', 'Monotonic Queue']
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
