# Get OAuth2 Client

Retrieve details of a specific OAuth2 client by ID.

## Endpoint

```http
GET /v1/admin/clients/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `oauth2:clients:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only clients from the authenticated user's organisation)
- Requires admin-level permissions
- Client secret is never returned in responses

## Request

### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-Org-Domain` | Yes      | Organisation slug for tenancy scope |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |

### Path Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `id`      | string | Yes      | Unique client identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "id": "client_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "clientId": "my_app_prod",
  "name": "My Application",
  "clientType": "confidential",
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "redirectUris": ["https://myapp.example.com/callback"],
  "allowedOrigins": ["https://myapp.example.com"],
  "grantTypes": ["authorization_code", "refresh_token"],
  "scopes": ["openid", "profile", "email"],
  "tokenEndpointAuthMethod": "client_secret_post",
  "pkceRequired": true,
  "accessTokenLifetime": 3600,
  "refreshTokenLifetime": 2592000,
  "refreshTokenRotation": "rotating",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

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
  "detail": "Missing required permission: oauth2:clients:read"
}
```

#### 404 Not Found

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "OAuth2 client not found"
}
```

## Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/clients/client_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-Org-Domain: acme-corp" \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- Client secret is **never** included in the response (security best practice)
- Results are scoped to the authenticated organisation (`X-Org-Domain`)
- Use POST `/v1/admin/clients/:id/regenerate-secret` to generate a new client secret
- `clientType` values: `public` (no secret, PKCE required) or `confidential` (has secret)
- Token lifetimes are in seconds
