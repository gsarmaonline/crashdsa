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
    strategy: `The core idea is to replace a nested O(n²) loop with two pointers that together traverse the array in O(n). There are two main setups:

**Opposite-direction pointers**: Start one pointer at the beginning and one at the end. Move them inward based on a condition. This works when the array is sorted (or can be sorted) and you're looking for pairs that satisfy some constraint. Classic use: finding two numbers that sum to a target — if the current sum is too small, advance the left pointer; if too large, retreat the right pointer.

**Same-direction pointers**: Both start at the beginning, but one moves faster or conditionally. Use this for in-place removal, partitioning, or deduplication. The "slow" pointer tracks where the next valid element should go, while the "fast" pointer scans ahead.

**Problem variations**: (1) Pair-sum problems on sorted arrays — two numbers summing to target, 3Sum (fix one element, two-pointer the rest), container with most water. (2) Partitioning — Dutch National Flag (3-way partition), move zeroes, remove duplicates in-place. (3) String problems — palindrome checking, reversing words, comparing strings with backspaces. (4) Trapping rain water — two pointers tracking max heights from each side.

**Key insight**: Whenever you see a sorted array and need to find pairs, or need to do in-place rearrangement, two pointers should be your first thought. The pattern also extends to problems with three or more values (e.g., 3Sum) by fixing elements and reducing to the two-pointer subproblem.`,
    keywords: ['two pointer', 'left right', 'start end', 'opposite direction'],
    tagMappings: ['Two Pointers']
  },
  {
    name: 'fast-slow-pointers',
    displayName: 'Fast & Slow Pointers',
    description: 'Use two pointers moving at different speeds for cycle detection and middle finding',
    strategy: `Also called Floyd's Tortoise and Hare. One pointer moves 1 step at a time, the other moves 2 steps. If there's a cycle, they will meet; if not, the fast pointer hits the end.

**Cycle detection**: In a linked list, if fast and slow meet, there's a cycle. To find the cycle's start: after they meet, move one pointer back to the head and advance both at speed 1 — they'll meet at the cycle entrance. This works because of the mathematical relationship between the distances traveled.

**Finding the middle**: When fast reaches the end, slow is at the middle. This is useful as a building block — e.g., finding the middle of a linked list to split it for merge sort, or to check palindrome by reversing the second half.

**Problem variations**: (1) Linked list cycle detection and finding cycle start (LeetCode 141, 142). (2) Finding the middle node of a linked list. (3) Happy number — treat the sequence of digit-square-sums as a linked list; it either cycles or reaches 1. (4) Finding the duplicate number in an array where values are in range [1, n] — treat array values as next-pointers, forming an implicit linked list with a cycle. (5) Palindrome linked list — find middle, reverse second half, compare.

**Key insight**: Any sequence that either terminates or cycles can be modeled as a linked list traversal. The fast-slow technique works on implicit sequences (like repeated function application), not just actual linked lists.`,
    keywords: ['fast slow', 'cycle detection', 'middle', 'tortoise hare', 'floyd'],
    tagMappings: ['Linked List', 'Two Pointers']
  },
  {
    name: 'sliding-window',
    displayName: 'Sliding Window',
    description: 'Dynamic window over array/string for subarray/substring optimization',
    strategy: `Maintain a window [left, right] over the array or string. Expand right to include more elements, shrink left when a constraint is violated. This converts O(n²) brute-force subarray enumeration into O(n).

**Fixed-size window**: The window size is given (e.g., "maximum sum of k consecutive elements"). Slide the window one step at a time, adding the new element and removing the old one. Straightforward.

**Variable-size window**: The window grows and shrinks based on a condition. This is the more interesting and common variant. The template is: expand right until the window violates a constraint, then shrink left until it's valid again, recording the best answer along the way.

**Problem variations**: (1) Longest substring without repeating characters — expand right, track character counts in a hash map, shrink left when a duplicate appears. (2) Minimum window substring — expand until all target characters are covered, then shrink to find the minimum. (3) Maximum sum subarray of size k — fixed window. (4) Longest substring with at most K distinct characters — variable window with a frequency map. (5) Subarray product less than K. (6) Permutation in a string / find all anagrams — fixed window with character frequency matching.

**Key insight**: Sliding window works when you can efficiently update the window state as elements are added/removed (usually O(1) using a hash map or counter). The key question to ask: "Does expanding the window only make the constraint harder to satisfy (or easier), never both?" If yes, sliding window applies. If the property isn't monotonic (e.g., subarray sum with negative numbers), you may need a different approach like prefix sums.`,
    keywords: ['sliding window', 'subarray', 'substring', 'consecutive', 'contiguous', 'window'],
    tagMappings: ['Sliding Window']
  },
  {
    name: 'binary-search',
    displayName: 'Binary Search',
    description: 'Search in sorted space with O(log n) complexity and variations',
    strategy: `The fundamental idea: if the search space is monotonic (sorted, or some condition flips from false to true at a single boundary), you can halve it each step to get O(log n).

**Standard binary search**: Find a target in a sorted array. The tricky part is getting the boundary conditions right (left <= right vs left < right, and how to update left/right). Pick one template and master it.

**Binary search on answer**: Instead of searching in an array, search over the space of possible answers. "Can I achieve X?" is a yes/no question that flips at some threshold — binary search on X. This is extremely powerful and appears in many problems that don't look like binary search at first glance.

**Problem variations**: (1) Classic search — find target, find first/last occurrence, find insertion point. (2) Rotated sorted array — binary search with an extra check for which half is sorted. (3) Search in 2D matrix — treat it as a flattened sorted array, or binary search row then column. (4) Peak element — the array isn't sorted, but the "go uphill" condition is monotonic in a local sense. (5) Koko eating bananas, ship packages within D days — binary search on the answer (speed/capacity), with a greedy feasibility check. (6) Median of two sorted arrays — binary search on partition position. (7) Find minimum in rotated sorted array.

**Key insight**: Binary search applies far beyond sorted arrays. Whenever you can frame the problem as "find the boundary where a condition changes from false to true" and you can check the condition in O(n) or less, binary search on the answer gives you O(n log n) or better. The hardest part is recognizing that binary search applies.`,
    keywords: ['binary search', 'sorted', 'search', 'logarithmic', 'divide'],
    tagMappings: ['Binary Search', 'Binary Search Tree']
  },
  {
    name: 'cyclic-sort',
    displayName: 'Cyclic Sort',
    description: 'Sort array where numbers are in range [1, n] to find missing/duplicate',
    strategy: `When you have an array of n numbers in the range [1, n] (or [0, n-1]), each number tells you exactly where it should go. Iterate through the array: if nums[i] isn't in its correct position (nums[i] != i+1), swap it to where it belongs (swap nums[i] with nums[nums[i]-1]). After one pass, every number is in its correct slot, and any mismatches reveal missing or duplicate numbers.

**The algorithm**: For each index i, while nums[i] != i+1 and nums[i] != nums[nums[i]-1], swap nums[i] into its correct position. This runs in O(n) because each number is swapped at most once into its final position.

**Problem variations**: (1) Find the missing number — after cyclic sort, the index where nums[i] != i+1 has the missing number. (2) Find all missing numbers — scan for all indices where nums[i] != i+1. (3) Find the duplicate number — during sorting, if nums[i] already equals nums[nums[i]-1] (and i != nums[i]-1), you've found a duplicate. (4) Find all duplicates. (5) Find the first missing positive — ignore numbers <= 0 or > n, then cyclic sort the rest; the first index without its correct number is the answer. (6) Find the corrupt pair (one missing, one duplicate).

**Key insight**: This pattern is specifically for arrays where values are bounded by the array size. The constraint "numbers in range [1, n]" is the signal. It gives you O(n) time and O(1) space, beating the hash set approach. If the range is different (e.g., [0, n]), adjust the target index accordingly.`,
    keywords: ['cyclic', 'missing number', 'duplicate', 'range'],
    tagMappings: ['Array', 'Sorting']
  },
  {
    name: 'linked-list-reversal',
    displayName: 'In-place Linked List Reversal',
    description: 'Reverse linked list or parts of it in-place without extra space',
    strategy: `The fundamental operation: maintain three pointers (prev, curr, next). At each step, save curr.next, point curr.next to prev, then advance prev and curr. After the loop, prev is the new head.

**Full reversal**: Reverse the entire list. This is the building block — make sure you can write it in your sleep, both iteratively and recursively.

**Partial reversal**: Reverse a sublist from position m to n. Traverse to position m-1 (the node before the reversal starts), reverse n-m+1 nodes, then fix the connections at both ends. Track the node before the reversed section and the first node of the reversed section (which becomes the last after reversal).

**Problem variations**: (1) Reverse entire linked list — iterative and recursive. (2) Reverse between positions m and n. (3) Reverse in groups of k — reverse every k nodes; if fewer than k remain, leave them (or reverse them too, depending on the variant). (4) Swap nodes in pairs — a special case of reverse in groups of 2. (5) Palindrome linked list — find middle, reverse second half, compare with first half, optionally restore. (6) Reorder list (L0→Ln→L1→Ln-1→...) — find middle, reverse second half, merge alternately. (7) Rotate list by k positions — find the new tail, break and reconnect.

**Key insight**: Most linked list transformation problems decompose into: (a) finding the right position using fast-slow or counting, (b) reversing a section, (c) reconnecting the pieces. Master the reversal subroutine and the "before/after" connection management, and these problems become mechanical.`,
    keywords: ['reverse linked list', 'reverse', 'in place', 'reorder'],
    tagMappings: ['Linked List']
  },
  {
    name: 'tree-dfs',
    displayName: 'Tree DFS',
    description: 'Depth-first traversal strategies (preorder, inorder, postorder)',
    strategy: `DFS explores a tree by going as deep as possible before backtracking. The three orderings determine when you process the current node relative to its children:

**Preorder** (node, left, right): Process the node before its children. Use when you need to make decisions or pass information downward — e.g., constructing a tree from a serialization, checking if a path sum exists.

**Inorder** (left, node, right): For BSTs, this gives sorted order. Use when you need the "sorted" property — e.g., kth smallest element, validate BST, convert BST to sorted doubly linked list.

**Postorder** (left, right, node): Process the node after its children return results. Use when you need to aggregate information from subtrees upward — e.g., computing tree height, diameter, checking if balanced, calculating subtree sums.

**Problem variations**: (1) Path sum problems — does a root-to-leaf path sum to target? Find all such paths? Maximum path sum (can start/end anywhere)? These need careful handling of the "current path" state. (2) Tree construction — build tree from preorder+inorder, or from a serialized format. (3) Lowest common ancestor — postorder; if left and right subtrees each contain one target, current node is LCA. (4) Diameter of binary tree — postorder; at each node, the diameter through it is left_height + right_height. (5) Validate BST — inorder with tracking previous value, or preorder with valid range [min, max]. (6) Flatten binary tree to linked list — preorder-style manipulation. (7) Subtree problems — is one tree a subtree of another, identical trees.

**Key insight**: The choice between preorder, inorder, and postorder is about data flow direction. Top-down information (constraints, path sums) → preorder. Bottom-up aggregation (heights, subtree properties) → postorder. Sorted-order access in BST → inorder. Many problems combine both (e.g., pass a range down in preorder, aggregate results in postorder).`,
    keywords: ['tree', 'dfs', 'depth first', 'preorder', 'inorder', 'postorder', 'recursion'],
    tagMappings: ['Tree', 'Binary Tree', 'Depth-First Search', 'DFS', 'Recursion']
  },
  {
    name: 'tree-bfs',
    displayName: 'Tree BFS',
    description: 'Level-order traversal using queue for breadth-first exploration',
    strategy: `BFS explores a tree level by level using a queue. The standard template: enqueue the root, then repeatedly dequeue a node, process it, and enqueue its children. To process by level, track the queue size at the start of each level and process exactly that many nodes.

**Level-order processing**: The key technique is the "level size" loop: at the start of each level, record queue.length as levelSize, then process exactly levelSize nodes. This gives you clean level-by-level access without sentinel nodes.

**Problem variations**: (1) Level order traversal — return values grouped by level. (2) Zigzag level order — alternate left-to-right and right-to-left per level (just reverse alternate levels). (3) Right side view — the last node processed in each level. (4) Average of levels. (5) Minimum depth — BFS finds it naturally since it explores levels in order; the first leaf you encounter is at minimum depth (more efficient than DFS for this). (6) Connect next pointers — link each node to its right neighbor at the same level; BFS gives you the level context. (7) Populating next right pointers in a perfect/complete binary tree. (8) Largest value in each tree row. (9) Cousins in a binary tree — check if two nodes are at the same depth with different parents.

**Key insight**: Use BFS over DFS when the problem is inherently about levels (level-order output, minimum depth, connecting same-level nodes). DFS can also solve level problems by tracking depth, but BFS is often more natural. BFS also naturally finds shortest paths in unweighted graphs, which extends to tree problems asking for minimum distances.`,
    keywords: ['tree', 'bfs', 'breadth first', 'level order', 'level', 'queue'],
    tagMappings: ['Tree', 'Binary Tree', 'Breadth-First Search', 'BFS', 'Queue']
  },
  {
    name: 'graph-dfs',
    displayName: 'Graph DFS',
    description: 'Explore all paths in graph using depth-first search',
    strategy: `Graph DFS is like tree DFS but with cycles and multiple components. You need a visited set to avoid infinite loops, and you may need to iterate over all nodes to cover disconnected components.

**The template**: For each unvisited node, start a DFS. Mark nodes visited when you enter them. Explore all unvisited neighbors recursively (or with a stack). The key difference from tree DFS: you must check visited before recursing, and you may need entry/exit timestamps or "visiting" vs "visited" states for cycle detection.

**Three-color marking**: White (unvisited), gray (in current DFS path), black (fully processed). A back edge to a gray node means a cycle in a directed graph.

**Problem variations**: (1) Number of islands / connected components — start DFS from each unvisited cell/node, count how many DFS calls you make. (2) Cycle detection in directed graphs — three-color marking; back edge to a gray node = cycle. In undirected graphs, any edge to a visited node (that isn't the parent) = cycle. (3) All paths from source to target — DFS with backtracking; add the current path to results when you reach the target, then un-mark the node to allow other paths. (4) Clone graph — DFS with a hash map from original to clone. (5) Pacific Atlantic water flow — DFS from ocean borders inward. (6) Surrounded regions — DFS from border O's to mark safe cells. (7) Course schedule (detect cycle in directed graph). (8) Word search — DFS on a grid with backtracking.

**Key insight**: Graph DFS is the right choice when you need to explore all paths, detect cycles, or work with connected components. For shortest-path problems, prefer BFS. For DFS on grids, treat each cell as a node with 4 neighbors. The "backtracking" variant (un-visiting nodes) is needed when you want all paths, not just reachability.`,
    keywords: ['graph', 'dfs', 'depth first', 'explore', 'path', 'island', 'connected'],
    tagMappings: ['Graph', 'Depth-First Search', 'DFS']
  },
  {
    name: 'graph-bfs',
    displayName: 'Graph BFS',
    description: 'Find shortest path or explore level-wise using breadth-first search',
    strategy: `BFS explores a graph layer by layer from a source. It naturally finds the shortest path in unweighted graphs because it visits all nodes at distance d before any node at distance d+1.

**Standard BFS**: Queue-based. Enqueue the source, mark visited. Dequeue a node, process it, enqueue all unvisited neighbors. Track distance by processing level-by-level (same technique as tree BFS).

**Multi-source BFS**: Start with multiple sources in the queue simultaneously. This computes the minimum distance from any source — useful for "distance from nearest X" problems. Enqueue all sources at the start instead of a single node.

**Problem variations**: (1) Shortest path in unweighted graph — standard BFS. (2) Rotting oranges — multi-source BFS from all rotten oranges; each level = 1 minute. (3) Word ladder — each word is a node, edges connect words differing by one letter; BFS finds shortest transformation. (4) 01-BFS — edges have weight 0 or 1; use a deque, adding weight-0 edges to the front and weight-1 edges to the back. (5) Shortest path in binary matrix — BFS on grid with 8-directional movement. (6) Walls and gates — multi-source BFS from all gates. (7) Minimum knight moves — BFS on the infinite chessboard. (8) Open the lock — BFS on the state space of lock combinations. (9) Snakes and ladders — BFS on board positions.

**Key insight**: BFS is the go-to for shortest path in unweighted graphs. Multi-source BFS is a powerful extension — whenever you need "minimum distance to the nearest X," start BFS from all X's simultaneously. For weighted graphs, you need Dijkstra (which is BFS with a priority queue). The state doesn't have to be a physical position — it can be any configuration (lock combination, word, board state) as long as you can enumerate transitions.`,
    keywords: ['graph', 'bfs', 'breadth first', 'shortest path', 'level'],
    tagMappings: ['Graph', 'Breadth-First Search', 'BFS']
  },
  {
    name: 'union-find',
    displayName: 'Union Find',
    description: 'Disjoint set data structure for connectivity and grouping problems',
    strategy: `Union-Find (Disjoint Set Union) maintains a collection of non-overlapping sets and supports two operations: find(x) returns the representative of x's set, and union(x, y) merges the sets containing x and y. With path compression and union by rank, both operations run in nearly O(1) amortized.

**Implementation**: Each element has a parent pointer. The root of each tree is the set representative. find(x) follows parent pointers to the root and compresses the path. union(x, y) finds both roots and makes one point to the other (by rank or size).

**When to use Union-Find vs BFS/DFS**: Union-Find excels when edges arrive incrementally (online connectivity), when you need to efficiently merge groups, or when the problem is fundamentally about "are these connected?" without needing the actual path. DFS/BFS is better when you need to traverse or find paths.

**Problem variations**: (1) Number of connected components — initialize n sets, union each edge, count remaining distinct roots. (2) Redundant connection — process edges in order; the first edge where both endpoints are already connected is redundant (a cycle edge). (3) Accounts merge — union accounts that share an email, then group by representative. (4) Number of provinces / friend circles — union friends, count groups. (5) Longest consecutive sequence — union consecutive numbers, find the largest set. (6) Graph valid tree — n nodes, n-1 edges, all connected = tree. Use union-find to check for cycles (union fails if already same set) and count components. (7) Earliest moment when everyone becomes friends — process time-stamped edges, union until one component.

**Key insight**: Think Union-Find when the problem says "group," "connect," "merge," or "same component." It's the most efficient approach for dynamic connectivity. The component count equals n minus the number of successful unions. Adding a size/rank array lets you track component sizes efficiently.`,
    keywords: ['union find', 'disjoint set', 'connected component', 'connectivity'],
    tagMappings: ['Union Find', 'Disjoint Set']
  },
  {
    name: 'topological-sort',
    displayName: 'Topological Sort',
    description: 'Order tasks with dependencies using DFS or Kahn\'s algorithm',
    strategy: `Topological sort produces a linear ordering of vertices in a directed acyclic graph (DAG) such that for every edge u→v, u comes before v. It only works on DAGs — if there's a cycle, no valid ordering exists.

**Kahn's algorithm (BFS-based)**: Compute in-degrees. Enqueue all nodes with in-degree 0. Dequeue a node, add to result, decrement in-degrees of its neighbors. Enqueue any neighbor whose in-degree drops to 0. If the result has fewer nodes than the graph, there's a cycle.

**DFS-based**: Run DFS; when a node is fully processed (all descendants visited), push it to a stack. The stack in reverse gives topological order. Detect cycles using the three-color method (back edge to a gray node = cycle).

**Problem variations**: (1) Course schedule — can you finish all courses given prerequisites? (Cycle detection.) (2) Course schedule II — return one valid ordering. (3) Alien dictionary — given sorted alien words, infer character ordering; build a graph of character precedences, then topological sort. (4) Parallel job scheduling — topological sort gives valid execution order; the longest path gives the minimum total time with unlimited parallelism. (5) Compile order / build order — dependencies between modules. (6) Sequence reconstruction — check if a topological order is uniquely determined (at every step, only one node has in-degree 0). (7) Minimum height trees — not exactly topological sort, but uses the peeling technique (repeatedly remove leaves) which is Kahn's in reverse.

**Key insight**: Kahn's algorithm is generally preferred because it's iterative, naturally detects cycles (if count < n), and can be extended to check uniqueness (queue size always 1 means unique order). The pattern appears whenever there are dependencies or precedence constraints. "Can this be done?" = cycle detection. "In what order?" = topological sort.`,
    keywords: ['topological', 'dependency', 'order', 'course', 'prerequisite'],
    tagMappings: ['Topological Sort', 'Graph']
  },
  {
    name: 'backtracking',
    displayName: 'Backtracking',
    description: 'Generate all combinations, permutations, or subsets by exploring and backtracking',
    strategy: `Backtracking builds solutions incrementally, abandoning a partial solution ("backtracking") as soon as it determines that it can't lead to a valid complete solution. It's essentially DFS on the decision tree.

**The template**: Write a recursive function that (1) checks if the current state is a valid solution (base case), (2) iterates over choices available at the current step, (3) makes a choice (modify state), (4) recurses, (5) undoes the choice (restore state). Step 5 is the "backtracking" — you undo the mutation so the next iteration sees a clean state.

**Pruning**: The power of backtracking over brute force is pruning. Skip branches early when you can tell they won't lead to valid solutions. For example, if the remaining numbers can't possibly reach the target sum, stop. Good pruning can reduce exponential time dramatically.

**Problem variations**: (1) Subsets — at each element, choose to include or exclude it. With duplicates: sort first, skip duplicate elements at the same recursion level. (2) Permutations — at each position, choose from remaining unused elements. With duplicates: sort and skip same-value elements at the same level. (3) Combinations — choose k elements from n. Similar to subsets but stop when you have k elements. (4) Combination sum — elements can be reused (start from current index) or not (start from next index). (5) N-Queens — place queens row by row, checking column and diagonal conflicts. (6) Sudoku solver — fill cells one by one, try digits 1-9, prune invalid placements. (7) Palindrome partitioning — partition a string such that every part is a palindrome. (8) Generate parentheses — track open and close counts, prune invalid states. (9) Word search — DFS on grid with backtracking.

**Key insight**: Backtracking = "generate all valid X." The decision tree structure determines complexity. For subsets it's O(2^n), for permutations O(n!). Handling duplicates always follows the same pattern: sort the input, and at each recursion level, skip elements that are the same as the previous one at that level. The difference between subsets, combinations, and permutations is just the branching rule and the base case.`,
    keywords: ['backtrack', 'permutation', 'combination', 'subset', 'generate', 'all'],
    tagMappings: ['Backtracking', 'Recursion']
  },
  {
    name: 'dynamic-programming-1d',
    displayName: 'Dynamic Programming - 1D',
    description: 'Optimize using single array DP (Fibonacci, climbing stairs, house robber)',
    strategy: `DP solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation. 1D DP means the state is captured by a single index or parameter.

**The approach**: (1) Define the state — what does dp[i] represent? (2) Find the recurrence — how does dp[i] relate to previous states? (3) Identify base cases. (4) Determine traversal order (usually left to right). (5) Optimize space if dp[i] only depends on the last few values.

**Top-down vs bottom-up**: Top-down (memoization) is often easier to write — just add a cache to the recursive solution. Bottom-up (tabulation) builds the table iteratively and is usually faster in practice (no recursion overhead). Start with top-down to get the recurrence right, then convert to bottom-up if needed.

**Problem variations**: (1) Fibonacci-style — climbing stairs (dp[i] = dp[i-1] + dp[i-2]), decode ways. (2) Decision at each step — house robber (rob or skip: dp[i] = max(dp[i-1], dp[i-2] + nums[i])), buy/sell stock with cooldown. (3) Optimization over prefixes — longest increasing subsequence (dp[i] = longest ending at i; for each j < i, if nums[j] < nums[i], dp[i] = max(dp[i], dp[j]+1)). (4) Coin change — dp[amount] = min coins to make amount. (5) Word break — dp[i] = can s[0..i] be segmented? (6) Jump game — can you reach the end? dp or greedy. (7) Maximum subarray (Kadane's algorithm) — dp[i] = max subarray ending at i. (8) Partition equal subset sum — dp[sum] = is this sum achievable?

**Key insight**: The hardest part is defining the state. Ask yourself: "What information do I need to make the optimal decision at step i?" If one index suffices, it's 1D DP. Space optimization is almost always possible — if dp[i] depends only on dp[i-1] and dp[i-2], you only need two variables. Many "1D DP" problems can also be solved greedily (like jump game), so consider whether the greedy property holds.`,
    keywords: ['dp', 'dynamic programming', 'memoization', 'tabulation', '1d', 'fibonacci', 'climb'],
    tagMappings: ['Dynamic Programming', 'DP', 'Memoization']
  },
  {
    name: 'dynamic-programming-2d',
    displayName: 'Dynamic Programming - 2D',
    description: 'Optimize using 2D DP (LCS, edit distance, matrix problems)',
    strategy: `2D DP uses two parameters to define the state, typically dp[i][j]. This arises when you're comparing two sequences, traversing a grid, or when a single index isn't enough to capture the subproblem.

**Two-sequence problems**: When comparing or aligning two strings/arrays, dp[i][j] represents the answer for the first i elements of sequence A and the first j elements of sequence B. The recurrence looks at dp[i-1][j], dp[i][j-1], and dp[i-1][j-1].

**Grid problems**: dp[i][j] represents the answer for reaching cell (i, j). The recurrence combines results from cells you can reach (i, j) from — typically (i-1, j) and (i, j-1).

**Problem variations**: (1) Longest Common Subsequence — dp[i][j] = LCS of first i chars and first j chars. If chars match, dp[i-1][j-1]+1; else max(dp[i-1][j], dp[i][j-1]). (2) Edit distance — dp[i][j] = min operations to convert first i chars to first j chars. Insert/delete/replace map to the three neighbors. (3) Unique paths in grid — dp[i][j] = dp[i-1][j] + dp[i][j-1]. With obstacles, set blocked cells to 0. (4) Minimum path sum — dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). (5) 0/1 Knapsack — dp[i][w] = max value using first i items with capacity w. (6) Longest palindromic subsequence — dp[i][j] for substring s[i..j]. (7) Regular expression matching / wildcard matching — dp[i][j] = does pattern[0..j] match string[0..i]? (8) Interleaving string — dp[i][j] = can s3[0..i+j] be formed by interleaving s1[0..i] and s2[0..j]?

**Key insight**: Space optimization is often possible. If dp[i][j] only depends on row i and row i-1, you can use two 1D arrays (or even one with careful ordering). For knapsack, iterating capacity backwards lets you use a single array. The visual table-filling approach helps: draw the table, fill in base cases, and see which cells each cell depends on.`,
    keywords: ['dp', 'dynamic programming', '2d', 'matrix', 'grid', 'lcs', 'subsequence'],
    tagMappings: ['Dynamic Programming', 'DP', 'Matrix']
  },
  {
    name: 'greedy',
    displayName: 'Greedy',
    description: 'Make locally optimal choice at each step to find global optimum',
    strategy: `A greedy algorithm makes the best-looking choice at each step without reconsidering previous decisions. It works when the problem has the greedy-choice property (a locally optimal choice leads to a globally optimal solution) and optimal substructure.

**How to identify greedy problems**: (1) The problem asks for a maximum, minimum, or "is it possible." (2) Making the locally best choice doesn't eliminate future better options. (3) You can sort the input in a way that makes the greedy choice obvious. (4) A DP solution exists but feels like overkill because you never need to backtrack.

**Common greedy strategies**: Sort by some criterion, then process elements in order. The criterion depends on the problem — sort by end time (intervals), by ratio (fractional knapsack), by deadline (job scheduling), by frequency (Huffman coding).

**Problem variations**: (1) Activity/interval scheduling — sort by end time, greedily pick non-overlapping intervals. (2) Jump game — track the farthest reachable index; if current position exceeds it, return false. (3) Gas station — track surplus; if total gas >= total cost, a solution exists; find the start by resetting when surplus goes negative. (4) Task scheduler — arrange tasks to minimize idle time; the most frequent task dictates the structure. (5) Partition labels — track last occurrence of each character, extend the current partition. (6) Assign cookies — sort both arrays, match greedily. (7) Non-overlapping intervals / minimum number of arrows — sort by end, count overlaps. (8) Reorganize string — always place the most frequent character, using a max-heap. (9) Minimum platforms / meeting rooms — sort events, track concurrent count.

**Key insight**: The hard part with greedy is proving correctness. The exchange argument works: assume an optimal solution makes a different choice than greedy at some step, then show you can swap to the greedy choice without worsening the solution. If you can't prove greedy works, it probably doesn't — use DP instead. Many problems that look greedy actually require DP (e.g., coin change with arbitrary denominations).`,
    keywords: ['greedy', 'optimal', 'local', 'choice'],
    tagMappings: ['Greedy', 'Greedy Algorithm']
  },
  {
    name: 'merge-intervals',
    displayName: 'Merge Intervals',
    description: 'Merge, insert, or find overlapping intervals',
    strategy: `The core technique: sort intervals by start time, then iterate and merge overlapping ones. Two intervals [a, b] and [c, d] overlap if a <= d and c <= b (assuming a <= c after sorting). When merging, the merged interval is [min(a, c), max(b, d)].

**The merge template**: Sort by start. Initialize result with the first interval. For each subsequent interval, if it overlaps with the last interval in result (current.start <= result.last.end), merge them (extend result.last.end). Otherwise, add it as a new interval.

**Problem variations**: (1) Merge overlapping intervals — the basic template above. (2) Insert interval — insert a new interval into a sorted non-overlapping list. Process intervals that come entirely before, merge overlapping ones, then add the rest. (3) Interval list intersections — two sorted lists of intervals; use two pointers, compute intersection of current pair, advance the one that ends first. (4) Meeting rooms — can a person attend all meetings? Sort by start, check for any overlap. (5) Meeting rooms II — minimum rooms needed; sort start and end times separately, use two pointers to count concurrent meetings (or use a min-heap of end times). (6) Employee free time — merge all busy intervals across employees, gaps are free time. (7) Non-overlapping intervals — minimum removals to make all intervals non-overlapping (greedy: sort by end, count overlaps).

**Key insight**: Always sort by start time first (or end time for the greedy variant). The sweep line technique generalizes this: convert intervals to events (start/end), sort by time, and process events to track how many intervals are active at any point. This handles problems like "maximum concurrent meetings," "skyline problem," and "rectangle overlap." For problems with two interval lists, two pointers work because both lists are sorted.`,
    keywords: ['interval', 'merge', 'overlap', 'meeting', 'range'],
    tagMappings: ['Interval', 'Merge Intervals', 'Line Sweep']
  },
  {
    name: 'top-k-elements',
    displayName: 'Top K Elements',
    description: 'Find K largest/smallest elements using heap or quickselect',
    strategy: `When you need the K largest, smallest, most frequent, or closest elements, a heap (priority queue) gives you O(n log k) time, and quickselect gives O(n) average time.

**Min-heap for K largest**: Maintain a min-heap of size k. For each element, if the heap has fewer than k elements, push it. Otherwise, if the element is larger than the heap's minimum, pop the minimum and push the new element. After processing all elements, the heap contains the k largest. The min is at the top = the kth largest.

**Max-heap for K smallest**: Mirror of the above. Or negate values and use a min-heap.

**Quickselect**: Partition the array around a pivot (like quicksort). If the pivot lands at position k, you're done. If it's to the right of k, recurse left; if left, recurse right. Average O(n), worst case O(n²), but randomizing the pivot makes worst case extremely unlikely.

**Problem variations**: (1) Kth largest element — quickselect for O(n) average, or min-heap of size k. (2) Top K frequent elements — count frequencies with a hash map, then use a min-heap of size k on (frequency, element) pairs. Alternatively, bucket sort: create buckets by frequency (index = frequency, value = list of elements), then collect from highest bucket. (3) K closest points to origin — min-heap on distance, or quickselect. (4) Sort characters by frequency — count, then sort or heap. (5) Find K closest elements to a target in sorted array — binary search for closest, then expand outward with two pointers. (6) Reorganize string (place most frequent first) — max-heap on frequency. (7) K pairs with smallest sums — min-heap with lazy expansion. (8) Merge K sorted lists — min-heap of size k holding one element from each list.

**Key insight**: Heap is the right default when k << n because O(n log k) beats O(n log n) sorting. Quickselect is better when you just need the kth element (not all top k sorted). Bucket sort achieves O(n) when frequencies are bounded by n. The "merge k sorted X" variant uses a heap as a multi-way merge — always useful when combining sorted streams.`,
    keywords: ['heap', 'priority queue', 'top k', 'kth', 'largest', 'smallest', 'k closest'],
    tagMappings: ['Heap', 'Priority Queue', 'Heap (Priority Queue)', 'Quickselect']
  },
  {
    name: 'monotonic-stack',
    displayName: 'Monotonic Stack',
    description: 'Use stack to find next greater/smaller element efficiently',
    strategy: `A monotonic stack maintains elements in increasing or decreasing order. When a new element violates the monotonicity, you pop elements — and each pop reveals a "next greater" or "next smaller" relationship. This solves in O(n) what would otherwise take O(n²).

**Monotonic decreasing stack** (for "next greater element"): Iterate through elements. While the stack is non-empty and the current element is greater than the stack's top, pop the top — the current element is the "next greater" for the popped element. Then push the current element.

**Monotonic increasing stack** (for "next smaller element"): Same logic but reversed — pop when the current element is smaller than the top.

**Problem variations**: (1) Next greater element — for each element, find the first larger element to its right. (2) Daily temperatures — for each day, how many days until a warmer temperature? Same as next greater, but track indices and compute the distance. (3) Largest rectangle in histogram — for each bar, find how far it extends left and right (next smaller on both sides). The area is height × width. This is the classic monotonic stack problem. (4) Maximal rectangle in binary matrix — build histogram per row, then apply histogram algorithm to each. (5) Trapping rain water — can be solved with monotonic stack (decreasing), processing "bowls" when a taller bar appears. (6) Stock span — for each day, how many consecutive days before it had a lower or equal price? Use a decreasing stack of prices. (7) Remove K digits to make smallest number — maintain increasing stack, pop larger digits when a smaller one arrives. (8) 132 pattern — find i < j < k where nums[i] < nums[k] < nums[j]; iterate from right with a decreasing stack.

**Key insight**: Monotonic stacks solve "nearest greater/smaller" problems in O(n). The mental model: each element enters the stack once and leaves once. When it leaves (gets popped by a new element), you've found its answer. The technique works in both directions — iterate left-to-right for "next" relationships, or right-to-left for "previous" relationships. For 2D extensions (like maximal rectangle), reduce to 1D histogram and apply the stack per row.`,
    keywords: ['stack', 'monotonic', 'next greater', 'next smaller', 'temperature', 'histogram'],
    tagMappings: ['Stack', 'Monotonic Stack']
  },
  {
    name: 'bit-manipulation',
    displayName: 'Bit Manipulation',
    description: 'Use bitwise operations (XOR, AND, OR, shifts) to solve problems efficiently',
    strategy: `Bit manipulation uses the binary representation of numbers to solve problems in O(1) space and often O(n) time. The key operations: AND (&), OR (|), XOR (^), NOT (~), left shift (<<), right shift (>>).

**Essential properties**: (1) XOR: a ^ a = 0, a ^ 0 = a. XOR of all elements cancels out pairs. (2) AND with (n-1): n & (n-1) removes the lowest set bit. (3) AND with (-n): n & (-n) isolates the lowest set bit. (4) Left shift: a << k multiplies by 2^k. (5) Right shift: a >> k divides by 2^k. (6) Check kth bit: (n >> k) & 1. (7) Set kth bit: n | (1 << k). (8) Clear kth bit: n & ~(1 << k).

**Problem variations**: (1) Single number — XOR all elements; pairs cancel, leaving the single one. (2) Single number II (every element appears 3 times except one) — count bits modulo 3 at each position. (3) Single number III (two elements appear once) — XOR all gives a ^ b; use any differing bit to partition elements into two groups, XOR each group separately. (4) Number of 1 bits (Hamming weight) — count set bits using n & (n-1) to clear lowest bit each iteration. (5) Counting bits — dp[i] = dp[i >> 1] + (i & 1) for all numbers 0 to n. (6) Reverse bits — swap bit by bit or in blocks. (7) Power of two — n > 0 && (n & (n-1)) == 0. (8) Subsets generation — iterate from 0 to 2^n-1, each number's bits represent which elements to include. (9) Missing number — XOR indices with values, or use sum formula. (10) Bitwise AND of range — repeatedly remove the lowest set bit from the larger number until both numbers are equal (find common prefix).

**Key insight**: XOR is the workhorse — it finds unique elements, computes parity, and toggles bits. The trick n & (n-1) drops the rightmost set bit and solves a surprising number of problems. Bit manipulation often provides elegant O(1) space solutions to problems that would otherwise need hash maps. When you see constraints like "every element appears twice except one" or "solve in O(1) extra space," think bits.`,
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
