# Get User

Retrieve detailed information about a specific user.

## Endpoint

```
GET /v1/admin/users/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (can only access users in the same organisation)

## Request

### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | User identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "phone": "+1234567890",
  "emailVerifiedAt": "2025-01-15T10:30:00.000Z",
  "mfaEnabled": true,
  "blockedAt": null,
  "blockedReason": null,
  "lastLoginAt": "2025-10-26T10:00:00.000Z",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-10-26T11:45:00.000Z",
  "roles": [
    {
      "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "name": "Administrator",
      "slug": "admin",
      "description": "Full system administrator access",
      "permissions": [
        {
          "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v1z",
          "slug": "users:read",
          "name": "Read Users",
          "description": "View user information"
        },
        {
          "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v2a",
          "slug": "users:create",
          "name": "Create Users",
          "description": "Create new users"
        }
      ]
    }
  ],
  "teams": [
    {
      "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "name": "Engineering",
      "slug": "engineering",
      "description": "Engineering team"
    }
  ]
}
```

### Response Fields

| Field                 | Type           | Description                                  |
| --------------------- | -------------- | -------------------------------------------- |
| `id`                  | string         | Unique user identifier                       |
| `email`               | string         | User's email address                         |
| `firstName`           | string         | User's first name                            |
| `lastName`            | string         | User's last name                             |
| `name`                | string         | User's full name                             |
| `phone`               | string \| null | User's phone number                          |
| `emailVerifiedAt`     | string \| null | ISO 8601 timestamp of email verification     |
| `mfaEnabled`          | boolean        | Whether MFA is enabled                       |
| `blockedAt`           | string \| null | ISO 8601 timestamp when user was blocked     |
| `blockedReason`       | string \| null | Reason for blocking the user                 |
| `lastLoginAt`         | string \| null | ISO 8601 timestamp of last login             |
| `createdAt`           | string         | ISO 8601 timestamp of user creation          |
| `updatedAt`           | string         | ISO 8601 timestamp of last update            |
| `roles`               | array          | Roles assigned to the user with full details |
| `roles[].id`          | string         | Role identifier                              |
| `roles[].name`        | string         | Role display name                            |
| `roles[].slug`        | string         | Role slug                                    |
| `roles[].description` | string         | Role description                             |
| `roles[].permissions` | array          | Permissions granted by this role             |
| `teams`               | array          | Teams the user belongs to with full details  |
| `teams[].id`          | string         | Team identifier                              |
| `teams[].name`        | string         | Team display name                            |
| `teams[].slug`        | string         | Team slug                                    |
| `teams[].description` | string         | Team description                             |

## Error Responses

### 401 Unauthorized

User is not authenticated.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 403 Forbidden

User lacks the required permission or CSRF token is invalid.

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:read",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
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
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

## Example Usage

### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
const userId = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w';

const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/users/${userId}`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

const user = await response.json();
console.log(`User: ${user.name} (${user.email})`);
console.log(`Roles: ${user.roles.map((r) => r.name).join(', ')}`);
```

### Python (requests)

```python
import requests

user_id = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w'

response = requests.get(
    f'https://api.cerberus-iam.dev/v1/admin/users/{user_id}',
    cookies={'cerb_sid': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

user = response.json()
print(f"User: {user['name']} ({user['email']})")
print(f"MFA Enabled: {user['mfaEnabled']}")
print(f"Roles: {', '.join(r['name'] for r in user['roles'])}")
```

## Notes

- This endpoint returns more detailed information than the list endpoint
- Roles include their associated permissions
- Teams include their descriptions
- Tenant isolation ensures users can only access users within their organisation
- Soft-deleted users will return a 404 error
- The `lastLoginAt` field may be null if the user has never logged in
