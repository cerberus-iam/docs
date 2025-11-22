# User Sessions Management

Manage active user sessions for the authenticated user. List all active sessions and revoke specific sessions.

## Endpoints

- [List Sessions](#list-sessions)
- [Revoke Session](#revoke-session)

---

## List Sessions

Retrieve all active sessions for the authenticated user.

### Endpoint

```
GET /v1/me/sessions
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can view their own sessions)

### Security

- CSRF protection enabled (requires valid CSRF token)
- Session must be active and valid

### Request

#### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

#### Query Parameters

None

#### Request Body

None

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "ses_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "lastActivityAt": "2025-10-26T10:30:00.000Z",
      "expiresAt": "2025-11-02T10:00:00.000Z",
      "createdAt": "2025-10-26T10:00:00.000Z"
    },
    {
      "id": "ses_01h2xz9k3m4n5p6q7r8s9t0v2x",
      "ipAddress": "192.168.1.101",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
      "lastActivityAt": "2025-10-25T14:22:00.000Z",
      "expiresAt": "2025-11-01T14:00:00.000Z",
      "createdAt": "2025-10-25T14:00:00.000Z"
    }
  ]
}
```

#### Response Fields

| Field                   | Type   | Description                                   |
| ----------------------- | ------ | --------------------------------------------- |
| `data`                  | array  | Array of active session objects               |
| `data[].id`             | string | Unique session identifier                     |
| `data[].ipAddress`      | string | IP address from which the session was created |
| `data[].userAgent`      | string | Browser/client user agent string              |
| `data[].lastActivityAt` | string | ISO 8601 timestamp of last activity           |
| `data[].expiresAt`      | string | ISO 8601 timestamp when session expires       |
| `data[].createdAt`      | string | ISO 8601 timestamp when session was created   |

### Error Responses

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/me/sessions"
}
```

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Invalid CSRF token",
  "instance": "/v1/me/sessions"
}
```

### Example Usage

#### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/v1/me/sessions \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/sessions', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

const { data: sessions } = await response.json();
console.log('Active sessions:', sessions);
```

---

## Revoke Session

Revoke a specific session for the authenticated user. This will immediately invalidate the session and log out the user from that device/browser.

### Endpoint

```
DELETE /v1/me/sessions/:id
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can revoke their own sessions)

### Security

- CSRF protection enabled (requires valid CSRF token)
- Users can only revoke their own sessions
- Cannot revoke a non-existent session (silently succeeds)

### Request

#### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

#### Path Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `id`      | string | Yes      | Session identifier to revoke |

#### Query Parameters

None

#### Request Body

None

### Success Response (204 No Content)

Empty response body. Session has been successfully revoked.

### Error Responses

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/me/sessions/ses_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Invalid CSRF token",
  "instance": "/v1/me/sessions/ses_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### Example Usage

#### cURL

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/me/sessions/ses_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

#### JavaScript (fetch)

```javascript
const sessionId = 'ses_01h2xz9k3m4n5p6q7r8s9t0v1w';

const response = await fetch(`https://api.cerberus-iam.dev/v1/me/sessions/${sessionId}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

if (response.ok) {
  console.log('Session revoked successfully');
}
```

#### Python (requests)

```python
import requests

session_id = 'ses_01h2xz9k3m4n5p6q7r8s9t0v1w'

response = requests.delete(
    f'https://api.cerberus-iam.dev/v1/me/sessions/{session_id}',
    cookies={'cerb_sid': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

if response.status_code == 204:
    print('Session revoked successfully')
```

## Notes

- Only active (non-expired) sessions are returned by the list endpoint
- Sessions are automatically cleaned up after they expire
- Revoking the current session will log out the user
- The `deleteMany` query ensures users can only revoke their own sessions
- Session data includes IP address and user agent for security auditing
- Sessions are ordered by `lastActivityAt` in descending order (most recent first)
