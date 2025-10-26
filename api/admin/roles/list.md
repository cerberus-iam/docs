# List Roles

Retrieve a list of all roles in the organisation.

## Endpoint

```
GET /v1/admin/roles
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:read`

## Request

### Headers

| Header         | Required | Description    |
| -------------- | -------- | -------------- |
| `Cookie`       | Yes      | Session cookie |
| `X-CSRF-Token` | Yes      | CSRF token     |

## Response (200 OK)

```json
{
  "data": [
    {
      "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "name": "Administrator",
      "slug": "admin",
      "description": "Full system access",
      "isDefault": false,
      "permissions": [
        {
          "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v1z",
          "slug": "users:read",
          "name": "Read Users"
        }
      ],
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-10-26T11:45:00.000Z"
    }
  ],
  "total": 1
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/roles \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```
