# CrashDSA

A fast, focused DSA prep platform for senior engineers. Stop grinding 500+ problems — CrashDSA aggregates the top 5 curated problem lists, deduplicates them, and organizes everything by **solution pattern** so you study smarter.

## The Problem

DSA interview prep is fragmented. NeetCode 150, Blind 75, Grind 75, LeetCode Top 150, Striver's A2Z — they all overlap heavily, are organized by data structure (not thinking pattern), and leave you grinding duplicates across lists without a clear strategy.

## The Solution

CrashDSA consolidates all 5 major lists into ~326 unique problems, then categorizes them by the 20 core **solution patterns** — the actual algorithmic strategies you apply during an interview, not the data structures involved.

Instead of "here are 40 array problems", you get "here are the 12 problems that require the Sliding Window technique" — so you build transferable intuition, not rote memorization.

## Solution Patterns

Problems are organized by strategic approach:

| Pattern | Description |
|---|---|
| Two Pointers | Converging or diverging pointer techniques |
| Fast & Slow Pointers | Cycle detection, midpoint finding |
| Sliding Window | Variable/fixed window over sequences |
| Binary Search | Search over sorted data or answer space |
| Cyclic Sort | Placing elements at their correct index |
| Linked List Reversal | In-place reversal techniques |
| Tree DFS | Depth-first traversal and recursion |
| Tree BFS | Level-order traversal |
| Graph DFS | Connected components, path finding |
| Graph BFS | Shortest path, multi-source BFS |
| Union Find | Disjoint set union for connectivity |
| Topological Sort | DAG ordering, dependency resolution |
| Backtracking | Exhaustive search with pruning |
| Dynamic Programming (1D) | Linear state DP |
| Dynamic Programming (2D) | Grid and sequence DP |
| Greedy | Locally optimal choices |
| Merge Intervals | Overlapping interval problems |
| Top K Elements | Heap-based selection |
| Monotonic Stack | Next greater/smaller element |
| Bit Manipulation | Bitwise tricks and operations |

## Sources

Problems aggregated from:
- **NeetCode 150**
- **Blind 75**
- **LeetCode Top 150**
- **Grind 75**
- **Striver's A2Z DSA Sheet**

~456 total problems → ~326 unique after deduplication.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Hono](https://hono.dev/)
- **Frontend:** Server-side rendered HTML
- **Language:** TypeScript

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

## Data Pipeline

The DSA sheet aggregation pipeline fetches, normalizes, deduplicates, and exports problems to CSV:

```bash
# Run full pipeline (cached for 24h)
bun run dsa-sheets:update

# Force refresh, ignoring cache
bun run dsa-sheets:update -- --force
```

**Output:**
- `dsa-sheets/csv/master.csv` — All unique problems
- `dsa-sheets/csv/by-pattern/*.csv` — Problems grouped by solution pattern

## Deployment

Deployed on [Fly.io](https://fly.io). Docker-based.

```bash
# Build Docker image
docker build -t crashdsa .

# Run locally
docker run -p 3000:3000 crashdsa
```

## API

- `GET /` — Homepage
- `GET /api/hello` — Health check
- `GET /api-docs` — Swagger UI
- `GET /openapi.json` — OpenAPI spec
