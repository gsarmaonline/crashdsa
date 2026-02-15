# API Usage Examples

This document contains practical cURL examples for all API endpoints.

---

## General Endpoints

### Get Welcome Message

**Request:**
```bash
curl http://localhost:3000/
```

**Response:**
```
Hello Hono!
```

---

## API Endpoints

### Get Hello Message

**Request:**
```bash
curl http://localhost:3000/api/hello
```

**Response:**
```json
{
  "message": "Hello from Hono API!"
}
```

**With pretty-printed JSON:**
```bash
curl http://localhost:3000/api/hello | jq
```

---

## Testing from Different Tools

### Using HTTPie
```bash
# Install: brew install httpie
http GET http://localhost:3000/api/hello
```

### Using wget
```bash
wget -qO- http://localhost:3000/api/hello
```

### Using Bun fetch (programmatic)
```typescript
const response = await fetch('http://localhost:3000/api/hello');
const data = await response.json();
console.log(data);
```

### Using browser
Simply navigate to:
- http://localhost:3000/
- http://localhost:3000/api/hello

---

## Advanced Examples

### Check response headers
```bash
curl -i http://localhost:3000/api/hello
```

### Measure response time
```bash
curl -w "@-" -o /dev/null -s http://localhost:3000/api/hello <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

### Save response to file
```bash
curl http://localhost:3000/api/hello -o response.json
```
