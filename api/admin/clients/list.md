# List OAuth Clients

Retrieve a list of all OAuth 2.0 clients in the organisation.

## Endpoint

```
GET /v1/admin/clients
```

## Authentication

- **Required**: Yes
- **Required Permission**: `clients:read`

## Response (200 OK)

```json
{
  "data": [
    {
      "id": "cli_01h2xz9k3m4n5p6q7r8s9t0v2d",
      "clientId": "cerberus_cli_abc123",
      "name": "Mobile App",
      "description": "iOS and Android mobile applications",
      "clientType": "public",
      "redirectUris": ["myapp://callback"],
      "allowedOrigins": ["https://myapp.com"],
      "scopes": ["openid", "profile", "email"],
      "requirePkce": true,
      "requireConsent": false,
      "isFirstParty": true,
      "isActive": true,
      "accessTokenLifetime": 3600,
      "refreshTokenLifetime": 2592000,
      "idTokenLifetime": 3600,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-10-26T11:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Note**: `clientSecret` is never exposed in list or get responses.

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/clients \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```
