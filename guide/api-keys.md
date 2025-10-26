# API Keys

This guide covers API key creation, usage, rotation, and scoping for server-to-server authentication in Cerberus IAM.

## Overview

API keys provide a simple authentication method for:

- Server-to-server communication
- Backend services
- CI/CD pipelines
- Webhook consumers
- Programmatic API access

**Key Features:**

- Long-lived credentials
- Scope-based permissions
- Prefix for easy identification
- Secure storage with Argon2 hashing
- Usage tracking
- Expiration support

## API Key Format

```
cerb_<prefix>_<random>
```

**Example:**

```
cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7
```

**Components:**

- `cerb_` - System prefix
- `ak_` - Key type (API Key)
- `7x9kp2...` - Random string (32 characters)

## Create API Key

### Request

```typescript
// POST /v1/admin/api-keys
{
  "name": "Production Backend Service",
  "scopes": ["users:read", "users:write", "clients:read"],
  "expiresInDays": 365
}
```

### Response

```json
{
  "apiKey": {
    "id": "key_abc123",
    "organisationId": "org_xyz789",
    "name": "Production Backend Service",
    "keyPrefix": "cerb_ak_7x9kp2",
    "scopes": ["users:read", "users:write", "clients:read"],
    "expiresAt": "2025-01-15T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastUsedAt": null,
    "revokedAt": null
  },
  "key": "cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7"
}
```

**Important:** The full `key` is only shown once. Store it securely!

### Implementation

```typescript
import { apiKeyService } from '@/services/apikey.service';

const { apiKey, key } = await apiKeyService.create(organisationId, {
  name: 'Production Backend Service',
  scopes: ['users:read', 'users:write'],
  expiresInDays: 365,
});

// Store 'key' securely - it won't be shown again
console.log('API Key:', key);
```

## Using API Keys

### Authentication Header

```http
GET /v1/admin/users HTTP/1.1
Host: api.cerberus.local
Authorization: Bearer cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7
X-Org-Slug: acme
```

### Code Example (JavaScript)

```javascript
const response = await fetch('https://api.cerberus.local/v1/admin/users', {
  headers: {
    Authorization: 'Bearer cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7',
    'X-Org-Slug': 'acme',
    'Content-Type': 'application/json',
  },
});

const users = await response.json();
```

### Code Example (Python)

```python
import requests

headers = {
    'Authorization': 'Bearer cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7',
    'X-Org-Slug': 'acme',
}

response = requests.get(
    'https://api.cerberus.local/v1/admin/users',
    headers=headers
)

users = response.json()
```

### Code Example (cURL)

```bash
curl -X GET https://api.cerberus.local/v1/admin/users \
  -H "Authorization: Bearer cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7" \
  -H "X-Org-Slug: acme"
```

## API Key Middleware

### Route Protection

```typescript
import { authenticateApiKey } from '@/middleware/apikey';

// Protect route with API key authentication
router.post('/webhooks/incoming', authenticateApiKey, async (req, res) => {
  // req.user contains API key context
  // req.tenant contains organization
  // req.apiKeyScopes contains scopes

  console.log(req.apiKeyScopes); // ['users:read', 'users:write']

  res.json({ received: true });
});
```

### How It Works

```typescript
export async function authenticateApiKey(req, res, next) {
  // Extract Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized('Missing or invalid API key');
  }

  const key = authHeader.substring(7);

  // Verify key
  const apiKey = await apiKeyService.verify(key);

  if (!apiKey) {
    return unauthorized('Invalid or expired API key');
  }

  // Attach context to request
  req.user = {
    id: 'api-key',
    organisationId: apiKey.organisationId,
  };

  req.tenant = {
    id: apiKey.organisationId,
    slug: '',
    organisation: null,
  };

  req.apiKeyScopes = apiKey.scopes;

  next();
}
```

## Scope Management

### Available Scopes

API keys use the same permission system as users:

