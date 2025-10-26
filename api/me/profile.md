# Get User Profile

Retrieve the authenticated user's profile information including roles, permissions, and organisation details.

## Endpoint

```
GET /api/v1/me/profile
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (authenticated users can access their own profile)

## Security

- CSRF protection enabled (requires valid CSRF token)
- Session must be active and valid

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

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
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "emailVerified": true,
  "phone": "+1234567890",
  "mfaEnabled": true,
  "organisation": {
    "id": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
    "slug": "acme-corp",
    "name": "Acme Corporation"
  },
  "roles": [
    {
      "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "name": "Administrator",
      "slug": "admin"
    }
  ],
  "permissions": [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "roles:read",
    "roles:create"
  ]
}
```

### Response Fields

| Field               | Type           | Description                                                    |
| ------------------- | -------------- | -------------------------------------------------------------- |
| `id`                | string         | Unique user identifier                                         |
| `email`             | string         | User's email address                                           |
| `name`              | string         | User's full name                                               |
| `firstName`         | string         | User's first name                                              |
| `lastName`          | string         | User's last name                                               |
| `emailVerified`     | boolean        | Whether the email address has been verified                    |
| `phone`             | string \| null | User's phone number                                            |
| `mfaEnabled`        | boolean        | Whether multi-factor authentication is enabled                 |
| `organisation`      | object         | Organisation details                                           |
| `organisation.id`   | string         | Organisation identifier                                        |
| `organisation.slug` | string         | Organisation URL-friendly slug                                 |
| `organisation.name` | string         | Organisation name                                              |
| `roles`             | array          | List of roles assigned to the user                             |
| `roles[].id`        | string         | Role identifier                                                |
| `roles[].name`      | string         | Role display name                                              |
| `roles[].slug`      | string         | Role slug                                                      |
| `permissions`       | array          | Effective permissions for the user (aggregated from all roles) |

## Error Responses

### 401 Unauthorized

User is not authenticated or session is invalid.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "User not found",
  "instance": "/api/v1/me/profile"
}
```

### 403 Forbidden

CSRF token is missing or invalid.

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Invalid CSRF token",
  "instance": "/api/v1/me/profile"
}
```

## Example Usage

### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/api/v1/me/profile \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/api/v1/me/profile', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

const profile = await response.json();
console.log(profile);
```

### Python (requests)

```python
import requests

response = requests.get(
    'https://api.cerberus-iam.dev/api/v1/me/profile',
    cookies={'cerberus_session': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

profile = response.json()
print(profile)
```

## Notes

- The `permissions` array contains the effective permissions aggregated from all roles assigned to the user
- The `emailVerified` field is derived from the `emailVerifiedAt` timestamp (true if not null)
- The endpoint automatically includes the user's organisation context
- This endpoint is useful for populating user interface elements and determining feature access
