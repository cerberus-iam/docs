# Get Team

Retrieve details of a specific team by ID.

## Endpoint

```http
GET /v1/admin/teams/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `teams:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only teams from the authenticated user's organisation)
- Requires admin-level permissions

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `id`      | string | Yes      | Unique team identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "id": "team_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "name": "Engineering",
  "description": "Product engineering team",
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "members": [
    {
      "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v2x",
      "email": "jane.smith@example.com",
      "name": "Jane Smith",
      "joinedAt": "2024-01-16T11:45:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: teams:read"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Team not found"
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/teams/team_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- Response includes all members of the team
- Results are scoped to the authenticated organisation (`X-Org-Domain`)
- Team membership can be managed via separate endpoints (POST/DELETE team members)
