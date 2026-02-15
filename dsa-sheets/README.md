# DSA Sheet Aggregation System

An automated pipeline for aggregating, categorizing, and deduplicating Data Structures & Algorithms problems from popular practice sheets.

**Target Audience**: Senior engineers preparing for advanced technical interviews

## Overview

This system consolidates problems from 5 major DSA practice sources, removes duplicates, categorizes them by **pure solution patterns** (algorithmic strategies, not data structures), and exports to CSV for easy consumption.

### Problem Sources

1. **NeetCode 150** - Curated 150 problems covering all patterns
2. **Blind 75** - Classic 75 interview problems
3. **LeetCode Top Interview 150** - Most popular interview questions
4. **Grind 75** - Customizable study plan
5. **Striver's A2Z** - Comprehensive DSA coverage

### Solution Patterns (20 Total)

Problems are categorized by **algorithmic strategies**, not data structures:

- **Two Pointers** - Move pointers from opposite ends or same direction
- **Fast & Slow Pointers** - Cycle detection, middle finding (Floyd's algorithm)
- **Sliding Window** - Dynamic window over array/string for optimization
- **Binary Search** - Search in sorted space with O(log n) and variations
- **Cyclic Sort** - Sort numbers in range [1, n] to find missing/duplicate
- **Linked List Reversal** - In-place reversal without extra space
- **Tree DFS** - Depth-first traversal (preorder, inorder, postorder)
- **Tree BFS** - Level-order traversal using queue
- **Graph DFS** - Explore all paths depth-first
- **Graph BFS** - Shortest path, level-wise exploration
- **Union Find** - Disjoint sets for connectivity problems
- **Topological Sort** - Order tasks with dependencies
- **Backtracking** - Generate combinations, permutations, subsets
- **Dynamic Programming - 1D** - Single array DP (Fibonacci, climbing stairs)
- **Dynamic Programming - 2D** - Matrix DP (LCS, edit distance)
- **Greedy** - Local optimum → global optimum
- **Merge Intervals** - Interval merging, overlap detection, scheduling
- **Top K Elements** - Heap-based K largest/smallest selection
- **Monotonic Stack** - Next greater/smaller element efficiently
- **Bit Manipulation** - XOR, masks, shifts for efficient operations

## Quick Start

### Update All Sheets

```bash
bun run dsa-sheets:update
```

Or using Claude skill:

```bash
/update-dsa-sheets
```

### Force Update (Ignore Cache)

```bash
bun run dsa-sheets:update -- --force
```

## Pipeline Stages

The system runs through 5 stages:

### 1. Fetch (fetch-sheets.ts)

Downloads raw data from all sources.

```bash
bun run dsa-sheets:fetch
bun run dsa-sheets:fetch -- --force  # Ignore cache
```

**Output**: `dsa-sheets/raw/*.json`

### 2. Process (process-sheets.ts)

Normalizes data to common schema.

```bash
bun run dsa-sheets:process
```

**Output**: `dsa-sheets/processed/problems.json`

### 3. Categorize (categorize-problems.ts)

Assigns solution patterns to each problem.

```bash
bun run dsa-sheets:categorize
```

**Output**: `dsa-sheets/processed/problems-categorized.json`

**Categorization Strategy**:
1. Manual overrides (highest priority)
2. LeetCode tag mapping
3. Keyword matching in titles
4. Default fallback

### 4. Deduplicate (deduplicate.ts)

Finds and merges duplicate problems across sources.

```bash
bun run dsa-sheets:deduplicate
```

**Output**:
- `dsa-sheets/processed/problems-deduplicated.json`
- `dsa-sheets/processed/duplicates.json`

**Deduplication Levels**:
1. Exact slug match (e.g., "two-sum")
2. Normalized title match
3. Link comparison

### 5. Export CSV (export-csv.ts)

Generates CSV files for consumption.

```bash
bun run dsa-sheets:export
```

**Output**:
- `dsa-sheets/csv/master.csv` - All problems
- `dsa-sheets/csv/by-pattern/*.csv` - Per-pattern CSVs

## Directory Structure

```
dsa-sheets/
├── raw/                           # Fetched JSON data
│   ├── neetcode150.json
│   ├── blind75.json
│   ├── leetcode-top-150.json
│   ├── grind75.json
│   └── striver-a2z.json
├── processed/                     # Normalized problems
│   ├── problems.json              # After processing
│   ├── problems-categorized.json  # After categorization
│   ├── problems-deduplicated.json # After deduplication
│   └── duplicates.json            # Duplicate report
├── csv/                           # CSV exports
│   ├── master.csv                 # All problems
│   └── by-pattern/                # Per-pattern CSVs
│       ├── array-hashing.csv
│       ├── two-pointers.csv
│       └── ...
├── metadata/                      # System metadata
│   └── fetch-history.json         # Fetch timestamps
└── README.md                      # This file
```

## CSV Format

### Master CSV

```csv
Problem Name,Difficulty,Patterns,Source Sheets,Link,Acceptance Rate,Tags
Two Sum,Easy,array-hashing,blind75;neetcode150,https://leetcode.com/problems/two-sum/,49.2%,Array;Hash Table
```

### Pattern-Specific CSVs

```csv
Problem Name,Difficulty,Source Sheets,Link,Acceptance Rate
Two Sum,Easy,blind75;neetcode150,https://leetcode.com/problems/two-sum/,49.2%
```

Problems are sorted by difficulty (Easy → Medium → Hard).

## Caching & Idempotency

### Cache Behavior

- **Default TTL**: 24 hours
- **Location**: `dsa-sheets/metadata/fetch-history.json`
- **Per-source tracking**: Each source has independent cache

### Force Update

Use `--force` to bypass cache:

```bash
bun run dsa-sheets:update -- --force
```

## Data Schema

### Problem Interface

```typescript
interface Problem {
  id: string;                    // "p-leetcode-1"
  title: string;                 // "Two Sum"
  slug: string;                  // "two-sum"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;                  // Direct LeetCode URL
  sourceSheets: SheetName[];     // ["blind75", "neetcode150"]
  tags: string[];                // Original LeetCode tags
  patterns: PatternName[];       // Assigned solution patterns
  acceptance?: number;           // Acceptance rate (0-100)
  frequency?: number;            // Problem frequency
}
```

## Error Handling

- **Network failures**: 3 retries with exponential backoff
- **Rate limits**: Automatic waiting
- **One source fails**: Continues with others
- **Parsing errors**: Skips problematic entries, logs warnings

## Troubleshooting

### Issue: "Processed problems file not found"

**Solution**: Run stages in order:
```bash
bun run dsa-sheets:fetch
bun run dsa-sheets:process
# ... etc
```

Or use the master orchestrator:
```bash
bun run dsa-sheets:update
```

### Issue: "No problems fetched"

**Solution**: Force refresh:
```bash
bun run dsa-sheets:fetch -- --force
```

### Issue: "Problems not categorized"

**Solution**: Check manual patterns file:
```bash
cat src/dsa-sheets/mappings/manual-patterns.json
```

## Extending the System

### Add a New Source

1. Add to `src/dsa-sheets/fetchers.ts`:
   ```typescript
   {
     name: 'new-source',
     displayName: 'New Source',
     url: 'https://example.com',
     fetchMethod: 'github',
     rawFilePath: 'dsa-sheets/raw/new-source.json'
   }
   ```

2. Add fetch logic in `scripts/dsa-sheets/fetch-sheets.ts`

3. Add normalization in `scripts/dsa-sheets/process-sheets.ts`

### Add a New Pattern

1. Add to `src/dsa-sheets/patterns.ts`:
   ```typescript
   {
     name: 'new-pattern',
     displayName: 'New Pattern',
     description: 'Pattern description',
     keywords: ['keyword1', 'keyword2'],
     tagMappings: ['LeetCode Tag']
   }
   ```

2. Update TypeScript types in `src/dsa-sheets/types.ts`

### Override Problem Categorization

Edit `src/dsa-sheets/mappings/manual-patterns.json`:

```json
{
  "problem-slug": {
    "patterns": ["array-hashing", "two-pointers"],
    "reason": "Why this override exists"
  }
}
```

## Performance

- **Fetch**: 10-30 seconds (with cache: instant)
- **Process**: 1-2 seconds
- **Categorize**: 1-2 seconds
- **Deduplicate**: 1-2 seconds
- **Export CSV**: 1-2 seconds

**Total**: ~1-2 minutes (full pipeline, cold cache)

## Statistics (Expected)

After successful run:

- **Total raw problems**: ~500-700
- **Unique problems**: 250-400 (after deduplication)
- **Duplicate groups**: 50-150
- **Problems per pattern**: 20-100

## Future Enhancements

- [ ] Web UI for browsing problems
- [ ] REST API endpoints
- [ ] Search functionality
- [ ] Progress tracking dashboard
- [ ] Auto-update via cron job
- [ ] LeetCode API integration for tags
- [ ] Community pattern voting

## Contributing

To improve categorization:

1. Add well-known problems to `manual-patterns.json`
2. Refine pattern keywords in `patterns.ts`
3. Update tag mappings for better automatic categorization

## Resources

- [NeetCode](https://neetcode.io/)
- [LeetCode](https://leetcode.com/)
- [Blind 75](https://www.teamblind.com/post/New-Year-Gift---Curated-List-of-Top-75-LeetCode-Questions-to-Save-Your-Time-OaM1orEU)
- [Grind 75](https://www.techinterviewhandbook.org/grind75)
- [Striver's A2Z](https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2)

---

**Built with**: Bun, TypeScript, csv-writer
