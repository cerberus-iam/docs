# Create User

Create a new user in the organisation.

## Endpoint

```
POST /api/v1/admin/users
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:create`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (user created in the authenticated user's organisation)
- Email uniqueness enforced across the entire system

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

### Path Parameters

None

### Query Parameters

None

### Request Body

```json
{
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "password": "SecureP@ssw0rd123",
  "roleIds": ["rol_01h2xz9k3m4n5p6q7r8s9t0v1y"],
  "teamIds": ["tem_01h2xz9k3m4n5p6q7r8s9t0v1z"]
}
```

#### Request Fields

| Field       | Type   | Required | Description                                                                                                      |
| ----------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `email`     | string | Yes      | User's email address (must be valid email format)                                                                |
| `firstName` | string | Yes      | User's first name (minimum 1 character)                                                                          |
| `lastName`  | string | Yes      | User's last name (minimum 1 character)                                                                           |
| `password`  | string | No       | User's password (minimum 8 characters). If not provided, user must set password via invitation or password reset |
| `roleIds`   | array  | No       | Array of role IDs to assign. If empty or not provided, default role is assigned                                  |
| `teamIds`   | array  | No       | Array of team IDs to assign                                                                                      |

## Response

### Success Response (201 Created)

```json
{
  "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v2x",
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "name": "Jane Doe",
  "phone": null,
  "emailVerifiedAt": null,
  "mfaEnabled": false,
  "blockedAt": null,
  "blockedReason": null,
  "lastLoginAt": null,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z",
  "roles": [
    {
      "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "name": "Member",
      "slug": "member"
    }
  ],
  "teams": [
    {
      "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "name": "Engineering",
      "slug": "engineering"
    }
  ]
}
```

### Response Fields

| Field             | Type           | Description                                       |
| ----------------- | -------------- | ------------------------------------------------- |
| `id`              | string         | Unique user identifier                            |
| `email`           | string         | User's email address                              |
| `firstName`       | string         | User's first name                                 |
| `lastName`        | string         | User's last name                                  |
| `name`            | string         | User's full name (auto-generated)                 |
| `phone`           | string \| null | User's phone number (null for new users)          |
| `emailVerifiedAt` | string \| null | Email verification timestamp (null for new users) |
| `mfaEnabled`      | boolean        | MFA status (false for new users)                  |
| `blockedAt`       | string \| null | Block timestamp (null for new users)              |
| `blockedReason`   | string \| null | Block reason (null for new users)                 |
| `lastLoginAt`     | string \| null | Last login timestamp (null for new users)         |
| `createdAt`       | string         | ISO 8601 timestamp of user creation               |
| `updatedAt`       | string         | ISO 8601 timestamp of last update                 |
| `roles`           | array          | Assigned roles                                    |
| `teams`           | array          | Assigned teams                                    |

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
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "code": "too_small",
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    }
  ],
  "instance": "/api/v1/admin/users"
}
```

### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/api/v1/admin/users"
}
```

### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:create",
  "instance": "/api/v1/admin/users"
}
```

### 409 Conflict

Email address is already registered.

```json
{
  "type": "https://cerberus-iam.dev/problems/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered",
  "instance": "/api/v1/admin/users"
}
```

## Example Usage

### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/api/v1/admin/users \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "password": "SecureP@ssw0rd123",
    "roleIds": ["rol_01h2xz9k3m4n5p6q7r8s9t0v1y"],
    "teamIds": ["tem_01h2xz9k3m4n5p6q7r8s9t0v1z"]
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/api/v1/admin/users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    password: 'SecureP@ssw0rd123',
    roleIds: ['rol_01h2xz9k3m4n5p6q7r8s9t0v1y'],
    teamIds: ['tem_01h2xz9k3m4n5p6q7r8s9t0v1z'],
  }),
});

if (response.ok) {
  const user = await response.json();
  console.log('User created:', user);
} else {
  const error = await response.json();
  console.error('Failed to create user:', error.detail);
}
```

### Python (requests)

```python
import requests

response = requests.post(
    'https://api.cerberus-iam.dev/api/v1/admin/users',
    cookies={'cerberus_session': 'abc123...'},
    headers={
        'X-CSRF-Token': 'xyz789...',
        'Content-Type': 'application/json'
    },
    json={
        'email': 'jane.doe@example.com',
        'firstName': 'Jane',
        'lastName': 'Doe',
        'password': 'SecureP@ssw0rd123',
        'roleIds': ['rol_01h2xz9k3m4n5p6q7r8s9t0v1y'],
        'teamIds': ['tem_01h2xz9k3m4n5p6q7r8s9t0v1z']
    }
)

if response.status_code == 201:
    user = response.json()
    print(f"User created: {user['name']} ({user['email']})")
else:
    error = response.json()
    print(f"Error: {error['detail']}")
```

## Notes

- If `roleIds` is not provided or is empty, the default role for the organisation is automatically assigned
- If no default role exists, the user will be created without any roles
- The `password` field is optional - if not provided, the user should be invited via the invitations endpoint
- The full name is automatically generated from `firstName` and `lastName`
- The user is created in the authenticated user's organisation (tenant)
- An audit log entry is created for this action
- Email addresses must be unique across the entire system, not just within the organisation
- The creator's user ID, IP address, and user agent are recorded in the audit log
