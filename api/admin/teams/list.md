# List Teams

Retrieve a list of all teams in the organisation.

## Endpoint

```
GET /v1/admin/teams
```

## Authentication

- **Required**: Yes
- **Required Permission**: `teams:read`

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)         |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token                          |

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
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..."

## Notes

- Responses are scoped to the organisation identified by `X-Org-Domain`
- Pagination is not yet available; all teams are returned in one payload
```
