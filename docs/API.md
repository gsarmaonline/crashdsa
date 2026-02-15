# API Documentation

**Base URL:** `http://localhost:3000`
**Framework:** Hono + Bun
**Last Updated:** 2026-02-15

---

## Endpoints

### GET /

Get welcome message

**Description:** Returns a simple welcome message to verify the API is running.

**Response:** `200 OK`
```
Content-Type: text/plain

Hello Hono!
```

**Example Request:**
```bash
curl http://localhost:3000/
```

**Example Response:**
```
Hello Hono!
```

---

### GET /api/hello

Get hello message

**Description:** Returns a JSON response with a hello message from the Hono API.

**Response:** `200 OK`
```json
{
  "message": "Hello from Hono API!"
}
```

**Example Request:**
```bash
curl http://localhost:3000/api/hello
```

**Example Response:**
```json
{
  "message": "Hello from Hono API!"
}
```

---

## Error Responses

All endpoints may return the following error responses:

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

---

## Notes

- This is a minimal Hono API starter
- All responses use UTF-8 encoding
- No authentication required for current endpoints
- No rate limiting configured
