# Organisation Management

Retrieve and update organisation settings.

## Endpoints

- [Get Organisation](#get-organisation)
- [Update Organisation](#update-organisation)
- [Delete Organisation](#delete-organisation)

---

## Get Organisation

Retrieve the current user's organisation details.

### Endpoint

```
GET /v1/admin/organisation
```

### Authentication

- **Required**: Yes
- **Required Permission**: None (all authenticated users can view their organisation)

### Response (200 OK)

```json
{
  "id": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
  "slug": "acme-corp",
  "name": "Acme Corporation",
  "email": "contact@acme-corp.com",
  "phone": "+1234567890",
  "website": "https://acme-corp.com",
  "ownerId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "allowedCallbackUrls": ["https://app.acme-corp.com/callback"],
  "allowedLogoutUrls": ["https://app.acme-corp.com/logout"],
  "allowedOrigins": ["https://app.acme-corp.com"],
  "sessionLifetime": 604800,
  "sessionIdleTimeout": 86400,
  "requireMfa": false,
  "allowedMfaMethods": ["totp", "sms"],
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSymbols": true
  },
  "tokenLifetimePolicy": {
    "accessToken": 3600,
    "refreshToken": 2592000,
    "idToken": 3600
  },
  "branding": {
    "logoUrl": "https://cdn.acme-corp.com/logo.png",
    "primaryColor": "#007bff"
  },
  "metadata": {},
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z"
}
```

### Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/organisation \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

---

## Update Organisation

Update organisation settings.

### Endpoint

```
PATCH /v1/admin/organisation
```

### Authentication

- **Required**: Yes
- **Required Permission**: `organisation:update`

### Request Body (all optional)

```json
{
  "name": "Acme Corporation Inc.",
  "email": "support@acme-corp.com",
  "phone": "+1234567890",
  "website": "https://acme-corp.com",
  "allowedCallbackUrls": ["https://app.acme-corp.com/callback"],
  "allowedLogoutUrls": ["https://app.acme-corp.com/logout"],
  "allowedOrigins": ["https://app.acme-corp.com"],
  "sessionLifetime": 604800,
  "sessionIdleTimeout": 86400,
  "requireMfa": true,
  "allowedMfaMethods": ["totp"],
  "passwordPolicy": {
    "minLength": 12,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSymbols": true
  },
  "tokenLifetimePolicy": {
    "accessToken": 1800,
    "refreshToken": 1296000
  },
  "branding": {
    "logoUrl": "https://cdn.acme-corp.com/logo.png",
    "primaryColor": "#007bff"
  },
  "metadata": {
    "industry": "technology"
  }
}
```

| Field                 | Type    | Description                        |
| --------------------- | ------- | ---------------------------------- |
| `name`                | string  | Organisation name                  |
| `email`               | string  | Contact email (valid email format) |
| `phone`               | string  | Contact phone number               |
| `website`             | string  | Website URL (valid URL format)     |
| `allowedCallbackUrls` | array   | OAuth callback URLs (valid URLs)   |
| `allowedLogoutUrls`   | array   | Allowed logout redirect URLs       |
| `allowedOrigins`      | array   | CORS allowed origins               |
| `sessionLifetime`     | number  | Session lifetime in seconds        |
| `sessionIdleTimeout`  | number  | Idle timeout in seconds            |
| `requireMfa`          | boolean | Require MFA for all users          |
| `allowedMfaMethods`   | array   | Allowed MFA methods                |
| `passwordPolicy`      | object  | Password requirements              |
| `tokenLifetimePolicy` | object  | Token expiration settings          |
| `branding`            | object  | UI branding configuration          |
| `metadata`            | object  | Custom metadata                    |

### Response (200 OK)

Returns the updated organisation object.

### Example

```bash
curl -X PATCH https://api.cerberus-iam.dev/v1/admin/organisation \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corporation Inc.","requireMfa":true}'
```

---

## Delete Organisation

Soft-delete the organisation (owner only).

### Endpoint

```
DELETE /v1/admin/organisation
```

### Authentication

- **Required**: Yes
- **Required Permission**: `organisation:delete`
- **Additional Requirement**: Must be the organisation owner

### Response (204 No Content)

Empty response on success.

### Error Responses

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the organisation owner can delete the organisation",
  "instance": "/v1/admin/organisation"
}
```

### Example

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/organisation \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

## Notes

- The `slug` field cannot be changed after creation
- Updating `requireMfa` to true will enforce MFA for all users on next login
- The `passwordPolicy` applies to new passwords only (existing passwords are not retroactively validated)
- `sessionLifetime` and `sessionIdleTimeout` affect new sessions only
- Organisation deletion is a soft delete - data is retained for audit purposes
- Only the organisation owner can delete the organisation
- Deleting an organisation marks all associated data as deleted
