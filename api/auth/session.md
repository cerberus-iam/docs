# Revoke Session

Idempotently revoke the currently authenticated browser session.

## Endpoint

```http
DELETE /v1/auth/session
```

## Description

Ends the active session by deleting the backing record and clearing both the session and CSRF
cookies. The endpoint succeeds even when the session cookie is missing or already expired, making
it safe to call repeatedly.

## Authentication

**Required:** Yes (session cookie)

**CSRF Protection:** No (intentionally exempt)

## Headers

| Header         | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `Cookie`       | Yes      | Must include session cookie (`cerb_sid`) |
| `X-Org-Domain` | No       | Optional tenant context if applicable    |

## Request Body

**Empty** - No request body required.

## Response

### Success Response

**Status Code:** `204 No Content`

**Headers:**

```http
Set-Cookie: cerb_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: cerb_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

### Error Responses

#### 401 Unauthorized - Not Authenticated

Returned when the request does not include a valid session cookie.

```json
{
  "type": "https://api.cerberus-iam.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

## Usage Examples

### cURL

```bash
curl -X DELETE http://localhost:4000/v1/auth/session \
  -b cookies.txt
```

### JavaScript

```javascript
await fetch('http://localhost:4000/v1/auth/session', {
  method: 'DELETE',
  credentials: 'include',
});
```

No JSON body is returned; rely on the `204` status and cleared cookies to confirm success.

## Relationship to POST /v1/auth/logout

Both endpoints ultimately call the same session termination helper. `POST /v1/auth/logout`
responds with a JSON payload (`{ "message": "Logged out successfully" }`) for legacy clients,
while this route returns `204` to better align with REST semantics and idempotent retry patterns.
Prefer this endpoint for new integrations.
