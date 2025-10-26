# List Teams

Retrieve a list of all teams in the organisation.

## Endpoint

```
GET /v1/admin/teams
```

## Authentication

- **Required**: Yes
- **Required Permission**: `teams:read`

## Response (200 OK)

```json
{
  "data": [
    {
      "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "name": "Engineering",
      "slug": "engineering",
      "description": "Engineering team members",
      "members": [
        {
          "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
          "email": "john.doe@example.com",
          "name": "John Doe"
        }
      ],
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-10-26T11:45:00.000Z"
    }
  ],
  "total": 1
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/teams \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```
