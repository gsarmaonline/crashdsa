# API Summary

**Project:** CrashDSA
**Framework:** Hono + Bun
**Last Updated:** 2026-02-15
**Total Endpoints:** 9

---

## Quick Stats

- **Total Endpoints:** 9
- **UI Routes:** 3
- **GET Endpoints:** 8
- **POST Endpoints:** 1

---

## Endpoints Overview

### UI (3 routes)
- `GET /` - Homepage with featured problems
- `GET /problems` - Problems listing with filters (supports `?pattern=` query)
- `GET /patterns` - Solution patterns overview with difficulty breakdowns

### API (1 endpoint)
- `GET /api/hello` - Hello message

### Problems (2 endpoints)
- `GET /api/problems` - List all problems (filterable by difficulty)
- `GET /api/problems/pattern/:pattern` - Get problems by pattern

### Patterns (1 endpoint)
- `GET /api/patterns` - List all patterns with counts

### Stats (1 endpoint)
- `GET /api/stats` - Aggregate statistics

### Admin (1 endpoint)
- `POST /api/refresh` - Refresh data cache

---

## Type Definitions

### Problem
```typescript
interface Problem {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  patterns: string[]
  sourceSheets: string[]
  link: string
  acceptanceRate: string
  tags: string[]
}
```

### PatternInfo
```typescript
interface PatternInfo {
  name: string
  displayName: string
  count: number
}
```

### StatsResponse
```typescript
interface StatsResponse {
  total: number
  easy: number
  medium: number
  hard: number
  lastUpdated: Date
}
```

### ErrorResponse
```typescript
interface ErrorResponse {
  error: string
}
```

---

## Authentication

Currently, no authentication is required for any endpoints.

---

## Documentation Resources

- [Full API Documentation](./API.md)
- [OpenAPI Specification](./openapi.json)
- [cURL Examples](./API_EXAMPLES.md)
- [Swagger UI](http://localhost:3000/api-docs) (when server is running)
