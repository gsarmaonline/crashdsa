/**
 * Core type definitions for DSA Sheet Aggregation System
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type PatternName =
  | 'two-pointers'
  | 'fast-slow-pointers'
  | 'sliding-window'
  | 'binary-search'
  | 'cyclic-sort'
  | 'linked-list-reversal'
  | 'tree-dfs'
  | 'tree-bfs'
  | 'graph-dfs'
  | 'graph-bfs'
  | 'union-find'
  | 'topological-sort'
  | 'backtracking'
  | 'dynamic-programming-1d'
  | 'dynamic-programming-2d'
  | 'greedy'
  | 'merge-intervals'
  | 'top-k-elements'
  | 'monotonic-stack'
  | 'bit-manipulation';

export type SheetName =
  | 'neetcode150'
  | 'blind75'
  | 'leetcode-top-150'
  | 'grind75'
  | 'striver-a2z';

/**
 * Core problem interface
 */
export interface Problem {
  id: string;                    // Unique: "p-leetcode-1"
  title: string;                 // "Two Sum"
  slug: string;                  // "two-sum"
  difficulty: Difficulty;
  link: string;                  // Direct URL
  sourceSheets: SheetName[];     // ["blind75", "neetcode150"]
  tags: string[];                // Original tags from source
  patterns: PatternName[];       // Assigned solution patterns
  acceptance?: number;           // Acceptance rate (0-100)
  frequency?: number;            // Problem frequency (if available)
}

/**
 * Pattern definition with metadata
 */
export interface Pattern {
  name: PatternName;
  displayName: string;
  description: string;
  keywords: string[];            // For keyword-based matching
  tagMappings: string[];         // LeetCode tags that map to this pattern
}

/**
 * Sheet source configuration
 */
export interface SheetSource {
  name: SheetName;
  displayName: string;
  url: string;
  fetchMethod: 'github' | 'leetcode-api' | 'web-scrape';
  rawFilePath: string;           // Path in dsa-sheets/raw/
}

/**
 * Fetch metadata for caching
 */
export interface FetchMetadata {
  sheet: SheetName;
  lastFetched: string;           // ISO timestamp
  problemCount: number;
  success: boolean;
  error?: string;
}

/**
 * Fetch history for all sheets
 */
export interface FetchHistory {
  lastUpdate: string;            // ISO timestamp
  sheets: Record<SheetName, FetchMetadata>;
}

/**
 * Duplicate problem group
 */
export interface DuplicateGroup {
  canonicalId: string;           // ID of the first occurrence
  problems: Problem[];           // All duplicate instances
  matchType: 'slug' | 'title' | 'link';
}

/**
 * Statistics for the aggregation process
 */
export interface AggregationStats {
  totalProblems: number;
  uniqueProblems: number;
  duplicatesRemoved: number;
  byDifficulty: Record<Difficulty, number>;
  byPattern: Record<PatternName, number>;
  bySheet: Record<SheetName, number>;
}

/**
 * Raw problem data from different sources (before normalization)
 */
export interface RawNeetCodeProblem {
  name: string;
  difficulty: string;
  leetCodeLink: string;
  videoLink?: string;
}

export interface RawLeetCodeProblem {
  stat: {
    question_id: number;
    question__title: string;
    question__title_slug: string;
    total_acs: number;
    total_submitted: number;
  };
  difficulty: {
    level: number;  // 1=Easy, 2=Medium, 3=Hard
  };
  paid_only: boolean;
  is_favor: boolean;
  frequency: number;
  progress: number;
}

/**
 * Manual pattern override entry
 */
export interface ManualPatternMapping {
  slug: string;
  patterns: PatternName[];
  reason?: string;  // Why this manual override exists
}

/**
 * Test case types for DSA problems
 */

export type InputType =
  | 'int'
  | 'float'
  | 'string'
  | 'boolean'
  | 'int[]'
  | 'float[]'
  | 'string[]'
  | 'boolean[]'
  | 'int[][]'
  | 'string[][]'
  | 'char[][]'
  | 'ListNode'          // Linked list: serialized as int[]
  | 'ListNode[]'        // Array of linked lists (merge k sorted)
  | 'TreeNode'          // Binary tree: BFS level-order with nulls
  | 'GraphNode'         // Graph: adjacency list int[][]
  | 'Interval[]';       // Intervals: serialized as int[][]

export type OutputType = InputType | 'void';

export type TestCaseTag =
  | 'basic'
  | 'edge-case'
  | 'empty-input'
  | 'single-element'
  | 'large-input'
  | 'negative-numbers'
  | 'duplicates'
  | 'all-same'
  | 'sorted'
  | 'reverse-sorted'
  | 'max-constraints'
  | 'cycle'
  | 'no-solution'
  | 'multiple-solutions';

export interface TestParam {
  name: string;
  type: InputType;
}

export interface TestCase {
  id: string;
  inputs: Record<string, unknown>;
  expected: unknown;
  explanation?: string;
  tags?: TestCaseTag[];
}

export interface DesignMethod {
  name: string;
  params: TestParam[];
  returnType: OutputType;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTestCases {
  slug: string;
  functionName: string;
  params: TestParam[];
  returnType: OutputType;
  testCases: TestCase[];
  notes?: string;
  outputOrderMatters?: boolean;
  isDesignProblem?: boolean;
  designMethods?: DesignMethod[];
  _status?: 'scaffold' | 'complete';
  // Problem definition fields (for judge support)
  description?: string;
  examples?: ProblemExample[];
  constraints?: string[];
  starterCode?: Record<string, string>;
  functionNameMap?: Record<string, string>;
}
