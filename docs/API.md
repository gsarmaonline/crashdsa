# API Documentation

**Base URL:** `http://localhost:3000`
**Framework:** Hono + Bun
**Last Updated:** 2026-02-15

---

## UI Routes

### GET /

Homepage with featured problems and statistics.

### GET /problems

Problems listing page with client-side filtering by pattern, difficulty, and search. Supports `?pattern=<name>` query param to pre-select a pattern filter.

### GET /patterns

Patterns page showing all 20 solution patterns as cards with problem counts and difficulty breakdowns. Each card links to `/problems?pattern=<name>`.

---

## API Endpoints

### GET /api/hello

Returns a JSON hello message.

**Response:** `200 OK`
```json
{
  "message": "Hello from Hono API!"
}
```

---

### GET /api/problems

List all problems, optionally filtered by difficulty.

**Query Parameters:**
- `difficulty` (string, optional): Filter by `Easy`, `Medium`, or `Hard`

**Response:** `200 OK`
```json
{
  "problems": [
    {
      "name": "Two Sum",
      "difficulty": "Easy",
      "patterns": ["two-pointers"],
      "sourceSheets": ["neetcode150", "blind75"],
      "link": "https://leetcode.com/problems/two-sum/",
      "acceptanceRate": "51.4%",
      "tags": ["Array", "Hash Table"]
    }
  ],
  "count": 326
}
```

---

### GET /api/problems/pattern/:pattern

Get problems belonging to a specific solution pattern.

**Path Parameters:**
- `pattern` (string, required): Pattern slug (e.g. `two-pointers`, `sliding-window`, `dynamic-programming-1d`)

**Response:** `200 OK`
```json
{
  "pattern": "two-pointers",
  "problems": [ ... ],
  "count": 25
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Pattern not found"
}
```

---

### GET /api/patterns

List all available solution patterns with display names and problem counts.

**Response:** `200 OK`
```json
{
  "patterns": [
    {
      "name": "two-pointers",
      "displayName": "Two Pointers",
      "count": 25
    }
  ],
  "total": 20
}
```

---

### GET /api/stats

Returns aggregate statistics about the problem collection.

**Response:** `200 OK`
```json
{
  "total": 326,
  "easy": 70,
  "medium": 180,
  "hard": 76,
  "lastUpdated": "2026-02-15T00:00:00.000Z"
}
```

---

### POST /api/refresh

Reloads all problem data from CSV files into the in-memory cache.

**Response:** `200 OK`
```json
{
  "message": "Cache refreshed successfully"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "error": "Failed to refresh cache"
}
```

---

## Error Responses

All endpoints may return:

### 404 Not Found
```json
{
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Development

**Start the server:**
```bash
bun run dev
```

**Production server:**
```bash
bun run start
```

The server will be available at `http://localhost:3000`
