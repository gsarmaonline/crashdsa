# API Usage Examples

This document contains practical cURL examples for all API endpoints.

---

## API Endpoints

### Hello Message

```bash
curl http://localhost:3000/api/hello
```

Response:
```json
{
  "message": "Hello from Hono API!"
}
```

---

### List All Problems

```bash
curl http://localhost:3000/api/problems
```

### Filter Problems by Difficulty

```bash
curl http://localhost:3000/api/problems?difficulty=Easy
curl http://localhost:3000/api/problems?difficulty=Medium
curl http://localhost:3000/api/problems?difficulty=Hard
```

---

### Get Problems by Pattern

```bash
curl http://localhost:3000/api/problems/pattern/two-pointers
curl http://localhost:3000/api/problems/pattern/sliding-window
curl http://localhost:3000/api/problems/pattern/dynamic-programming-1d
```

---

### List All Patterns

```bash
curl http://localhost:3000/api/patterns
```

Response:
```json
{
  "patterns": [
    { "name": "two-pointers", "displayName": "Two Pointers", "count": 25 },
    { "name": "sliding-window", "displayName": "Sliding Window", "count": 18 }
  ],
  "total": 20
}
```

---

### Get Statistics

```bash
curl http://localhost:3000/api/stats
```

Response:
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

### Refresh Cache

```bash
curl -X POST http://localhost:3000/api/refresh
```

Response:
```json
{
  "message": "Cache refreshed successfully"
}
```

---

## UI Pages

Open in a browser:
- http://localhost:3000/ — Homepage
- http://localhost:3000/problems — All problems with filters
- http://localhost:3000/problems?pattern=two-pointers — Problems pre-filtered by pattern
- http://localhost:3000/patterns — All solution patterns
- http://localhost:3000/api-docs — Swagger UI documentation

---

## Pretty-Print JSON

```bash
curl http://localhost:3000/api/problems | jq
curl http://localhost:3000/api/patterns | jq
curl http://localhost:3000/api/stats | jq
```
