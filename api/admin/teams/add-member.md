# Add Member to Team

Add a user to a team.

## Endpoint

```http
POST /v1/admin/teams/:teamId/members
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `teams:write`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (team and user must belong to the authenticated organisation)
- Requires admin-level permissions

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Content-Type` | Yes      | Must be `application/json`          |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)         |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `teamId`  | string | Yes      | Unique team identifier |

### Query Parameters

None

### Request Body

```json
{
  "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

| Field    | Type   | Required | Description            |
| -------- | ------ | -------- | ---------------------- |
| `userId` | string | Yes      | Unique user identifier |

## Response

### Success Response (201 Created)

```json
{
  "message": "User added to team successfully",
  "teamId": "team_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
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
      "field": "userId",
      "message": "User ID is required"
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
  "detail": "Missing required permission: teams:write"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Team or user not found"
}
```

#### 409 Conflict - Already Member

```json
{
  "type": "https://cerberus-iam.dev/problems/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "User is already a member of this team"
}
```

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/teams/team_01h2xz9k3m4n5p6q7r8s9t0v1w/members \
  -H "Content-Type: application/json" \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..." \
  -d '{
    "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
  }'
```

## Notes

- Both team and user must exist and belong to the same organisation
- If the user is already a member of the team, a 409 Conflict is returned
- Team membership changes take effect immediately
- Use `GET /v1/admin/teams/:teamId` to view all members of a team
- Team membership can be used for organisational structure and access control policies