```typescript
// Read scopes
'users:read';
'clients:read';
'roles:read';
'audit_logs:read';

// Write scopes
'users:write';
'clients:write';
'roles:write';

// Delete scopes
'users:delete';
'clients:delete';

// Wildcards
'users:*'; // All user operations
'*'; // All operations (not recommended)
```

### Scope Enforcement

```typescript
// Check if API key has required scope
if (!req.apiKeyScopes?.includes('users:write')) {
  return forbidden('API key lacks required scope: users:write');
}
```

### Least Privilege

Grant minimum scopes needed:

```typescript
// Bad: Too broad
{
  "scopes": ["*"]
}

// Good: Specific scopes
{
  "scopes": ["users:read", "audit_logs:read"]
}

// Better: Single purpose
{
  "scopes": ["webhooks:write"]
}
```

## List API Keys

### Request

```typescript
// GET /v1/admin/api-keys
```

### Response

```json
{
  "data": [
    {
      "id": "key_abc123",
      "name": "Production Backend Service",
      "keyPrefix": "cerb_ak_7x9kp2",
      "scopes": ["users:read", "users:write"],
      "expiresAt": "2025-01-15T00:00:00Z",
      "lastUsedAt": "2024-01-14T15:30:00Z",
      "revokedAt": null,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "key_def456",
      "name": "CI/CD Pipeline",
      "keyPrefix": "cerb_ak_m2p5r8",
      "scopes": ["clients:read"],
      "expiresAt": null,
      "lastUsedAt": "2024-01-14T12:00:00Z",
      "revokedAt": null,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Note:** Full keys are never returned after creation.

## Revoke API Key

### Request

```typescript
// DELETE /v1/admin/api-keys/:id
```

### Response

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

### Implementation

```typescript
await apiKeyService.revoke(keyId);
```

**Effects:**

- Sets `revokedAt` timestamp
- All future requests with this key will fail
- Cannot be un-revoked (create new key instead)

## Security & Storage

### Hashing Algorithm

API keys are hashed with **Argon2id** (same as passwords):

```typescript
import { hashPassword } from '@/utils/crypto';

const keyHash = await hashPassword(apiKey);
// Stored in database
```

**Storage:**

- Full key: Shown once at creation
- Prefix: Stored plaintext for lookup
- Hash: Stored for verification

### Verification Process

```typescript
import { verifyPassword } from '@/utils/crypto';

// 1. Extract prefix from key
const prefix = extractKeyPrefix(key);

// 2. Lookup by prefix
const apiKey = await prisma.apiKey.findFirst({
  where: { keyPrefix: prefix },
});

// 3. Verify hash
const valid = await verifyPassword(apiKey.keyHash, key);

// 4. Check expiration and revocation
if (apiKey.revokedAt || (apiKey.expiresAt && apiKey.expiresAt < now)) {
  return null;
}

// 5. Update lastUsedAt
await prisma.apiKey.update({
  where: { id: apiKey.id },
  data: { lastUsedAt: new Date() },
});
```

### Secure Storage Best Practices

**Environment Variables:**

```bash
# .env (never commit!)
CERBERUS_API_KEY=cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7
```

**Secret Managers:**

```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id cerberus/api-key \
  --query SecretString \
  --output text

# GitHub Secrets (CI/CD)
${{ secrets.CERBERUS_API_KEY }}

# Kubernetes Secrets
kubectl create secret generic cerberus-api-key \
  --from-literal=key=cerb_ak_7x9kp2m5n8q1r4t6v9y2z5c8f1h4j7
```

## Rotation Strategy

### When to Rotate

- Regularly (e.g., every 90-365 days)
- After security incident
- When employee leaves
- If key is compromised
- After major version upgrade

### Rotation Process

1. **Create new key:**

   ```typescript
   const { apiKey: newKey, key } = await apiKeyService.create(orgId, {
     name: 'Production Backend Service (Rotated)',
     scopes: oldKey.scopes,
     expiresInDays: 365,
   });
   ```

2. **Deploy new key to services:**

   ```bash
   # Update environment variable
   export CERBERUS_API_KEY=new_key_here

   # Restart services
   kubectl rollout restart deployment/backend-service
   ```

3. **Verify new key works:**

   ```bash
   curl -H "Authorization: Bearer $CERBERUS_API_KEY" \
     https://api.cerberus.local/v1/admin/users
   ```

4. **Revoke old key:**

   ```typescript
   await apiKeyService.revoke(oldKeyId);
   ```

5. **Monitor for errors:**
   - Check application logs
   - Monitor error rates
   - Verify no services using old key

### Zero-Downtime Rotation

```typescript
// 1. Create new key (keep old key active)
const newKey = await createApiKey();

