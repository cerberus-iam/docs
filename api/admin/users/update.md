# Update User

Update an existing user's information.

## Endpoint

```
PATCH /api/v1/admin/users/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:update`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (can only update users in the same organisation)

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | User identifier |

### Query Parameters

None

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "blockedAt": "2025-10-26T12:00:00.000Z",
  "blockedReason": "Suspicious activity detected",
  "mfaEnabled": false
}
```

#### Request Fields

| Field           | Type           | Required | Description                                              |
| --------------- | -------------- | -------- | -------------------------------------------------------- |
| `firstName`     | string         | No       | User's first name                                        |
| `lastName`      | string         | No       | User's last name                                         |
| `phone`         | string         | No       | User's phone number                                      |
| `blockedAt`     | string \| null | No       | ISO 8601 timestamp to block user. Set to null to unblock |
| `blockedReason` | string \| null | No       | Reason for blocking the user                             |
| `mfaEnabled`    | boolean        | No       | Force enable/disable MFA for the user                    |

## Response

### Success Response (200 OK)

```json
{
  "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "name": "Jane Smith",
  "phone": "+1234567890",
  "emailVerifiedAt": "2025-01-15T10:30:00.000Z",
  "mfaEnabled": false,
  "blockedAt": "2025-10-26T12:00:00.000Z",
  "blockedReason": "Suspicious activity detected",
  "lastLoginAt": "2025-10-25T10:00:00.000Z",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z",
  "roles": [
    {
      "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "name": "Member",
      "slug": "member"
    }
  ],
  "teams": []
}
```

### Response Fields

Returns the complete updated user object with the same fields as the [Get User](./get.md) endpoint.

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "invalid_string",
      "path": ["blockedAt"],
      "message": "Invalid datetime"
    }
  ],
  "instance": "/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:update",
  "instance": "/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 404 Not Found

User does not exist or does not belong to the same organisation.

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found",
  "instance": "/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

## Example Usage

### cURL

```bash
# Update user's name
curl -X PATCH https://api.cerberus-iam.dev/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'

# Block a user
curl -X PATCH https://api.cerberus-iam.dev/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "blockedAt": "2025-10-26T12:00:00.000Z",
    "blockedReason": "Policy violation"
  }'

# Unblock a user
curl -X PATCH https://api.cerberus-iam.dev/api/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "blockedAt": null,
    "blockedReason": null
  }'
```

### JavaScript (fetch)

```javascript
const userId = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w';

// Update user's phone number
const response = await fetch(`https://api.cerberus-iam.dev/api/v1/admin/users/${userId}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '+1234567890',
  }),
});

const user = await response.json();
console.log('User updated:', user);

// Block a user
const blockResponse = await fetch(`https://api.cerberus-iam.dev/api/v1/admin/users/${userId}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    blockedAt: new Date().toISOString(),
    blockedReason: 'Suspicious activity',
  }),
});
```

### Python (requests)

```python
import requests
from datetime import datetime

user_id = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w'

# Update user's name
response = requests.patch(
    f'https://api.cerberus-iam.dev/api/v1/admin/users/{user_id}',
    cookies={'cerberus_session': 'abc123...'},
    headers={
        'X-CSRF-Token': 'xyz789...',
        'Content-Type': 'application/json'
    },
    json={
        'firstName': 'Jane',
        'lastName': 'Smith'
    }
)

user = response.json()
print(f"User updated: {user['name']}")

# Block a user
block_response = requests.patch(
    f'https://api.cerberus-iam.dev/api/v1/admin/users/{user_id}',
    cookies={'cerberus_session': 'abc123...'},
    headers={
        'X-CSRF-Token': 'xyz789...',
        'Content-Type': 'application/json'
    },
    json={
        'blockedAt': datetime.now().isoformat(),
        'blockedReason': 'Policy violation'
    }
)
```

## Notes

- This endpoint uses PATCH semantics - only send fields you want to update
- The full name is automatically regenerated if `firstName` or `lastName` are updated
- Setting `blockedAt` to a timestamp will block the user and terminate all active sessions
- Setting `blockedAt` to null will unblock the user
- When blocking a user, it's recommended to provide a `blockedReason` for audit purposes
- Forcing `mfaEnabled` to false will disable MFA without requiring verification (use with caution)
- An audit log entry is created for this action
- Tenant isolation ensures users can only update users within their organisation
- The updater's user ID, IP address, and user agent are recorded in the audit log
- Email addresses cannot be changed via this endpoint for security reasons
