# Create OAuth Client

Create a new OAuth 2.0 client application.

## Endpoint

```
POST /v1/admin/clients
```

## Authentication

- **Required**: Yes
- **Required Permission**: `clients:create`

## Request Body

```json
{
  "name": "Web Dashboard",
  "description": "Main web application dashboard",
  "clientType": "confidential",
  "redirectUris": ["https://app.example.com/callback"],
  "allowedOrigins": ["https://app.example.com"],
  "scopes": ["openid", "profile", "email", "offline_access"],
  "requirePkce": false,
  "requireConsent": false,
  "isFirstParty": true,
  "accessTokenLifetime": 3600,
  "refreshTokenLifetime": 2592000,
  "idTokenLifetime": 3600
}
```

| Field                  | Type    | Required | Description                                     |
| ---------------------- | ------- | -------- | ----------------------------------------------- |
| `name`                 | string  | Yes      | Client display name                             |
| `description`          | string  | No       | Client description                              |
| `clientType`           | string  | Yes      | `"confidential"` or `"public"`                  |
| `redirectUris`         | array   | Yes      | Allowed OAuth redirect URIs                     |
| `allowedOrigins`       | array   | No       | CORS allowed origins                            |
| `scopes`               | array   | Yes      | Allowed OAuth scopes                            |
| `requirePkce`          | boolean | No       | Require PKCE (recommended for public clients)   |
| `requireConsent`       | boolean | No       | Require user consent                            |
| `isFirstParty`         | boolean | No       | First-party application (trusted)               |
| `accessTokenLifetime`  | number  | No       | Access token TTL in seconds (default: 3600)     |
| `refreshTokenLifetime` | number  | No       | Refresh token TTL in seconds (default: 2592000) |
| `idTokenLifetime`      | number  | No       | ID token TTL in seconds (default: 3600)         |

## Response (201 Created)

```json
{
  "id": "cli_01h2xz9k3m4n5p6q7r8s9t0v2e",
  "clientId": "cerberus_cli_xyz789",
  "clientSecret": "secret_abc123def456...",
  "name": "Web Dashboard",
  "description": "Main web application dashboard",
  "clientType": "confidential",
  "redirectUris": ["https://app.example.com/callback"],
  "allowedOrigins": ["https://app.example.com"],
  "scopes": ["openid", "profile", "email", "offline_access"],
  "requirePkce": false,
  "requireConsent": false,
  "isFirstParty": true,
  "isActive": true,
  "accessTokenLifetime": 3600,
  "refreshTokenLifetime": 2592000,
  "idTokenLifetime": 3600,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

**Important**: The `clientSecret` is only returned on creation. Store it securely.

## Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/clients \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web Dashboard",
    "clientType": "confidential",
    "redirectUris": ["https://app.example.com/callback"],
    "scopes": ["openid", "profile", "email"]
  }'
```

## Notes

- **Confidential clients**: Server-side apps that can securely store secrets (receive `clientSecret`)
- **Public clients**: Browser/mobile apps that cannot securely store secrets (no `clientSecret`, should use PKCE)
- Store the `clientSecret` immediately - it cannot be retrieved later (only rotated)