// 2. Deploy new key to 50% of services
await deployToCanary(newKey);

// 3. Monitor for issues
await sleep(3600000); // 1 hour

// 4. Deploy to remaining services
await deployToAll(newKey);

// 5. Wait for old key usage to drop to zero
await waitForZeroUsage(oldKey);

// 6. Revoke old key
await revokeApiKey(oldKey);
```

## Expiration

### Set Expiration

```typescript
// Expires in 90 days
{
  "expiresInDays": 90
}

// No expiration (not recommended)
{
  "expiresInDays": null
}
```

### Check Expiration

```typescript
const apiKey = await prisma.apiKey.findUnique({
  where: { id: keyId },
});

if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
  console.log('API key has expired');
}
```

### Expiration Notifications

(Coming soon: Email notifications before expiration)

## Usage Tracking

### Last Used Timestamp

Track when key was last used:

```typescript
{
  "lastUsedAt": "2024-01-14T15:30:00Z"
}
```

**Use Cases:**

- Identify unused keys for cleanup
- Detect unexpected usage
- Audit key usage patterns

### Usage Analytics

Query recent key usage:

```typescript
// Find unused keys (30 days)
const unusedKeys = await prisma.apiKey.findMany({
  where: {
    organisationId: orgId,
    OR: [{ lastUsedAt: { lt: thirtyDaysAgo } }, { lastUsedAt: null }],
    revokedAt: null,
  },
});
```

## Best Practices

### 1. One Key Per Service

```typescript
// Bad: Sharing key across services
SHARED_API_KEY = cerb_ak_abc123;

// Good: Unique key per service
BACKEND_API_KEY = cerb_ak_abc123;
WORKER_API_KEY = cerb_ak_def456;
CI_API_KEY = cerb_ak_ghi789;
```

### 2. Descriptive Names

```typescript
// Bad
{ "name": "Key 1" }

// Good
{ "name": "Production Backend Service - User Sync" }
{ "name": "CI/CD - Integration Tests" }
{ "name": "Data Pipeline - Analytics Export" }
```

### 3. Minimal Scopes

```typescript
// Bad: Overly broad
{ "scopes": ["*"] }

// Good: Purpose-specific
{ "scopes": ["users:read"] }  // Read-only analytics
{ "scopes": ["webhooks:write"] }  // Webhook consumer
```

### 4. Set Expiration

```typescript
// Recommended expiration periods
{
  "expiresInDays": 90    // Short-term/testing
  "expiresInDays": 365   // Production services
}
```

### 5. Monitor Usage

- Review `lastUsedAt` regularly
- Revoke unused keys
- Alert on suspicious patterns
- Audit scope usage

## Troubleshooting

### Invalid API Key

**Error:** "Invalid or expired API key"

**Solutions:**

1. Verify key format (starts with `cerb_ak_`)
2. Check key not revoked
3. Check expiration date
4. Verify key belongs to correct organization

### Insufficient Permissions

**Error:** "API key lacks required scope"

**Solutions:**

1. Check `scopes` field on API key
2. Update scopes if needed (requires new key)
3. Verify route requires correct scope

### Key Not Working After Creation

**Problem:** Newly created key fails authentication

**Solutions:**

1. Verify copying full key (including prefix)
2. Check no whitespace in key
3. Test with cURL to isolate issue
4. Verify `Authorization` header format

## Next Steps

- [Authentication](/guide/authentication) - Other auth methods
- [Authorization](/guide/authorization) - Permission system
- [Webhooks](/guide/webhooks) - Securing webhooks with API keys
