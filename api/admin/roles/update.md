# Update Role

Update an existing role's properties.

## Endpoint

```
PATCH /v1/admin/roles/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:update`

## Request

### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | Role identifier |

### Body (all fields optional)

```json
{
  "name": "Senior Developer",
  "description": "Updated description",
  "isDefault": true
}
```

| Field         | Type    | Description         |
| ------------- | ------- | ------------------- |
| `name`        | string  | Role display name   |
| `description` | string  | Role description    |
| `isDefault`   | boolean | Default role status |

**Note**: The `slug` field cannot be updated after creation.

## Response (200 OK)

```json
{
  "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v2y",
  "name": "Senior Developer",
  "slug": "developer",
  "description": "Updated description",
  "isDefault": true,
  "permissions": [],
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:15:00.000Z"
}
```

## Errors

- **404 Not Found**: Role doesn't exist or not in same organisation

## Example

```bash
curl -X PATCH https://api.cerberus-iam.dev/v1/admin/roles/rol_01h2xz9k3m4n5p6q7r8s9t0v2y \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Senior Developer"}'
```
