# API Keys Management

Manage API keys for programmatic access to Cerberus IAM.

## Endpoints

- [List API Keys](#list-api-keys)
- [Get API Key](#get-api-key)
- [Create API Key](#create-api-key)
- [Revoke API Key](#revoke-api-key)

---

## List API Keys

Retrieve all API keys in the organisation.

### Endpoint

```
GET /v1/admin/api-keys
```

### Authentication

- **Required**: Yes
- **Required Permission**: `api_keys:read`

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "key_01h2xz9k3m4n5p6q7r8s9t0v2f",
      "name": "CI/CD Pipeline",
      "prefix": "ck_live_abc123",
      "scopes": ["users:read", "roles:read"],
      "lastUsedAt": "2025-10-26T08:00:00.000Z",
      "expiresAt": "2026-10-26T00:00:00.000Z",
      "revokedAt": null,
      "createdAt": "2025-10-26T00:00:00.000Z",
      "updatedAt": "2025-10-26T08:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Note**: The full API key is never returned after creation. Only the prefix is shown.

### Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/api-keys \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

---

## Get API Key

Retrieve details of a specific API key.

### Endpoint

```
GET /v1/admin/api-keys/:id
```

### Authentication

- **Required**: Yes
- **Required Permission**: `api_keys:read`

### Response (200 OK)

Returns a single API key object (same structure as list items).

### Example

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/api-keys/key_01h2xz9k3m4n5p6q7r8s9t0v2f \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

---

## Create API Key

Generate a new API key for programmatic access.

### Endpoint

```
POST /v1/admin/api-keys
```

### Authentication

- **Required**: Yes
- **Required Permission**: `api_keys:create`

### Request Body

```json
{
  "name": "Production Server",
  "scopes": ["users:read", "users:create", "roles:read"],
  "expiresInDays": 365
}
```

| Field           | Type   | Required | Description                              |
| --------------- | ------ | -------- | ---------------------------------------- |
| `name`          | string | Yes      | Descriptive name for the API key         |
| `scopes`        | array  | Yes      | Array of permission scopes               |
| `expiresInDays` | number | No       | Days until expiration (positive integer) |

### Response (201 Created)

```json
{
  "id": "key_01h2xz9k3m4n5p6q7r8s9t0v2g",
  "name": "Production Server",
  "prefix": "ck_live_xyz789",
  "key": "ck_live_xyz789_abcdef123456...",
  "scopes": ["users:read", "users:create", "roles:read"],
  "lastUsedAt": null,
  "expiresAt": "2026-10-26T00:00:00.000Z",
  "revokedAt": null,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z",
  "warning": "Save this key securely. It will not be shown again."
}
```

**Important**: The full `key` is only returned on creation. Store it securely.

### Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/api-keys \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "scopes": ["users:read", "roles:read"],
    "expiresInDays": 365
  }'
```

---

## Revoke API Key

Revoke an API key, immediately invalidating it.

### Endpoint

```
POST /v1/admin/api-keys/:id/revoke
```

### Authentication

- **Required**: Yes
- **Required Permission**: `api_keys:revoke`

### Response (200 OK)

```json
{
  "message": "API key revoked successfully"
}
```

### Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/api-keys/key_01h2xz9k3m4n5p6q7r8s9t0v2g/revoke \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

## Using API Keys

### Authentication

Include the API key in the `Authorization` header:

```bash
curl -X GET https://api.cerberus-iam.dev/v1/admin/users \
  -H "Authorization: Bearer ck_live_xyz789_abcdef123456..."
```

### Key Format

- **Prefix**: `ck_live_` or `ck_test_`
- **Structure**: `{prefix}_{random_string}`
- Keys are hashed before storage (SHA-256)

## Notes

- API keys provide programmatic access without session cookies
- Scopes limit what the API key can access (principle of least privilege)
- Keys cannot be retrieved after creation (only prefix is shown)
- Revoked keys are immediately invalidated
- Expired keys are automatically rejected
- The `lastUsedAt` timestamp is updated on each successful request
- Monitor `lastUsedAt` to identify unused keys for cleanup
- Rotate API keys regularly for security
- Store keys in secure secret management systems (e.g., AWS Secrets Manager, HashiCorp Vault)
