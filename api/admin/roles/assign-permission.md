# Assign Permission to Role

Assign a permission to a role.

## Endpoint

```http
POST /v1/admin/roles/:roleId/permissions
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:write`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (role and permission must belong to the authenticated organisation)
- Requires admin-level permissions
- System roles can still be modified unless explicitly prevented in business logic

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Content-Type` | Yes      | Must be `application/json`          |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `roleId`  | string | Yes      | Unique role identifier |

### Query Parameters

None

### Request Body

```json
{
  "permissionId": "perm_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

| Field          | Type   | Required | Description                  |
| -------------- | ------ | -------- | ---------------------------- |
| `permissionId` | string | Yes      | Unique permission identifier |

## Response

### Success Response (201 Created)

```json
{
  "message": "Permission assigned to role successfully",
  "roleId": "role_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "permissionId": "perm_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### Error Responses

#### 400 Bad Request - Invalid Request

```json
{
  "type": "https://cerberus-iam.dev/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid request body",
  "errors": [
    {
      "field": "permissionId",
      "message": "Permission ID is required"
    }
  ]
}
```

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
  "detail": "Missing required permission: roles:write"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Role or permission not found"
}
```

#### 409 Conflict - Already Assigned

```json
{
  "type": "https://cerberus-iam.dev/problems/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Permission is already assigned to this role"
}
```

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/roles/role_01h2xz9k3m4n5p6q7r8s9t0v1w/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..." \
  -d '{
    "permissionId": "perm_01h2xz9k3m4n5p6q7r8s9t0v1w"
  }'
```

## Notes

- Both role and permission must exist and belong to the same organisation
- If the permission is already assigned to the role, a 409 Conflict is returned
- Changes to role permissions take effect immediately for new sessions
- Existing user sessions may need to be refreshed to pick up new permissions
- Use `GET /v1/admin/roles/:roleId` to view all permissions assigned to a role
