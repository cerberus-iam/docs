# List Users

Retrieve a list of all users in the organisation.

## Endpoint

```
GET /v1/admin/users
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only users from the authenticated user's organisation)
- Requires admin-level permissions

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Query Parameters

None (pagination and filtering to be implemented in future versions)

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "data": [
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
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-10-26T11:45:00.000Z",
      "roles": [
        {
          "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
          "name": "Administrator",
          "slug": "admin"
        }
      ],
      "teams": [
        {
          "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v1z",
          "name": "Engineering",
          "slug": "engineering"
        }
      ]
    },
    {
      "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v2x",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "name": "Jane Smith",
      "phone": null,
      "emailVerifiedAt": "2025-02-01T09:15:00.000Z",
      "mfaEnabled": false,
      "blockedAt": null,
      "blockedReason": null,
      "createdAt": "2025-02-01T09:00:00.000Z",
      "updatedAt": "2025-10-25T15:20:00.000Z",
      "roles": [
        {
          "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v2y",
          "name": "Member",
          "slug": "member"
        }
      ],
      "teams": []
    }
  ],
  "total": 2
}
```

### Response Fields

| Field                    | Type           | Description                              |
| ------------------------ | -------------- | ---------------------------------------- |
| `data`                   | array          | Array of user objects                    |
| `total`                  | number         | Total count of users                     |
| `data[].id`              | string         | Unique user identifier                   |
| `data[].email`           | string         | User's email address                     |
| `data[].firstName`       | string         | User's first name                        |
| `data[].lastName`        | string         | User's last name                         |
| `data[].name`            | string         | User's full name                         |
| `data[].phone`           | string \| null | User's phone number                      |
| `data[].emailVerifiedAt` | string \| null | ISO 8601 timestamp of email verification |
| `data[].mfaEnabled`      | boolean        | Whether MFA is enabled                   |
| `data[].blockedAt`       | string \| null | ISO 8601 timestamp when user was blocked |
| `data[].blockedReason`   | string \| null | Reason for blocking the user             |
| `data[].createdAt`       | string         | ISO 8601 timestamp of user creation      |
| `data[].updatedAt`       | string         | ISO 8601 timestamp of last update        |
| `data[].roles`           | array          | Roles assigned to the user               |
| `data[].teams`           | array          | Teams the user belongs to                |

## Error Responses

### 401 Unauthorized

User is not authenticated.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/users"
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
  "instance": "/v1/admin/users"
}
```

## Example Usage

### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/users \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/admin/users', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

const { data: users, total } = await response.json();
console.log(`Found ${total} users:`, users);
```

### Python (requests)

```python
import requests

response = requests.get(
    'https://api.cerberus-iam.dev/v1/admin/users',
    cookies={'cerberus_session': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

users_data = response.json()
print(f"Total users: {users_data['total']}")
for user in users_data['data']:
    print(f"- {user['name']} ({user['email']})")
```

## Notes

- Users are filtered by the authenticated user's organisation (tenant isolation)
- Soft-deleted users are excluded from the results
- The endpoint returns all users without pagination (consider implementing pagination for large datasets)
- Role and team information is included in the response for convenience
- Phone numbers may be null if not provided
- Blocked users are included in the results with `blockedAt` and `blockedReason` fields populated
