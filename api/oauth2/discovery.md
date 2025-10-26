# OpenID Connect Discovery

Get OpenID Connect configuration metadata.

## Endpoint

```
GET /.well-known/openid-configuration
```

## Description

Returns OpenID Connect discovery metadata describing the capabilities and endpoints of the authorization server. This endpoint follows the [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html) specification.

Clients can use this endpoint to automatically discover the OAuth2/OIDC endpoints and configuration.

## Authentication

**Required:** No (public endpoint)

## Headers

No special headers required.

## Response

### Success Response

**Status Code:** `200 OK`

```json
{
  "issuer": "http://localhost:4000",
  "authorization_endpoint": "http://localhost:4000/oauth2/authorize",
  "token_endpoint": "http://localhost:4000/oauth2/token",
  "userinfo_endpoint": "http://localhost:4000/oauth2/userinfo",
  "jwks_uri": "http://localhost:4000/oauth2/jwks.json",
  "revocation_endpoint": "http://localhost:4000/oauth2/revoke",
  "introspection_endpoint": "http://localhost:4000/oauth2/introspect",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["EdDSA"],
  "scopes_supported": ["openid", "profile", "email", "phone", "address", "offline_access"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post", "none"],
  "code_challenge_methods_supported": ["S256", "plain"]
}
```

## Configuration Fields

### Endpoints

| Field                    | Description                   |
| ------------------------ | ----------------------------- |
| `issuer`                 | Issuer identifier (base URL)  |
| `authorization_endpoint` | OAuth2 authorization endpoint |
| `token_endpoint`         | OAuth2 token endpoint         |
| `userinfo_endpoint`      | OIDC userinfo endpoint        |
| `jwks_uri`               | JWKS endpoint URL             |
| `revocation_endpoint`    | Token revocation endpoint     |
| `introspection_endpoint` | Token introspection endpoint  |

### Supported Features

| Field                                   | Description                      |
| --------------------------------------- | -------------------------------- |
| `response_types_supported`              | OAuth2 response types (["code"]) |
| `grant_types_supported`                 | OAuth2 grant types               |
| `subject_types_supported`               | Subject identifier types         |
| `id_token_signing_alg_values_supported` | Signing algorithms for ID tokens |
| `scopes_supported`                      | Supported OAuth2/OIDC scopes     |
| `token_endpoint_auth_methods_supported` | Client authentication methods    |
| `code_challenge_methods_supported`      | PKCE challenge methods           |

## Code Examples

### cURL

```bash
curl -X GET http://localhost:4000/.well-known/openid-configuration
```

### JavaScript (Fetch Configuration)

```javascript
async function fetchOIDCConfiguration() {
  const response = await fetch('http://localhost:4000/.well-known/openid-configuration');

  if (!response.ok) {
    throw new Error('Failed to fetch OIDC configuration');
  }

  return response.json();
}

// Usage
const config = await fetchOIDCConfiguration();
console.log('Authorization endpoint:', config.authorization_endpoint);
console.log('Token endpoint:', config.token_endpoint);
console.log('Supported scopes:', config.scopes_supported);
```

### TypeScript (OIDC Client with Auto-Discovery)

```typescript
interface OIDCConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  revocation_endpoint: string;
  introspection_endpoint: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported: string[];
}

class OIDCClient {
  private config: OIDCConfiguration | null = null;
  private issuerUrl: string;

  constructor(issuerUrl: string) {
    this.issuerUrl = issuerUrl;
  }

  async discover(): Promise<OIDCConfiguration> {
    if (this.config) {
      return this.config;
    }

    const discoveryUrl = `${this.issuerUrl}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);

    if (!response.ok) {
      throw new Error('OIDC discovery failed');
    }

    this.config = await response.json();
    return this.config;
  }

  async getAuthorizationEndpoint(): Promise<string> {
    const config = await this.discover();
    return config.authorization_endpoint;
  }

  async getTokenEndpoint(): Promise<string> {
    const config = await this.discover();
    return config.token_endpoint;
  }

  async getUserInfoEndpoint(): Promise<string> {
    const config = await this.discover();
    return config.userinfo_endpoint;
  }

  async getSupportedScopes(): Promise<string[]> {
    const config = await this.discover();
    return config.scopes_supported;
  }

  async supportsPKCE(): Promise<boolean> {
    const config = await this.discover();
    return config.code_challenge_methods_supported.includes('S256');
  }
}

