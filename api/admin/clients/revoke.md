# Revoke OAuth Client

Revoke a client and invalidate all associated tokens.

## Endpoint

```
POST /v1/admin/clients/:id/revoke
```

## Authentication

- **Required**: Yes
- **Required Permission**: `clients:delete`

## Response (200 OK)

```json
{
  "message": "Client revoked successfully"
}
```

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/clients/cli_01h2xz9k3m4n5p6q7r8s9t0v2e/revoke \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

## Delete Client

To permanently delete a client:

```
DELETE /v1/admin/clients/:id
```

Returns `204 No Content` on success.

## Notes

- **Revoke**: Sets `isActive` to false, invalidates tokens, but keeps client record
- **Delete**: Soft-deletes the client (data retained for audit)
- Revoking is reversible (can reactivate), deletion is not
- All active tokens (access, refresh, ID) are immediately invalidated
