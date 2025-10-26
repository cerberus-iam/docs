# JSON Web Key Set (JWKS)

Get public keys for token verification.

## Endpoint

```
GET /oauth2/jwks.json
```

## Description

Returns the JSON Web Key Set (JWKS) containing the public keys used to verify JWT access tokens. Clients and resource servers should use these keys to validate token signatures.

This endpoint follows the [RFC 7517: JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517) specification.

## Authentication

**Required:** No (public endpoint)

## Headers

No special headers required.

## Response

### Success Response

**Status Code:** `200 OK`

```json
{
  "keys": [
    {
      "kty": "OKP",
      "use": "sig",
      "kid": "key_2024_01_15",
      "alg": "EdDSA",
      "crv": "Ed25519",
      "x": "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key_2024_01_01",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx...",
      "e": "AQAB"
    }
  ]
}
```

## Key Fields

### Common Fields

| Field | Description                                              |
| ----- | -------------------------------------------------------- |
| `kty` | Key type (e.g., "OKP", "RSA")                            |
| `use` | Key use ("sig" for signature verification)               |
| `kid` | Key ID (used in JWT header to identify which key to use) |
| `alg` | Algorithm (e.g., "EdDSA", "RS256")                       |

### EdDSA (Ed25519) Keys

| Field | Description                          |
| ----- | ------------------------------------ |
| `crv` | Curve name ("Ed25519")               |
| `x`   | Public key value (base64url encoded) |

### RSA Keys

| Field | Description                  |
| ----- | ---------------------------- |
| `n`   | Modulus (base64url encoded)  |
| `e`   | Exponent (base64url encoded) |

## Key Rotation

Keys are rotated periodically (configured via `JWKS_ROTATE_DAYS`):

- New keys are added to the key set
- Old keys remain in the set during transition period
- Very old keys are eventually removed
- Access tokens include `kid` header to identify signing key

## Code Examples

### cURL

```bash
curl -X GET http://localhost:4000/oauth2/jwks.json
```

### JavaScript (Fetch JWKS)

```javascript
async function fetchJWKS() {
  const response = await fetch('http://localhost:4000/oauth2/jwks.json');

  if (!response.ok) {
    throw new Error('Failed to fetch JWKS');
  }

  return response.json();
}

// Usage
const jwks = await fetchJWKS();
console.log(
  'Available keys:',
  jwks.keys.map((k) => k.kid),
);
```

### JavaScript (Verify JWT with jose library)

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Create JWKS client
const JWKS = createRemoteJWKSet(new URL('http://localhost:4000/oauth2/jwks.json'));

async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'http://localhost:4000',
      audience: 'your-client-id',
    });

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
}

// Usage
try {
  const payload = await verifyAccessToken(accessToken);
  console.log('Valid token for user:', payload.sub);
} catch (error) {
  console.error('Invalid token');
}
```

### TypeScript (Complete Token Verification)

```typescript
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

interface AccessTokenPayload extends JWTPayload {
  sub: string;
  org_id: string;
  roles: string[];
  scope: string;
}

class TokenVerifier {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;

  constructor(issuerUrl: string) {
    this.issuer = issuerUrl;
    this.jwks = createRemoteJWKSet(new URL(`${issuerUrl}/oauth2/jwks.json`));
  }

  async verify(token: string, expectedAudience?: string): Promise<AccessTokenPayload> {
    const options: any = {
      issuer: this.issuer,
    };

    if (expectedAudience) {
      options.audience = expectedAudience;
    }

    const { payload } = await jwtVerify(token, this.jwks, options);

    return payload as AccessTokenPayload;
  }

  async verifyWithScopes(token: string, requiredScopes: string[]): Promise<AccessTokenPayload> {
    const payload = await this.verify(token);

    const tokenScopes = payload.scope?.split(' ') || [];
    const hasAllScopes = requiredScopes.every((scope) => tokenScopes.includes(scope));

    if (!hasAllScopes) {
      throw new Error('Token missing required scopes');
    }

    return payload;
  }
}

// Usage
const verifier = new TokenVerifier('http://localhost:4000');

try {
  const payload = await verifier.verify(accessToken, 'cli_abc123');
  console.log('Valid token:', payload);

  // Check specific scopes
  await verifier.verifyWithScopes(accessToken, ['openid', 'profile']);
} catch (error) {
  console.error('Token validation failed:', error);
}
```

### Node.js Express Middleware

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('http://localhost:4000/oauth2/jwks.json'));

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  jwtVerify(token, JWKS, {
    issuer: 'http://localhost:4000',
  })
    .then(({ payload }) => {
      req.user = payload;
      next();
    })
    .catch((error) => {
      console.error('JWT verification failed:', error);
      res.status(401).json({ error: 'Invalid token' });
    });
}

// Usage
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
```

## Caching

Clients should cache the JWKS response to avoid repeated requests:

- Cache keys for at least 5 minutes
- Refresh cache when encountering unknown `kid`
- Set appropriate cache headers (Cache-Control)

```javascript
class CachedJWKS {
  constructor(jwksUrl, cacheTTL = 300000) {
    this.jwksUrl = jwksUrl;
    this.cacheTTL = cacheTTL;
    this.cache = null;
    this.cacheTime = 0;
  }

  async getKeys() {
    const now = Date.now();

    if (this.cache && now - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    const response = await fetch(this.jwksUrl);
    this.cache = await response.json();
    this.cacheTime = now;

    return this.cache;
  }

  async getKey(kid) {
    const jwks = await this.getKeys();
    return jwks.keys.find((key) => key.kid === kid);
  }
}
```

## Security Considerations

1. **Public Endpoint:** JWKS is publicly accessible
2. **HTTPS Required:** Use HTTPS in production
3. **Key Rotation:** Keys are rotated periodically
4. **Signature Verification:** Always verify token signatures
5. **Claims Validation:** Also validate issuer, audience, expiration

## Related Endpoints

- [POST /oauth2/token](./token.md) - Get signed access tokens
- [POST /oauth2/introspect](./introspect.md) - Validate tokens server-side
- [GET /.well-known/openid-configuration](./discovery.md) - OIDC discovery
