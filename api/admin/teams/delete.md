# Delete Team

Delete a team from the organisation.

## Endpoint

```
DELETE /v1/admin/teams/:id
```

## Authentication

- **Required**: Yes
- **Required Permission**: `teams:delete`

## Response (204 No Content)

Empty response on success.

## Example

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/teams/tem_01h2xz9k3m4n5p6q7r8s9t0v2z \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- Team members are not deleted, only the team itself
- Users will lose team membership but retain their roles
