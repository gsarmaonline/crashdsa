/**
 * Curated problem lists for well-known DSA sheets
 * These are the actual problems from each sheet
 */

// NeetCode 150 problems (organized by category)
export const NEETCODE_150 = {
  "Arrays & Hashing": [
    "contains-duplicate", "valid-anagram", "two-sum", "group-anagrams",
    "top-k-frequent-elements", "product-of-array-except-self",
    "valid-sudoku", "encode-and-decode-strings", "longest-consecutive-sequence"
  ],
  "Two Pointers": [
    "valid-palindrome", "two-sum-ii-input-array-is-sorted", "3sum",
    "container-with-most-water", "trapping-rain-water"
  ],
  "Sliding Window": [
    "best-time-to-buy-and-sell-stock", "longest-substring-without-repeating-characters",
    "longest-repeating-character-replacement", "permutation-in-string",
    "minimum-window-substring", "sliding-window-maximum"
  ],
  "Stack": [
    "valid-parentheses", "min-stack", "evaluate-reverse-polish-notation",
    "generate-parentheses", "daily-temperatures", "car-fleet",
    "largest-rectangle-in-histogram"
  ],
  "Binary Search": [
    "binary-search", "search-a-2d-matrix", "koko-eating-bananas",
    "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array",
    "time-based-key-value-store", "median-of-two-sorted-arrays"
  ],
  "Linked List": [
    "reverse-linked-list", "merge-two-sorted-lists", "reorder-list",
    "remove-nth-node-from-end-of-list", "copy-list-with-random-pointer",
    "add-two-numbers", "linked-list-cycle", "find-the-duplicate-number",
    "lru-cache", "merge-k-sorted-lists", "reverse-nodes-in-k-group"
  ],
  "Trees": [
    "invert-binary-tree", "maximum-depth-of-binary-tree", "diameter-of-binary-tree",
    "balanced-binary-tree", "same-tree", "subtree-of-another-tree",
    "lowest-common-ancestor-of-a-binary-search-tree",
    "binary-tree-level-order-traversal", "binary-tree-right-side-view",
    "count-good-nodes-in-binary-tree", "validate-binary-search-tree",
    "kth-smallest-element-in-a-bst", "construct-binary-tree-from-preorder-and-inorder-traversal",
    "binary-tree-maximum-path-sum", "serialize-and-deserialize-binary-tree"
  ],
  "Tries": [
    "implement-trie-prefix-tree", "design-add-and-search-words-data-structure",
    "word-search-ii"
  ],
  "Heap / Priority Queue": [
    "kth-largest-element-in-a-stream", "last-stone-weight", "k-closest-points-to-origin",
    "kth-largest-element-in-an-array", "task-scheduler", "design-twitter",
    "find-median-from-data-stream"
  ],
  "Backtracking": [
    "subsets", "combination-sum", "permutations", "subsets-ii",
    "combination-sum-ii", "word-search", "palindrome-partitioning",
    "letter-combinations-of-a-phone-number", "n-queens"
  ],
  "Graphs": [
    "number-of-islands", "clone-graph", "max-area-of-island",
    "pacific-atlantic-water-flow", "surrounded-regions", "rotting-oranges",
    "walls-and-gates", "course-schedule", "course-schedule-ii",
    "redundant-connection", "number-of-connected-components-in-an-undirected-graph",
    "graph-valid-tree", "word-ladder"
  ],
  "Advanced Graphs": [
    "reconstruct-itinerary", "min-cost-to-connect-all-points",
    "network-delay-time", "swim-in-rising-water", "alien-dictionary",
    "cheapest-flights-within-k-stops"
  ],
  "1-D Dynamic Programming": [
    "climbing-stairs", "min-cost-climbing-stairs", "house-robber",
    "house-robber-ii", "longest-palindromic-substring", "palindromic-substrings",
    "decode-ways", "coin-change", "maximum-product-subarray",
    "word-break", "longest-increasing-subsequence", "partition-equal-subset-sum"
  ],
  "2-D Dynamic Programming": [
    "unique-paths", "longest-common-subsequence", "best-time-to-buy-and-sell-stock-with-cooldown",
    "coin-change-2", "target-sum", "interleaving-string",
    "longest-increasing-path-in-a-matrix", "distinct-subsequences",
    "edit-distance", "burst-balloons", "regular-expression-matching"
  ],
  "Greedy": [
    "maximum-subarray", "jump-game", "jump-game-ii",
    "gas-station", "hand-of-straights", "merge-triplets-to-form-target-triplet",
    "partition-labels", "valid-parenthesis-string"
  ],
  "Intervals": [
    "insert-interval", "merge-intervals", "non-overlapping-intervals",
    "meeting-rooms", "meeting-rooms-ii", "minimum-interval-to-include-each-query"
  ],
  "Math & Geometry": [
    "rotate-image", "spiral-matrix", "set-matrix-zeroes",
    "happy-number", "plus-one", "pow-x-n", "multiply-strings",
    "detect-squares"
  ],
  "Bit Manipulation": [
    "single-number", "number-of-1-bits", "counting-bits",
    "reverse-bits", "missing-number", "sum-of-two-integers",
    "reverse-integer"
  ]
};

