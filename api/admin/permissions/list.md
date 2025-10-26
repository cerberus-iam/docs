# List Permissions

Retrieve a list of all available permissions in the system.

## Endpoint

```
GET /v1/admin/permissions
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:read`

## Security

- CSRF protection enabled
- Returns system-wide permissions (not organisation-specific)

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Query Parameters

None

## Response

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "slug": "users:read",
      "name": "Read Users",
      "description": "View user information and profiles",
      "category": "users",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v2a",
      "slug": "users:create",
      "name": "Create Users",
      "description": "Create new user accounts",
      "category": "users",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v2b",
      "slug": "users:update",
      "name": "Update Users",
      "description": "Modify existing user accounts",
      "category": "users",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v2c",
      "slug": "users:delete",
      "name": "Delete Users",
      "description": "Remove user accounts",
      "category": "users",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v2d",
      "slug": "roles:read",
      "name": "Read Roles",
      "description": "View role information",
      "category": "roles",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 5
}
```

### Response Fields

| Field                | Type   | Description                               |
| -------------------- | ------ | ----------------------------------------- |
| `data`               | array  | Array of permission objects               |
| `total`              | number | Total count of permissions                |
| `data[].id`          | string | Unique permission identifier              |
| `data[].slug`        | string | Permission slug (e.g., `users:read`)      |
| `data[].name`        | string | Human-readable permission name            |
| `data[].description` | string | Description of what the permission allows |
| `data[].category`    | string | Permission category for grouping          |
| `data[].createdAt`   | string | ISO 8601 timestamp of creation            |
| `data[].updatedAt`   | string | ISO 8601 timestamp of last update         |

## Error Responses

### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/permissions"
}
```

### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:read",
  "instance": "/v1/admin/permissions"
}
```

## Example Usage

### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/permissions \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/admin/permissions', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

const { data: permissions, total } = await response.json();
console.log(`Found ${total} permissions`);

// Group by category
const byCategory = permissions.reduce((acc, perm) => {
  if (!acc[perm.category]) acc[perm.category] = [];
  acc[perm.category].push(perm);
  return acc;
}, {});
```

### Python (requests)

```python
import requests

response = requests.get(
    'https://api.cerberus-iam.dev/v1/admin/permissions',
    cookies={'cerberus_session': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

permissions_data = response.json()
print(f"Total permissions: {permissions_data['total']}")

# Group by category
from collections import defaultdict
by_category = defaultdict(list)
for perm in permissions_data['data']:
    by_category[perm['category']].append(perm['slug'])

for category, perms in by_category.items():
    print(f"{category}: {', '.join(perms)}")
```

## Notes

- Permissions are system-wide and not organisation-specific
- Permissions are ordered alphabetically by slug
- This is a read-only endpoint - permissions cannot be created or modified via the API
- Permission categories include: `users`, `roles`, `teams`, `clients`, `webhooks`, `api_keys`, `invitations`, `audit`, `organisation`
- Common permission naming pattern: `resource:action` (e.g., `users:read`, `roles:create`)
- Permissions are typically assigned to roles, which are then assigned to users
- The `users:read` permission is required to view this list (bootstrapping permission)
