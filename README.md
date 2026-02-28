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

### Local Development with Docker Compose

Spins up the app and a PostgreSQL database together:

```bash
# Start all services
docker-compose up

# Build and start (after code changes)
docker-compose up --build

# Run in background
docker-compose up -d

# Run DB migrations after first start
docker-compose exec app bunx prisma migrate deploy

# Tear down (keeps DB data)
docker-compose down

# Tear down and delete DB data
docker-compose down -v
```

Set `ANTHROPIC_API_KEY` in your environment or a `.env` file before running.

## Study Groups

Collaborative learning with shared progress tracking.

- **Create / join groups** via invite codes
- **Progress leaderboard** — ranked by problems solved per member
- **Stats card** — 4-stat summary on every group page:
  - Total unique problems solved by the group
  - Most-solved problem (by distinct member count)
  - Favorite pattern (most frequently solved pattern across the group)
  - Active members this week
- **Activity feed** — chronological list of recent solves ("Alice solved Two Sum, 2h ago")

### Group API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups` | List user's groups |
| `POST` | `/api/groups` | Create a group |
| `GET` | `/api/groups/:id` | Group details + members |
| `PATCH` | `/api/groups/:id` | Update group (admin) |
| `DELETE` | `/api/groups/:id` | Delete group (admin) |
| `POST` | `/api/groups/join` | Join via invite code |
| `GET` | `/api/groups/:id/progress` | Member solve counts |
| `GET` | `/api/groups/:id/stats` | Group stats summary |
| `GET` | `/api/groups/:id/activity` | Recent solve feed (`?limit=20`) |

## API

- `GET /` — Homepage
- `GET /api/hello` — Health check
- `GET /api-docs` — Swagger UI
- `GET /openapi.json` — OpenAPI spec
