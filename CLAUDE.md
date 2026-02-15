# CrashDSA - Project Instructions

This file contains instructions and context for Claude Code when working on this project.

## Project Overview

**CrashDSA** is a full-stack web application built with Hono and Bun. The goal is to provide a lightweight, fast platform for data structures and algorithms learning with interactive problems and solutions.

## Tech Stack

- **Runtime:** Bun (fast JavaScript runtime)
- **Framework:** Hono (lightweight web framework)
- **Frontend:** Server-side rendered HTML with Hono
- **Language:** TypeScript
- **Documentation:** OpenAPI/Swagger
- **Visual Testing:** Puppeteer for screenshot automation

## Project Structure

```
crashdsa/
├── index.ts              # Main application file with routes
├── src/                  # Source code
│   ├── views/           # HTML page templates
│   ├── components/      # Reusable UI components (future)
│   ├── styles/          # CSS stylesheets
│   └── dsa-sheets/      # DSA sheet aggregation system
│       ├── types.ts           # Type definitions
│       ├── patterns.ts        # Pattern definitions
│       ├── categorizers.ts    # Categorization logic
│       ├── fetchers.ts        # Fetch utilities
│       ├── curated-lists.ts   # Curated problem lists
│       └── mappings/          # Manual overrides
├── dsa-sheets/          # DSA sheet data
│   ├── raw/            # Fetched JSON data
│   ├── processed/      # Normalized problems
│   ├── csv/            # CSV exports
│   │   ├── master.csv
│   │   └── by-pattern/
│   └── metadata/       # Fetch history
├── docs/                 # API documentation
│   ├── API.md           # Human-readable API docs
│   ├── openapi.json     # OpenAPI 3.0 specification
│   ├── API_EXAMPLES.md  # cURL examples
│   └── API_SUMMARY.md   # API overview
├── screenshots/         # Auto-generated screenshots
├── scripts/             # Utility scripts
│   ├── generate-api-docs.ts  # Documentation generator
│   ├── take-screenshots.ts   # Screenshot capture script
│   └── dsa-sheets/           # DSA sheet pipeline scripts
│       ├── fetch-sheets.ts
│       ├── process-sheets.ts
│       ├── categorize-problems.ts
│       ├── deduplicate.ts
│       ├── export-csv.ts
│       └── update-all.ts     # Master orchestrator
├── package.json
└── tsconfig.json
```

## Requirements

### Code Style

- Use TypeScript with strict mode
- Follow functional programming patterns where appropriate
- Use async/await for asynchronous operations
- Keep functions small and focused

### API Development

- All routes should be defined in `index.ts` (or organized into separate route files as the project grows)
- Use proper HTTP status codes (200, 201, 400, 404, 500, etc.)
- Return JSON for API endpoints
- Use RESTful conventions for route naming

### API Documentation

- **Whenever backend routes change** (new endpoints, modified types), automatically update API documentation
- Before creating PRs with API changes, run `/apify` or `bun run api-docs` to regenerate documentation
- Include API changes summary in PR descriptions
- Keep OpenAPI spec in sync with code
- Document all request/response types, status codes, and error responses

### Visual Testing & Screenshots

- **Whenever frontend code changes** (HTML, CSS, new pages), run screenshot capture
- Before creating PRs with UI changes, run `/screenshotify` or `bun run screenshots`
- Screenshots are captured in 3 viewports: desktop (1920x1080), tablet (768x1024), mobile (375x667)
- Include screenshot comparisons in PR descriptions showing visual changes
- Screenshots help reviewers understand visual impact of changes

### DSA Sheet Aggregation

**Target Audience**: Senior engineers preparing for advanced technical interviews

- **Purpose**: Consolidate problems from 5 popular DSA practice sheets (NeetCode 150, Blind 75, LeetCode Top 150, Grind 75, Striver's A2Z)
- **Features**: Categorizes by 20 pure solution patterns (algorithmic strategies, not data structures), removes duplicates, exports to CSV
- **Solution Patterns** (strategic approach, not data structures):
  - Two Pointers, Fast & Slow Pointers, Sliding Window
  - Binary Search, Cyclic Sort, Linked List Reversal
  - Tree DFS, Tree BFS, Graph DFS, Graph BFS
  - Union Find, Topological Sort, Backtracking
  - Dynamic Programming (1D & 2D), Greedy
  - Merge Intervals, Top K Elements, Monotonic Stack, Bit Manipulation
- **Usage**: Run `/update-dsa-sheets` or `bun run dsa-sheets:update` to refresh data
- **Output**:
  - `dsa-sheets/csv/master.csv` - All unique problems
  - `dsa-sheets/csv/by-pattern/*.csv` - Problems grouped by solution strategy
- **Cache**: Data cached for 24 hours, use `--force` to override
- **Pipeline**: Fetch → Process → Categorize → Deduplicate → Export CSV
- **Stats**: ~326 unique problems after deduplication from ~456 total

### Testing

- Add tests for new endpoints (future)
- Ensure all tests pass before committing

## Commands and Tools

### Development Commands (Auto-approved)

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run api-docs` - Generate/update API documentation
- `bun run api-docs:serve` - Start server and view docs at http://localhost:3000/api-docs
- `bun run screenshots` - Capture screenshots of all pages (desktop, tablet, mobile)
- `bun run dsa-sheets:update` - Run full DSA sheet aggregation pipeline
- `bun run dsa-sheets:update -- --force` - Force update, ignoring cache
- `bun run dsa-sheets:fetch` - Fetch data from all sources
- `bun run dsa-sheets:process` - Process and normalize data
- `bun run dsa-sheets:categorize` - Categorize problems by patterns
- `bun run dsa-sheets:deduplicate` - Remove duplicate problems
- `bun run dsa-sheets:export` - Export to CSV files

### Documentation Workflow

1. After making API changes (new routes, modified handlers), run `/apify` to update documentation
2. Review generated docs in `docs/` directory
3. When creating PRs, include API changes summary
4. Documentation is accessible at http://localhost:3000/api-docs when server is running

### Git Workflow

- Use conventional commit messages (feat:, fix:, docs:, refactor:, etc.)
- Always run tests before committing (when tests are added)
- Keep commits focused and atomic

## Routes

### UI Routes
- `GET /` - Homepage with DSA problems showcase
- `GET /styles.css` - CSS stylesheet

### API Endpoints
- `GET /api/hello` - Hello API message
- `GET /api-docs` - Interactive Swagger UI documentation
- `GET /openapi.json` - OpenAPI specification

## Notes

### Future Enhancements

Consider adding:
- User authentication and authorization
- Database integration (PostgreSQL, MongoDB, or SQLite)
- Input validation middleware
- Error handling middleware
- Rate limiting
- CORS configuration
- API versioning (e.g., /api/v1/)
- Health check endpoint
- Metrics and logging
- Unit and integration tests

### Performance

- Bun is extremely fast, leverage its speed
- Consider caching strategies for frequently accessed data
- Use streaming for large responses when needed

### Security

- Validate all user input
- Sanitize data before database operations
- Use parameterized queries to prevent SQL injection
- Implement rate limiting to prevent abuse
- Use HTTPS in production
- Store secrets in environment variables (never commit them)

## Resources

- [Hono Documentation](https://hono.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [OpenAPI Specification](https://swagger.io/specification/)
