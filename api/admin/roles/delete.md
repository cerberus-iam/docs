# Delete Role

Delete a role from the organisation.

## Endpoint

```
DELETE /v1/admin/roles/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `roles:delete`

## Request

### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | Role identifier |

## Response (204 No Content)

Empty response body on successful deletion.

## Errors

- **400 Bad Request**: Cannot delete the owner role
- **404 Not Found**: Role doesn't exist or not in same organisation

## Example

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/roles/rol_01h2xz9k3m4n5p6q7r8s9t0v2y \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- The `owner` role cannot be deleted (system protection)
- Users assigned to the deleted role will lose those permissions
- Consider reassigning users before deleting roles
