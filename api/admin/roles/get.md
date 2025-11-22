# Get Role

Retrieve details of a specific role by ID.

## Endpoint

```http
GET /v1/admin/roles/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only roles from the authenticated user's organisation)
- Requires admin-level permissions

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)         |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `id`      | string | Yes      | Unique role identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "id": "role_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "name": "Admin",
  "description": "Full administrative access",
  "isSystemRole": true,
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "permissions": [
    {
      "id": "perm_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "action": "users:write",
      "resource": "*",
      "description": "Manage users"
    },
    {
      "id": "perm_01h2xz9k3m4n5p6q7r8s9t0v2x",
      "action": "roles:write",
      "resource": "*",
      "description": "Manage roles"
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
  "detail": "Missing required permission: roles:read"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Role not found"
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/roles/role_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- Response includes all permissions assigned to the role
- System roles (`isSystemRole: true`) cannot be deleted
- Results are scoped to the authenticated organisation (`X-Org-Domain`)