// Usage
const client = new OIDCClient('http://localhost:4000');

// Discover and use configuration
const authEndpoint = await client.getAuthorizationEndpoint();
const supportsPKCE = await client.supportsPKCE();

console.log('Authorization endpoint:', authEndpoint);
console.log('PKCE supported:', supportsPKCE);
```

### React Hook for OIDC Discovery

```typescript
import { useEffect, useState } from 'react';

export function useOIDCConfiguration(issuerUrl: string) {
  const [config, setConfig] = useState<OIDCConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(`${issuerUrl}/.well-known/openid-configuration`);

        if (!response.ok) {
          throw new Error('Failed to fetch OIDC configuration');
        }

        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [issuerUrl]);

  return { config, loading, error };
}

// Usage in component
function LoginButton() {
  const { config, loading, error } = useOIDCConfiguration('http://localhost:4000');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleLogin = () => {
    // Use discovered endpoints
    const authUrl = new URL(config!.authorization_endpoint);
    authUrl.searchParams.set('client_id', 'cli_abc123');
    authUrl.searchParams.set('redirect_uri', 'https://app.example.com/callback');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');

    window.location.href = authUrl.toString();
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## Use Cases

1. **Auto-Configuration:** Automatically configure OAuth2/OIDC clients
2. **Endpoint Discovery:** Find authorization, token, and userinfo endpoints
3. **Capability Discovery:** Check supported scopes, grant types, and features
4. **SDK Configuration:** Configure OAuth2 libraries with discovery URL

## Common OIDC Libraries

Many OAuth2/OIDC libraries support automatic discovery:

### JavaScript/TypeScript Libraries

- **oidc-client-ts** (formerly oidc-client-js)
- **@auth0/auth0-spa-js**
- **next-auth** (NextAuth.js)
- **passport-openidconnect** (Passport.js)

### Example with oidc-client-ts

```typescript
import { UserManager } from 'oidc-client-ts';

const userManager = new UserManager({
  authority: 'http://localhost:4000', // Uses /.well-known/openid-configuration
  client_id: 'cli_abc123',
  redirect_uri: 'https://app.example.com/callback',
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: 'https://app.example.com',
});

// Login
await userManager.signinRedirect();

// Handle callback
await userManager.signinRedirectCallback();
```

## Caching

Clients should cache the discovery document:

- Cache for at least 24 hours
- Re-fetch if cached version is old
- Handle failures gracefully

```javascript
class ConfigurationCache {
  constructor(issuerUrl, cacheTTL = 86400000) {
    // 24 hours
    this.issuerUrl = issuerUrl;
    this.cacheTTL = cacheTTL;
    this.cache = null;
    this.cacheTime = 0;
  }

  async getConfiguration() {
    const now = Date.now();

    if (this.cache && now - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }

    const response = await fetch(`${this.issuerUrl}/.well-known/openid-configuration`);
    this.cache = await response.json();
    this.cacheTime = now;

    return this.cache;
  }
}
```

## Security Considerations

1. **HTTPS Required:** Always use HTTPS in production
2. **Validate Issuer:** Verify issuer matches expected value
3. **Cache Configuration:** Reduce discovery requests
4. **Endpoint Validation:** Validate all endpoints use HTTPS

## Related Endpoints

- [GET /oauth2/authorize](./authorize.md) - Authorization endpoint
- [POST /oauth2/token](./token.md) - Token endpoint
- [GET /oauth2/userinfo](./userinfo.md) - UserInfo endpoint
- [GET /oauth2/jwks.json](./jwks.md) - JWKS endpoint
