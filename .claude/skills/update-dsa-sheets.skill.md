---
name: update-dsa-sheets
description: Update DSA problem sheets from all sources
runFirst: true
userInvocable: true
---

# Update DSA Sheets

This skill aggregates DSA (Data Structures & Algorithms) problems from 5 popular sources, categorizes them by solution patterns, removes duplicates, and exports to CSV.

## What This Does

1. **Fetches** problems from:
   - NeetCode 150
   - Blind 75
   - LeetCode Top Interview 150
   - Grind 75
   - Striver's A2Z DSA Sheet

2. **Processes** and normalizes data to common schema

3. **Categorizes** problems by 20 pure solution patterns (algorithmic strategies for senior engineers):
   - Two Pointers
   - Fast & Slow Pointers
   - Sliding Window
   - Binary Search
   - Cyclic Sort
   - Linked List Reversal
   - Tree DFS
   - Tree BFS
   - Graph DFS
   - Graph BFS
   - Union Find
   - Topological Sort
   - Backtracking
   - Dynamic Programming (1D & 2D)
   - Greedy
   - Merge Intervals
   - Top K Elements
   - Monotonic Stack
   - Bit Manipulation

4. **Deduplicates** problems found across multiple sources

5. **Exports** to CSV:
   - `dsa-sheets/csv/master.csv` - All problems
   - `dsa-sheets/csv/by-pattern/*.csv` - Problems grouped by pattern

## Usage

```bash
/update-dsa-sheets
```

### Force Update (Ignore Cache)

```bash
/update-dsa-sheets --force
```

## Output Files

After running, you'll have:

- **Master CSV**: `dsa-sheets/csv/master.csv`
  - All unique problems with patterns, difficulty, source sheets, and links

- **Pattern CSVs**: `dsa-sheets/csv/by-pattern/`
  - Separate CSV for each pattern
  - Problems sorted by difficulty (Easy → Medium → Hard)

## Cache Behavior

- **Default**: Cached for 24 hours
- **Force mode**: Ignores cache and re-fetches all data

## Example Output Structure

```csv
Problem Name,Difficulty,Patterns,Source Sheets,Link,Acceptance Rate
Two Sum,Easy,array-hashing,blind75;neetcode150,https://leetcode.com/problems/two-sum/,49.2%
```

## Notes

- Takes 1-2 minutes to complete full pipeline
- Safe to run multiple times (idempotent)
- Continues if one source fails
- Progress tracking with emoji indicators

---

Run the following command to update DSA sheets:

```bash
bun run dsa-sheets:update
```
