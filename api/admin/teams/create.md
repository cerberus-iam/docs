# Create Team

Create a new team in the organisation.

## Endpoint

```
POST /v1/admin/teams
```

## Authentication

- **Required**: Yes
- **Required Permission**: `teams:create`

## Request Body

```json
{
  "name": "Product",
  "slug": "product",
  "description": "Product management team"
}
```

| Field         | Type   | Required | Description                                                |
| ------------- | ------ | -------- | ---------------------------------------------------------- |
| `name`        | string | Yes      | Team display name (min 1 char)                             |
| `slug`        | string | Yes      | URL-friendly identifier (lowercase, alphanumeric, hyphens) |
| `description` | string | No       | Team description                                           |

## Response (201 Created)

```json
{
  "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v2z",
  "name": "Product",
  "slug": "product",
  "description": "Product management team",
  "members": [],
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

## Errors

- **409 Conflict**: Team slug already exists in the organisation

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/teams \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","slug":"product"}'
```