// Blind 75 problems
export const BLIND_75 = [
  // Array
  "two-sum", "best-time-to-buy-and-sell-stock", "contains-duplicate",
  "product-of-array-except-self", "maximum-subarray", "maximum-product-subarray",
  "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array",
  "3sum", "container-with-most-water",
  // Binary
  "sum-of-two-integers", "number-of-1-bits", "counting-bits",
  "missing-number", "reverse-bits",
  // Dynamic Programming
  "climbing-stairs", "coin-change", "longest-increasing-subsequence",
  "longest-common-subsequence", "word-break", "combination-sum-iv",
  "house-robber", "house-robber-ii", "decode-ways", "unique-paths",
  "jump-game",
  // Graph
  "clone-graph", "course-schedule", "pacific-atlantic-water-flow",
  "number-of-islands", "longest-consecutive-sequence", "alien-dictionary",
  "graph-valid-tree", "number-of-connected-components-in-an-undirected-graph",
  // Interval
  "insert-interval", "merge-intervals", "non-overlapping-intervals",
  "meeting-rooms", "meeting-rooms-ii",
  // Linked List
  "reverse-linked-list", "linked-list-cycle", "merge-two-sorted-lists",
  "merge-k-sorted-lists", "remove-nth-node-from-end-of-list",
  "reorder-list",
  // Matrix
  "set-matrix-zeroes", "spiral-matrix", "rotate-image",
  "word-search",
  // String
  "longest-substring-without-repeating-characters", "longest-repeating-character-replacement",
  "minimum-window-substring", "valid-anagram", "group-anagrams",
  "valid-parentheses", "valid-palindrome", "longest-palindromic-substring",
  "palindromic-substrings", "encode-and-decode-strings",
  // Tree
  "maximum-depth-of-binary-tree", "same-tree", "invert-binary-tree",
  "binary-tree-maximum-path-sum", "binary-tree-level-order-traversal",
  "serialize-and-deserialize-binary-tree", "subtree-of-another-tree",
  "construct-binary-tree-from-preorder-and-inorder-traversal",
  "validate-binary-search-tree", "kth-smallest-element-in-a-bst",
  "lowest-common-ancestor-of-a-binary-search-tree",
  "implement-trie-prefix-tree", "design-add-and-search-words-data-structure",
  "word-search-ii",
  // Heap
  "merge-k-sorted-lists", "top-k-frequent-elements",
  "find-median-from-data-stream"
];

// Grind 75 (Week 1-5 problems)
export const GRIND_75 = [
  // Week 1
  "two-sum", "valid-parentheses", "merge-two-sorted-lists",
  "best-time-to-buy-and-sell-stock", "valid-palindrome",
  "invert-binary-tree", "valid-anagram", "binary-search",
  "flood-fill", "lowest-common-ancestor-of-a-binary-search-tree",
  "balanced-binary-tree", "linked-list-cycle", "implement-queue-using-stacks",
  // Week 2
  "first-bad-version", "ransom-note", "climbing-stairs",
  "longest-palindrome", "reverse-linked-list", "majority-element",
  "add-binary", "diameter-of-binary-tree", "middle-of-the-linked-list",
  "maximum-depth-of-binary-tree", "contains-duplicate",
  // Week 3
  "insert-interval", "01-matrix", "k-closest-points-to-origin",
  "longest-substring-without-repeating-characters", "3sum",
  "binary-tree-level-order-traversal", "clone-graph",
  "evaluate-reverse-polish-notation",
  // Week 4
  "course-schedule", "implement-trie-prefix-tree", "coin-change",
  "product-of-array-except-self", "min-stack", "validate-binary-search-tree",
  "number-of-islands", "rotting-oranges",
  // Week 5
  "search-in-rotated-sorted-array", "combination-sum",
  "permutations", "merge-intervals", "lowest-common-ancestor-of-a-binary-tree",
  "time-based-key-value-store", "accounts-merge", "sort-colors"
];

// LeetCode Top Interview 150 (subset - will be fetched from API)
export const LEETCODE_TOP_150_SLUGS = [
  "two-sum", "add-two-numbers", "longest-substring-without-repeating-characters",
  "median-of-two-sorted-arrays", "longest-palindromic-substring",
  "zigzag-conversion", "reverse-integer", "string-to-integer-atoi",
  "palindrome-number", "regular-expression-matching", "container-with-most-water",
  "integer-to-roman", "roman-to-integer", "longest-common-prefix",
  "3sum", "3sum-closest", "letter-combinations-of-a-phone-number",
  "4sum", "remove-nth-node-from-end-of-list", "valid-parentheses",
  "merge-two-sorted-lists", "generate-parentheses", "merge-k-sorted-lists",
  "swap-nodes-in-pairs", "reverse-nodes-in-k-group", "remove-duplicates-from-sorted-array",
  "remove-element", "find-the-index-of-the-first-occurrence-in-a-string",
  "divide-two-integers", "substring-with-concatenation-of-all-words"
];

// Striver's A2Z Sheet (key problems)
export const STRIVER_A2Z_SLUGS = [
  "two-sum", "sort-colors", "majority-element", "maximum-subarray",
  "kadanes-algorithm", "merge-intervals", "merge-sorted-array",
  "find-the-duplicate-number", "missing-number", "search-a-2d-matrix",
  "powx-n", "majority-element-ii", "unique-paths", "reverse-pairs",
  "4sum", "longest-consecutive-sequence", "largest-subarray-with-zero-sum",
  "count-inversions", "reverse-linked-list", "middle-of-the-linked-list",
  "merge-two-sorted-lists", "remove-nth-node-from-end-of-list",
  "add-two-numbers", "delete-node-in-a-linked-list", "linked-list-cycle",
  "palindrome-linked-list", "linked-list-cycle-ii", "intersection-of-two-linked-lists",
  "reverse-nodes-in-k-group", "rotate-list", "flatten-a-multilevel-doubly-linked-list",
  "copy-list-with-random-pointer"
];
