# API Overview

## Base URL

The Cerberus IAM API base URL is configured via the `ISSUER_URL` environment variable.

**Default (development):** `http://localhost:4000`

**Production:** Set via your deployment configuration

## API Versioning

Authentication endpoints are versioned:

- **Current version:** `/v1`
- **OAuth2/OIDC endpoints:** `/oauth2` (spec-compliant, no version prefix)
- **Well-known endpoints:** `/.well-known` (spec-compliant)

## Authentication Methods

### 1. Session-Based Authentication (Cookie)

Used for web applications and admin interfaces.

**Cookie Name:** `cerb_sid` (configurable via `SESSION_COOKIE_NAME`)

**How to authenticate:**

1. Call `POST /v1/auth/login` with credentials
2. Server sets HttpOnly session cookie
3. Include cookie in subsequent requests

**Security:**

- HttpOnly flag prevents JavaScript access
- Secure flag enforced in production
- SameSite=Lax for CSRF protection
- CSRF token required for state-changing operations

### 2. Bearer Token Authentication (OAuth2)

Used for API clients and third-party integrations.

**How to authenticate:**

1. Complete OAuth2 authorization flow
2. Exchange authorization code for access token
3. Include token in Authorization header:

```
Authorization: Bearer <access_token>
```

**Token types:**

- **Access Token:** Short-lived JWT (default expiry varies by client configuration)
- **Refresh Token:** Long-lived opaque token (optional, requires `offline_access` scope)

### 3. Client Credentials

Used for machine-to-machine authentication.

**Methods supported:**

- `client_secret_basic`: HTTP Basic Authentication
- `client_secret_post`: Credentials in request body
- `none`: Public clients (no secret required)

## Common Headers

### Required Headers

#### X-Org-Slug

**Required for:** Multi-tenant endpoints (API v1 routes)

**Description:** Identifies the organisation context for the request. Each organisation has a unique slug assigned during registration.

**Example:**

```
X-Org-Slug: acme-corp
```

**When not required:**

- OAuth2/OIDC endpoints (organisation derived from client/token)
- Public endpoints (registration, password reset)

### Optional Headers

#### Authorization

OAuth2 bearer token for API authentication.

```
Authorization: Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

#### X-CSRF-Token

Required for state-changing operations when using session authentication.

```
X-CSRF-Token: <csrf_token>
```

#### Content-Type

Always use `application/json` for request bodies.

```
Content-Type: application/json
```

## Response Format

### Success Responses

All successful responses return JSON with appropriate HTTP status codes:

**Single resource:**

```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Collection:**

```json
{
  "data": [
    { "id": "usr_abc123", "email": "user@example.com" },
    { "id": "usr_xyz789", "email": "other@example.com" }
  ],
  "total": 2
}
```

**Operation success:**

```json
{
  "message": "Operation completed successfully"
}
```

### Status Codes

| Code | Description                                          |
| ---- | ---------------------------------------------------- |
| 200  | OK - Request succeeded                               |
| 201  | Created - Resource created successfully              |
| 204  | No Content - Request succeeded, no content to return |
| 400  | Bad Request - Invalid input or malformed request     |
| 401  | Unauthorized - Authentication required or failed     |
| 403  | Forbidden - Insufficient permissions                 |
| 404  | Not Found - Resource does not exist                  |
| 409  | Conflict - Resource conflict (e.g., duplicate email) |
| 422  | Unprocessable Entity - Semantic validation errors    |
| 429  | Too Many Requests - Rate limit exceeded              |
| 500  | Internal Server Error - Unexpected server error      |

### Error Responses

All errors follow RFC 7807 Problem Details format. See [errors.md](./errors.md) for complete documentation.

**Example:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid email format"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse.

**Default limits:**

- **General endpoints:** 120 requests per 60 seconds
- **Authentication endpoints:** 30 requests per 60 seconds
- **Token endpoint:** 30 requests per 60 seconds

**Configuration:**

- `RATE_WINDOW_SEC` / `RATE_MAX`: General rate limits
- `AUTH_RATE_WINDOW_SEC` / `AUTH_RATE_MAX`: Auth endpoints
- `TOKEN_RATE_WINDOW_SEC` / `TOKEN_RATE_MAX`: Token endpoint

**Rate limit headers:**

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1638360000
```

## Pagination

Collection endpoints that support pagination use the following query parameters:

| Parameter | Type    | Default | Description                                 |
| --------- | ------- | ------- | ------------------------------------------- |
| `page`    | integer | 1       | Page number (1-indexed)                     |
| `limit`   | integer | 50      | Items per page (max 100)                    |
| `sort`    | string  | -       | Sort field (prefix with `-` for descending) |

**Example:**

```
GET /v1/admin/users?page=2&limit=25&sort=-createdAt
```

**Response:**

```json
{
  "data": [...],
  "total": 150,
  "page": 2,
  "limit": 25,
  "pages": 6
}
```

## CORS

Cross-Origin Resource Sharing (CORS) is configured via environment variables:

- `ADMIN_WEB_ORIGIN`: Allowed origin for admin web application
- `ADMIN_WEB_INTERNAL_ORIGIN`: Internal origin (for server-to-server)

**Development:** `http://localhost:3000` is allowed by default

## Security Headers

The API includes the following security headers via Helmet:

- `Strict-Transport-Security`: HTTPS enforcement
- `X-Content-Type-Options: nosniff`: Prevent MIME sniffing
- `X-Frame-Options: DENY`: Prevent clickjacking
- `X-XSS-Protection: 1; mode=block`: XSS protection
- `Content-Security-Policy`: Restrict resource loading

## Request ID Tracing

Every request is assigned a unique request ID for tracing and debugging.

**Header:** `X-Request-Id`

**Example:**

```
X-Request-Id: req_1234567890abcdef
```

This ID is included in all log entries and can be used to trace a request through the system.

## API Clients

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:4000/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Org-Slug': 'acme-corp',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
  }),
  credentials: 'include', // Include cookies
});

const data = await response.json();
```

### cURL

```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Slug: acme-corp" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt # Save cookies
```

## Further Reading

- [Error Responses](./errors.md)
- [Authentication Endpoints](./auth/)
- [OAuth2/OIDC Endpoints](./oauth2/)
