# Get Permission

Retrieve details of a specific permission by ID.

## Endpoint

```http
GET /v1/admin/permissions/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `permissions:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only permissions from the authenticated user's organisation)
- Requires admin-level permissions

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)         |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `id`      | string | Yes      | Unique permission identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "id": "perm_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "action": "users:write",
  "resource": "*",
  "description": "Create, update, and delete users",
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "isSystemPermission": true,
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
  "detail": "Missing required permission: permissions:read"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Permission not found"
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/permissions/perm_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- System permissions (`isSystemPermission: true`) are predefined and cannot be deleted
- Results are scoped to the authenticated organisation (`X-Org-Domain`)
- The `action` field follows the pattern `resource:action` (e.g., `users:write`, `roles:read`)
- The `resource` field supports wildcards (`*`) for broad permissions
