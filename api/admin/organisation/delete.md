# Delete Organisation

Delete the current organisation and all associated data.

## Endpoint

```http
DELETE /v1/admin/organisation
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `organisation:delete` or Owner role

## Security

- CSRF protection enabled (requires valid CSRF token)
- Irreversible operation - permanently deletes all organisation data
- Only organisation owners can perform this operation
- Requires confirmation via request body

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Content-Type` | Yes      | Must be `application/json`          |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)         |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Query Parameters

None

### Request Body

```json
{
  "confirmDomain": "acme-corp"
}
```

| Field           | Type   | Required | Description                                        |
| --------------- | ------ | -------- | -------------------------------------------------- |
| `confirmDomain` | string | Yes      | Organisation domain slug for deletion confirmation |

## Response

### Success Response (204 No Content)

No response body. The organisation and all associated data have been deleted.

**Side Effects:**

- Organisation record deleted
- All users in the organisation deleted
- All roles, permissions, and teams deleted
- All OAuth2 clients deleted
- All sessions invalidated
- All audit logs deleted
- All webhooks deleted
- All API keys revoked

### Error Responses

#### 400 Bad Request - Confirmation Mismatch

```json
{
  "type": "https://cerberus-iam.dev/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Confirmation domain does not match organisation domain",
  "errors": [
    {
      "field": "confirmDomain",
      "message": "Must match the organisation domain 'acme-corp'"
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
  "detail": "Missing required permission: organisation:delete"
}
```

## Example

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/organisation \
  -H "Content-Type: application/json" \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..." \
  -d '{
    "confirmDomain": "acme-corp"
  }'
```

## Notes

- **⚠️ WARNING**: This operation is **irreversible** and permanently deletes all organisation data
- The `confirmDomain` field must exactly match the `X-Org-Domain` header value
- All active sessions for users in the organisation are immediately invalidated
- Typically restricted to organisation owners or users with explicit `organisation:delete` permission
- Consider implementing soft-deletion or data export features before allowing this operation in production
- Audit logs for the deletion event may be retained in a separate compliance store if configured
