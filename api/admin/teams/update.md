# Update Team

Update an existing team's properties.

## Endpoint

```
PATCH /v1/admin/teams/:id
```

## Authentication

- **Required**: Yes
- **Required Permission**: `teams:update`

## Request Body (all optional)

```json
{
  "name": "Product & Design",
  "description": "Updated team description"
}
```

**Note**: The `slug` field cannot be updated after creation.

## Response (200 OK)

```json
{
  "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v2z",
  "name": "Product & Design",
  "slug": "product",
  "description": "Updated team description",
  "members": [],
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:15:00.000Z"
}
```

## Example

```bash
curl -X PATCH https://api.cerberus-iam.dev/v1/admin/teams/tem_01h2xz9k3m4n5p6q7r8s9t0v2z \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Product & Design"}'
```
