# Update OAuth Client

Update an existing OAuth client's configuration.

## Endpoint

```
PATCH /v1/admin/clients/:id
```

## Authentication

- **Required**: Yes
- **Required Permission**: `clients:update`

## Request Body (all optional)

```json
{
  "name": "Updated Dashboard",
  "description": "Updated description",
  "redirectUris": ["https://app.example.com/callback", "https://app.example.com/callback2"],
  "allowedOrigins": ["https://app.example.com"],
  "scopes": ["openid", "profile", "email", "offline_access"],
  "requireConsent": true,
  "isActive": true,
  "accessTokenLifetime": 7200,
  "refreshTokenLifetime": 2592000,
  "idTokenLifetime": 3600
}
```

**Note**: `clientType` and `requirePkce` cannot be changed after creation.

## Response (200 OK)

Returns the updated client object (without `clientSecret`).

## Example

```bash
curl -X PATCH https://api.cerberus-iam.dev/v1/admin/clients/cli_01h2xz9k3m4n5p6q7r8s9t0v2e \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Dashboard"}'
```

## Additional Endpoints

### Rotate Client Secret

```
POST /v1/admin/clients/:id/rotate-secret
```

Generates a new `clientSecret` (confidential clients only). Returns the new secret.

### Revoke Client

```
POST /v1/admin/clients/:id/revoke
```

Revokes all tokens and sets `isActive` to false.

## Notes

- Use `isActive: false` to temporarily disable a client
- Use rotate-secret regularly for security best practices
- Revoking a client invalidates all its tokens immediately
