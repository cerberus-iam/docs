# Create Role

Create a new role in the organisation.

## Endpoint

```
POST /v1/admin/roles
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:create`

## Request

### Headers

| Header         | Required | Description        |
| -------------- | -------- | ------------------ |
| `Cookie`       | Yes      | Session cookie     |
| `X-CSRF-Token` | Yes      | CSRF token         |
| `Content-Type` | Yes      | `application/json` |

### Body

```json
{
  "name": "Developer",
  "slug": "developer",
  "description": "Developer role with code access",
  "isDefault": false,
  "permissionIds": ["prm_01h2xz9k3m4n5p6q7r8s9t0v1z"]
}
```

| Field           | Type    | Required | Description                                                |
| --------------- | ------- | -------- | ---------------------------------------------------------- |
| `name`          | string  | Yes      | Role display name (min 1 char)                             |
| `slug`          | string  | Yes      | URL-friendly identifier (lowercase, alphanumeric, hyphens) |
| `description`   | string  | No       | Role description                                           |
| `isDefault`     | boolean | No       | Whether this is the default role for new users             |
| `permissionIds` | array   | No       | Permission IDs to assign                                   |

## Response (201 Created)

```json
{
  "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v2y",
  "name": "Developer",
  "slug": "developer",
  "description": "Developer role with code access",
  "isDefault": false,
  "permissions": [
    {
      "id": "prm_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "slug": "users:read",
      "name": "Read Users"
    }
  ],
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

## Errors

- **409 Conflict**: Role slug already exists in the organisation

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/roles \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Developer","slug":"developer"}'
```
